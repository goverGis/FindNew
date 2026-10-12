import MiniMap from './MiniMap'
import { useCrudItems } from '../hooks/useCrudItems'

/**
 * 业务条目 CRUD 页面（闲置 / 寻物 / 急救 / 讨论 四个页面共用）
 *
 * 四个页面原本各自 300+ 行、结构几乎逐行重复（列表卡 + 表单弹窗 + 地图选点），
 * 差异只有：类型、文案、分类选项、卡片上的额外字段（如价格、紧急度徽章）、状态动作。
 * 差异通过 props / 渲染函数注入，页面本身只剩一份配置（各约 40 行）。
 */
export default function CrudItemsPage({
  // —— 基本身份 ——
  type,
  emoji,
  title,
  color,
  // —— 文案 ——
  publishLabel,
  modalTitleNew,
  modalTitleEdit,
  emptyTitle,
  emptyHint,
  titlePlaceholder,
  descriptionLabel = '📄 描述',
  descriptionPlaceholder,
  contactPlaceholder = '手机号或微信',
  confirmDelete,
  // —— 分类下拉 ——
  categories,
  // —— 表单 / 数据映射 ——
  initialForm,
  toForm,
  toPayload,
  // —— 可选差异 ——
  renderRowExtra,            // 第一行第二个控件（如价格、联系方式）
  showContactField = false,  // 联系方式是否单独成行（默认放在第一行）
  renderCardExtra,           // 卡片上的额外内容（如价格）
  cardStyle,                 // 卡片内联样式（如紧急度左边框）
  categoryStyle,             // 分类徽章内联样式
  showTimestamp = false,
  timestampMode = 'datetime',
  statusAction,              // { value, label, toast }
}) {
  const c = useCrudItems({ type, initialForm, toForm, toPayload, confirmDelete })
  const {
    items, loading, showModal, editingItem, selectedLocation, formData, setField,
    openNew, closeModal, handleEdit, handleSubmit, handleDelete, handleLocationSelect, changeStatus,
  } = c

  const catField = categories?.field || 'category'
  const formatTime = (v) =>
    timestampMode === 'date'
      ? new Date(v).toLocaleDateString()
      : new Date(v).toLocaleString()

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h2>{emoji} {title}</h2>
        </div>
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>{emoji} {title}</h2>
        <button className="btn btn-primary" onClick={openNew}>
          ➕ {publishLabel}
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <MiniMap items={items} type={type} color={color} height="350px" />
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{emoji}</div>
          <h3>{emptyTitle}</h3>
          <p>{emptyHint}</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <div
              key={item.id}
              className="item-card"
              style={cardStyle ? cardStyle(item) : undefined}
            >
              <div className="item-card-content">
                {item.category && (
                  <span
                    className="category"
                    style={categoryStyle ? categoryStyle(item) : undefined}
                  >
                    {categories?.badgeEmoji || '🏷️'} {item.category}
                  </span>
                )}
                <h3>{item.title}</h3>
                <p className="description">{item.description}</p>
                {renderCardExtra && renderCardExtra(item)}
                <div className="meta">
                  <p className="location">
                    {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                  </p>
                  {item.contact && <p className="contact">{item.contact}</p>}
                </div>
                {showTimestamp && item.created_at && (
                  <p className="timestamp">🕐 {formatTime(item.created_at)}</p>
                )}
              </div>
              <div className="actions">
                <button className="btn btn-secondary" onClick={() => handleEdit(item)}>
                  ✏️ 编辑
                </button>
                {statusAction && (
                  <button
                    className="btn btn-primary"
                    onClick={() => changeStatus(item, statusAction.value, statusAction.toast)}
                  >
                    {statusAction.label}
                  </button>
                )}
                <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>
                  🗑️ 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{emoji} {editingItem ? modalTitleEdit : modalTitleNew}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>{categories?.label || '🏷️ 分类'}</label>
                  <select
                    value={formData[catField] ?? ''}
                    onChange={(e) => setField(catField, e.target.value)}
                    required={!!categories?.required}
                  >
                    <option value="">请选择</option>
                    {(categories?.options || []).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                {renderRowExtra && renderRowExtra({ formData, setField })}
              </div>

              <div className="form-group">
                <label>📝 标题 *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setField('title', e.target.value)}
                  required
                  placeholder={titlePlaceholder}
                />
              </div>

              <div className="form-group">
                <label>{descriptionLabel}</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder={descriptionPlaceholder}
                />
              </div>

              {showContactField && (
                <div className="form-group">
                  <label>📞 联系方式</label>
                  <input
                    type="text"
                    value={formData.contact || ''}
                    onChange={(e) => setField('contact', e.target.value)}
                    placeholder={contactPlaceholder}
                  />
                </div>
              )}

              <div className="form-group">
                <label>📍 位置（点击地图选择）</label>
                <MiniMap
                  items={items}
                  type={type}
                  color={color}
                  height="220px"
                  onLocationSelect={handleLocationSelect}
                  selectedLocation={selectedLocation}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>🛰️ 纬度</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setField('latitude', parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>🛰️ 经度</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setField('longitude', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? '✏️ 更新' : '➕ 发布'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
