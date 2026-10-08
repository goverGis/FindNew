import React from 'react'
import { POI_COLORS, POI_LABELS } from './RegionCardList'

/**
 * CardFilterBar — 片区卡片筛选条（RegionCardList 配套控件）
 * ----------------------------------------------------------------
 * 与 RegionCardList 的 sortBy / statusFilter / poiType / keyword 四个 prop 一一对应，
 * 把"94 张卡片怎么排、怎么筛、怎么找"做进一条自然风控件栏。
 *
 * Props:
 *   value    : { sortBy, statusFilter, poiType, keyword }
 *   onChange : (partial) => void   合并到 value
 *   mode     : 'capacity' | 'poi'   poi 模式才显示「按类型过滤」
 *
 * 状态 cls 与 RegionCardList.statusOf 完全对齐：over/warn/low/ok
 */
const SORTS = [
  { k: 'id', t: '编号' },
  { k: 'load', t: '负载' },
  { k: 'weight', t: '权重' },
  { k: 'points', t: '点数' },
]
const STATUS = [
  { k: 'all', t: '全部' },
  { k: 'over', t: '超载' },
  { k: 'warn', t: '饱和' },
  { k: 'low', t: '低载' },
  { k: 'ok', t: '均衡' },
]

export default function CardFilterBar({ value, onChange, mode = 'capacity' }) {
  const set = (partial) => onChange({ ...value, ...partial })

  return (
    <div className="card-filter-bar">
      <input
        className="cfb-search"
        type="search"
        placeholder="搜索片区号 / 类型…"
        value={value.keyword || ''}
        onChange={(e) => set({ keyword: e.target.value })}
      />

      <div className="cfb-group">
        <span className="cfb-label">排序</span>
        {SORTS.map((s) => (
          <button
            key={s.k}
            className={`cfb-chip${value.sortBy === s.k ? ' is-on' : ''}`}
            onClick={() => set({ sortBy: s.k })}
            type="button"
          >
            {s.t}
          </button>
        ))}
      </div>

      <div className="cfb-group">
        <span className="cfb-label">状态</span>
        {STATUS.map((s) => (
          <button
            key={s.k}
            className={`cfb-chip${value.statusFilter === s.k ? ' is-on' : ''}`}
            onClick={() => set({ statusFilter: s.k })}
            type="button"
          >
            {s.t}
          </button>
        ))}
      </div>

      {mode === 'poi' && (
        <div className="cfb-group">
          <span className="cfb-label">类型</span>
          <button
            className={`cfb-chip${value.poiType == null ? ' is-on' : ''}`}
            onClick={() => set({ poiType: null })}
            type="button"
          >
            全部
          </button>
          {Object.keys(POI_LABELS).map((t) => (
            <button
              key={t}
              className={`cfb-chip${value.poiType === t ? ' is-on' : ''}`}
              style={{ '--c': POI_COLORS[t] }}
              onClick={() => set({ poiType: value.poiType === t ? null : t })}
              type="button"
            >
              {POI_LABELS[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
