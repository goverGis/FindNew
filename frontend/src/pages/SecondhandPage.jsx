import CrudItemsPage from '../components/CrudItemsPage'

const CATEGORIES = ['电子产品', '家具', '服装', '书籍', '运动器材', '宠物', '其他']

const INITIAL_FORM = { title: '', description: '', category: '', price: '', contact: '' }

export default function SecondhandPage() {
  return (
    <CrudItemsPage
      type="secondhand"
      emoji="📦"
      title="闲置物品信息"
      color="#667eea"
      publishLabel="发布物品"
      modalTitleNew="发布闲置物品"
      modalTitleEdit="编辑物品"
      emptyTitle="暂无闲置物品"
      emptyHint='点击"发布物品"添加您的第一个闲置物品'
      titlePlaceholder="物品名称"
      descriptionPlaceholder="物品详情描述..."
      confirmDelete="确定要删除这个物品吗？"
      categories={{ label: '🏷️ 分类', options: CATEGORIES, field: 'category' }}
      initialForm={INITIAL_FORM}
      toForm={(item) => ({
        title: item.title,
        description: item.description || '',
        category: item.category || '',
        price: item.price || '',
        contact: item.contact || '',
      })}
      toPayload={(fd) => ({ ...fd, price: fd.price ? parseFloat(fd.price) : null })}
      // 第一行第二个控件：价格
      renderRowExtra={({ formData, setField }) => (
        <div className="form-group">
          <label>💰 价格（元）</label>
          <input
            type="number"
            value={formData.price || ''}
            onChange={(e) => setField('price', e.target.value)}
            placeholder="0"
          />
        </div>
      )}
      showContactField
      renderCardExtra={(item) =>
        item.price ? (
          <div className="price">
            <span>¥</span>{item.price}
          </div>
        ) : null
      }
      statusAction={{ value: 'sold', label: '✅ 已出', toast: '已标记为已售出' }}
    />
  )
}
