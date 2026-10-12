import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '../components/Toast'
import { apiFetch, apiJson, errMessage } from '../lib/api'

/**
 * 业务条目 CRUD 逻辑（闲置 / 寻物 / 急救 / 讨论 四个页面共用）
 *
 * 四个页面的列表、新增、编辑、删除、改状态逻辑此前逐行重复（各约 70 行、共 280 行），
 * 差异只有：type、表单字段映射、提交 payload 转换、删除确认文案。
 * 这里用配置把这些差异收进来，页面只保留 UI 差异。
 */

export const DEFAULT_LAT = 39.9042
export const DEFAULT_LNG = 116.4074

export function useCrudItems({
  type,
  initialForm,
  toForm,
  toPayload = (fd) => fd,
  confirmDelete = '确定要删除吗？',
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)

  // 用 ref 持有 initialForm：页面里通常是内联字面量，若进 useCallback 依赖会导致函数反复重建
  const initialRef = useRef(initialForm)
  const makeEmptyForm = useCallback(
    () => ({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG, ...initialRef.current }),
    []
  )
  const [formData, setFormData] = useState(makeEmptyForm)

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiJson(`/api/items?type=${type}&status=active`)
      setItems(data?.items || data || [])
    } catch (error) {
      toast.error(`加载失败：${errMessage(error)}`)
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const closeModal = useCallback(() => {
    setShowModal(false)
    setEditingItem(null)
    setSelectedLocation(null)
    setFormData(makeEmptyForm())
  }, [makeEmptyForm])

  const openNew = useCallback(() => {
    setEditingItem(null)
    setSelectedLocation(null)
    setFormData(makeEmptyForm())
    setShowModal(true)
  }, [makeEmptyForm])

  const handleEdit = useCallback(
    (item) => {
      setEditingItem(item)
      setFormData({ ...makeEmptyForm(), ...(toForm ? toForm(item) : {}) })
      setSelectedLocation({ latitude: item.latitude, longitude: item.longitude })
      setShowModal(true)
    },
    [makeEmptyForm, toForm]
  )

  const setField = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleLocationSelect = useCallback((location) => {
    setSelectedLocation(location)
    setFormData((prev) => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
    }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items'
      const method = editingItem ? 'PUT' : 'POST'
      await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...toPayload(formData) }),
      })
      toast.success(editingItem ? '修改已保存' : '发布成功')
      closeModal()
      fetchItems()
    } catch (error) {
      toast.error(`保存失败：${errMessage(error)}`)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(confirmDelete)) return
    try {
      await apiFetch(`/api/items/${id}`, { method: 'DELETE' })
      fetchItems()
      toast.success('已删除')
    } catch (error) {
      toast.error(`删除失败：${errMessage(error)}`)
    }
  }

  /** 改状态：已出 / 已找到 / 已处理 / 结束讨论 */
  const changeStatus = async (item, status, successMsg) => {
    try {
      await apiFetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchItems()
      if (successMsg) toast.success(successMsg)
    } catch (error) {
      toast.error(`更新失败：${errMessage(error)}`)
    }
  }

  return {
    items,
    loading,
    showModal,
    editingItem,
    selectedLocation,
    formData,
    setField,
    openNew,
    closeModal,
    handleEdit,
    handleSubmit,
    handleDelete,
    handleLocationSelect,
    changeStatus,
    reload: fetchItems,
  }
}

export default useCrudItems
