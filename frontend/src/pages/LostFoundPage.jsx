import CrudItemsPage from '../components/CrudItemsPage'

const CATEGORIES = ['证件', '电子产品', '钥匙', '宠物', '钱包', '其他']

const INITIAL_FORM = { title: '', description: '', category: '', contact: '' }

export default function LostFoundPage() {
  return (
    <CrudItemsPage
      type="lostfound"
      emoji="🔍"
      title="寻物启事"
      color="#ff4757"
      publishLabel="发布信息"
      modalTitleNew="发布寻物启事"
      modalTitleEdit="编辑信息"
      emptyTitle="暂无寻物启事"
      emptyHint='点击"发布信息"发布寻物或招领信息'
      titlePlaceholder="如：丢失钱包、捡到身份证等"
      descriptionPlaceholder="详细描述物品特征、丢失/拾取地点与时间..."
      confirmDelete="确定要删除这条信息吗？"
      categories={{ label: '🏷️ 分类', options: CATEGORIES, field: 'category' }}
      categoryStyle={() => ({ background: '#ffe0e0', color: '#c62828' })}
      initialForm={INITIAL_FORM}
      toForm={(item) => ({
        title: item.title,
        description: item.description || '',
        category: item.category || '',
        contact: item.contact || '',
      })}
      // 第一行第二个控件：联系方式
      renderRowExtra={({ formData, setField }) => (
        <div className="form-group">
          <label>📞 联系方式</label>
          <input
            type="text"
            value={formData.contact || ''}
            onChange={(e) => setField('contact', e.target.value)}
            placeholder="手机号或微信"
          />
        </div>
      )}
      showTimestamp
      statusAction={{ value: 'found', label: '✅ 已找到', toast: '已标记为已找到' }}
    />
  )
}
