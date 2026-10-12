import CrudItemsPage from '../components/CrudItemsPage'

const SEVERITY_LEVELS = ['轻度', '中度', '重度', '紧急']
const SEVERITY_STYLES = {
  '轻度': { bg: '#e8f5e9', color: '#2e7d32' },
  '中度': { bg: '#fff3e0', color: '#ef6c00' },
  '重度': { bg: '#ffebee', color: '#c62828' },
  '紧急': { bg: '#f3e5f5', color: '#7b1fa2' }
}

const INITIAL_FORM = { title: '', description: '', severity: '', contact: '' }

export default function EmergencyPage() {
  return (
    <CrudItemsPage
      type="emergency"
      emoji="🚑"
      title="紧急医疗"
      color="#f44336"
      publishLabel="发布求助"
      modalTitleNew="发布紧急求助"
      modalTitleEdit="编辑求助"
      emptyTitle="暂无紧急医疗信息"
      emptyHint='点击"发布求助"发布紧急医疗信息'
      titlePlaceholder="简要描述紧急情况"
      descriptionLabel="📄 详细描述"
      descriptionPlaceholder="详细描述病情或紧急情况..."
      contactPlaceholder="手机号"
      confirmDelete="确定要删除这条紧急信息吗？"
      // 紧急页用 severity 作分类字段，提交时映射为后端的 category
      categories={{
        label: '🚨 紧急程度',
        options: SEVERITY_LEVELS,
        field: 'severity',
        required: true,
        badgeEmoji: '🚨',
      }}
      categoryStyle={(item) => {
        const s = SEVERITY_STYLES[item.category] || SEVERITY_STYLES['轻度']
        return { background: s.bg, color: s.color }
      }}
      cardStyle={(item) => {
        const s = SEVERITY_STYLES[item.category] || SEVERITY_STYLES['轻度']
        return { borderLeft: `5px solid ${s.color}` }
      }}
      initialForm={INITIAL_FORM}
      toForm={(item) => ({
        title: item.title,
        description: item.description || '',
        severity: item.category || '',
        contact: item.contact || '',
      })}
      toPayload={(fd) => ({ ...fd, category: fd.severity })}
      // 第一行第二个控件：联系方式
      renderRowExtra={({ formData, setField }) => (
        <div className="form-group">
          <label>📞 联系方式</label>
          <input
            type="text"
            value={formData.contact || ''}
            onChange={(e) => setField('contact', e.target.value)}
            placeholder="手机号"
          />
        </div>
      )}
      showTimestamp
      statusAction={{ value: 'resolved', label: '✅ 已处理', toast: '已标记为已处理' }}
    />
  )
}
