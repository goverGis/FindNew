"""TTL 缓存单元测试。

不依赖数据库，纯逻辑验证：命中/过期/按 key 区分/忽略入参/失效广播。
"""

import time

import pytest

from app.core.cache import (
    cache_info,
    clear_all,
    invalidate,
    invalidate_registered,
    register_invalidator,
    ttl_cache,
)


@pytest.fixture(autouse=True)
def _clean():
    clear_all()
    yield
    clear_all()


def test_hit_within_ttl():
    calls = {"n": 0}

    @ttl_cache(seconds=10)
    def fn(x):
        calls["n"] += 1
        return x * 2

    assert fn(3) == 6
    assert fn(3) == 6
    assert calls["n"] == 1, "TTL 内重复调用应命中缓存，不应重复计算"


def test_expire_after_ttl():
    calls = {"n": 0}

    @ttl_cache(seconds=0.05)
    def fn():
        calls["n"] += 1
        return calls["n"]

    assert fn() == 1
    assert fn() == 1
    time.sleep(0.08)
    assert fn() == 2, "超过 TTL 后应重新计算"


def test_key_fn_distinguishes_args():
    calls = {"n": 0}

    @ttl_cache(seconds=10, key_fn=lambda k: k)
    def build(k):
        calls["n"] += 1
        return k

    assert build(1) == 1
    assert build(2) == 2
    assert build(1) == 1
    assert calls["n"] == 2, "不同 k 应分别缓存，相同 k 命中"


def test_ignore_args():
    """典型场景：get_stats(db)，db 每次都是新 Session，必须忽略入参。"""
    calls = {"n": 0}

    @ttl_cache(seconds=10, ignore_args=True)
    def fn(db):
        calls["n"] += 1
        return 42

    assert fn(object()) == 42
    assert fn(object()) == 42
    assert calls["n"] == 1


def test_invalidate():
    calls = {"n": 0}

    @ttl_cache(seconds=10)
    def fn():
        calls["n"] += 1
        return calls["n"]

    assert fn() == 1
    assert fn() == 1
    assert invalidate(fn) == 1
    assert fn() == 2, "invalidate 后应重新计算"


def test_registered_invalidator_broadcast():
    calls = {"n": 0}

    @ttl_cache(seconds=10)
    def fn():
        calls["n"] += 1
        return calls["n"]

    fn()
    register_invalidator(lambda: invalidate(fn))

    assert fn() == 1
    assert invalidate_registered() >= 1
    assert fn() == 2, "写接口触发广播后缓存应失效"


def test_cache_info_counts():
    @ttl_cache(seconds=10)
    def fn():
        return 1

    fn()
    fn()
    info = cache_info()
    assert info["entries"] >= 1
    name = f"{fn.__module__}.{fn.__qualname__}"
    assert info["functions"][name]["hit"] >= 1
