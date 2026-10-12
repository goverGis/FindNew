"""进程内 TTL 缓存（零依赖，纯标准库）。

用途
----
给「读多写少、查询/计算代价高」的热点接口做短期缓存，典型对象：

- ``/api/stats``        —— 每次请求要全表 count 两次 + group by
- ``/territory/poi-types`` —— 每次请求要 group by 全表
- ``/territory/benchmark`` —— 每次请求要把 4000 点跑 4 个划分算法

这些结果在两次写操作之间不会变化，但每次请求都要付一遍全表代价。

设计取舍
--------
- **不引入 cachetools / Redis**：单进程 uvicorn 足够，避免给项目增加运维负担和依赖。
- **多进程部署时不共享**：每个 worker 各缓存一份，只影响命中率，不影响正确性。
- **写接口必须显式 invalidate**：否则结果最多陈旧 ttl 秒。写事件的地方统一调用
  ``invalidate_event_caches()``。
- **不缓存失败结果**：调用方拿到空结果时应主动 invalidate（见 territory.poi_types_endpoint），
  避免一次数据库抖动把空结果钉住 ttl 秒。
"""

from __future__ import annotations

import functools
import time
from collections import OrderedDict
from typing import Any, Callable, Hashable

# key -> (写入时刻, 值)。OrderedDict 用于 LRU 淘汰。
_STORE: "OrderedDict[Hashable, tuple[float, Any]]" = OrderedDict()

# 函数名 -> {"hit": n, "miss": n}，便于观察命中率
_COUNTERS: dict[str, dict[str, int]] = {}


def _fn_name(fn: Callable) -> str:
    return f"{fn.__module__}.{fn.__qualname__}"


def _make_key(
    name: str,
    args: tuple,
    kwargs: dict,
    ignore_args: bool,
    key_fn: Callable | None,
) -> Hashable:
    if key_fn is not None:
        return (name, key_fn(*args, **kwargs))
    if ignore_args:
        return (name,)
    return (name, args, tuple(sorted(kwargs.items())))


def ttl_cache(
    seconds: float = 60.0,
    *,
    ignore_args: bool = False,
    key_fn: Callable | None = None,
    maxsize: int = 512,
):
    """把函数结果缓存 seconds 秒。

    :param ignore_args: True 时忽略所有入参（适合无参/结果与入参无关的接口，
        例如 ``get_stats(db)`` —— db 每次都是新 Session，必须忽略，否则永远 miss）
    :param key_fn: 自定义键生成，``key_fn(*args, **kwargs) -> hashable``，
        适合「结果只依赖部分入参」的场景，例如 benchmark 只依赖 k
    """

    def deco(fn: Callable) -> Callable:
        name = _fn_name(fn)
        counter = _COUNTERS.setdefault(name, {"hit": 0, "miss": 0})

        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            key = _make_key(name, args, kwargs, ignore_args, key_fn)
            now = time.monotonic()
            hit = _STORE.get(key)
            if hit is not None and now - hit[0] < seconds:
                counter["hit"] += 1
                _STORE.move_to_end(key)
                return hit[1]

            counter["miss"] += 1
            value = fn(*args, **kwargs)
            _STORE[key] = (now, value)
            _STORE.move_to_end(key)
            if len(_STORE) > maxsize:
                _STORE.popitem(last=False)
            return value

        return wrapper

    return deco


def invalidate(fn: Callable) -> int:
    """清除某个被 ``ttl_cache`` 装饰函数的全部缓存条目，返回被清除的条数。"""
    name = _fn_name(fn)
    keys = [k for k in _STORE if isinstance(k, tuple) and k[0] == name]
    for k in keys:
        _STORE.pop(k, None)
    return len(keys)


def clear_all() -> None:
    """清空全部缓存（测试或手动运维用）。"""
    _STORE.clear()


# ---- 失效广播：写接口无需知道具体缓存了哪些函数 ----
# 各读接口在模块加载时把自己的 invalidate 注册进来；写接口统一调用
# invalidate_registered()，避免「写模块 import 读模块」造成的循环依赖。

_INVALIDATORS: list[Callable[[], None]] = []


def register_invalidator(fn: Callable[[], None]) -> None:
    """注册一个失效回调（通常在读接口模块末尾调用）。"""
    if fn not in _INVALIDATORS:
        _INVALIDATORS.append(fn)


def invalidate_registered() -> int:
    """触发全部已注册的失效回调，返回回调个数。写接口调用它。"""
    for fn in list(_INVALIDATORS):
        fn()
    return len(_INVALIDATORS)


def cache_info() -> dict:
    """返回缓存概况，供 /api/health 之类的观测接口使用。"""
    return {
        "entries": len(_STORE),
        "functions": {k: dict(v) for k, v in _COUNTERS.items()},
    }
