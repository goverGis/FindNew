import CrudItemsPage from '../components/CrudItemsPage'

const TOPIC_CATEGORIES = ['社区公告', '邻里互助', '活动组织', '问题反馈', '其他']

const INITIAL_FORM = { title: '', description: '', category: '', contact: '' }

export default function DiscussionPage() {
  return (
    <CrudItemsPage
      type="discussion"
      emoji="💬"
      title="区域讨论"
      color="#2ed573"
      publishLabel="发起讨论"
      modalTitleNew="发起讨论"
      modalTitleEdit="编辑讨论"
      emptyTitle="暂无讨论"
      emptyHint='点击"发起讨论"发起区域话题讨论'
      titlePlaceholder="讨论主题"
      descriptionLabel="📄 内容"
      descriptionPlaceholder="详细描述讨论内容..."
      confirmDelete="确定要删除这条讨论吗？"
      categories={{ label: '🏷️ 分类', options: TOPIC_CATEGORIES, field: 'category' }}
      categoryStyle={() => ({ background: '#e8f5e9', color: '#2e7d32' })}
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
      timestampMode="date"
      statusAction={{ value: 'closed', label: '🔒 结束', toast: '已关闭讨论' }}
    />
  )
}
