"""统计接口：契约与旧 Express 后端保持同构，前端 /api/stats 无需改动。"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.cache import ttl_cache, invalidate, register_invalidator
from app.core.database import get_db
from app.models.event import Event
from app.schemas.event import StatsOut

router = APIRouter(tags=["stats"])

STATS_TTL = 60.0  # 秒；事件写入时由 invalidate_stats() 主动失效


def _count_by_type(db: Session) -> dict[str, int]:
    rows = db.execute(
        select(Event.type, func.count()).group_by(Event.type)
    ).all()
    counts = {t: 0 for t in ("secondhand", "lostfound", "emergency", "discussion")}
    for event_type, n in rows:
        counts[event_type] = n
    return counts


@ttl_cache(seconds=STATS_TTL, ignore_args=True)
def _compute_stats(db: Session) -> dict:
    """实际查库逻辑。

    ignore_args=True：db 每次请求都是新 Session，若纳入缓存键将永远 miss。
    """
    counts = _count_by_type(db)
    total = db.scalar(select(func.count()).select_from(Event)) or 0
    active = (
        db.scalar(select(func.count()).where(Event.status == "active")) or 0
    )
    return {"total": total, "active": active, **counts}


def invalidate_stats() -> None:
    """事件写入后调用，避免统计结果陈旧。"""
    invalidate(_compute_stats)


@router.get("/stats", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)) -> StatsOut:
    return StatsOut(**_compute_stats(db))


# 注册到全局失效广播：写事件的接口无需 import 本模块
register_invalidator(invalidate_stats)
