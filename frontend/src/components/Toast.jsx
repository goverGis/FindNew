import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

/**
 * 轻量全局提示（toast）
 *
 * 用法：任意模块 `import { toast } from '../components/Toast'`
 *       toast.success('保存成功') / toast.error('删除失败：...') / toast.info(...) / toast.warning(...)
 *
 * 无需 Provider 包裹：模块级维护一个队列，由挂载在 #toast-root 的宿主组件订阅渲染，
 * 因此纯函数、事件回调、非组件模块里都能直接调用。
 */

const DEFAULT_DURATION = { success: 2600, info: 2600, warning: 3600, error: 4200 }

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.6 2.6L16 9.5" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v6" />
      <path d="M12 16.4v.2" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.5 21 19.5H3z" />
      <path d="M12 10v4" />
      <path d="M12 17v.2" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.8v.2" />
    </svg>
  ),
}

let queue = []
let listeners = new Set()
let seq = 0
const timers = new Map()

function emit() {
  const snapshot = [...queue]
  listeners.forEach((fn) => fn(snapshot))
}

function dismiss(id) {
  queue = queue.filter((t) => t.id !== id)
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
  emit()
}

function push(type, message, duration) {
  const id = ++seq
  queue = [...queue, { id, type, message: String(message || '') }]
  emit()
  const ms = typeof duration === 'number' ? duration : DEFAULT_DURATION[type] || 3000
  timers.set(id, setTimeout(() => dismiss(id), ms))
  return id
}

export const toast = {
  success: (message, duration) => push('success', message, duration),
  error: (message, duration) => push('error', message, duration),
  warning: (message, duration) => push('warning', message, duration),
  info: (message, duration) => push('info', message, duration),
  dismiss,
  clear: () => {
    queue = []
    timers.forEach((t) => clearTimeout(t))
    timers.clear()
    emit()
  },
}

function ToastHost() {
  const [list, setList] = useState(queue)

  useEffect(() => {
    const fn = (next) => setList(next)
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])

  if (!list.length) return null

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)} title="点击关闭">
          <span className="toast-icon">{ICONS[t.type]}</span>
          <span className="toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  )
}

let mounted = false

/** 在应用入口调用一次，把 toast 宿主挂到 body 上 */
export function mountToastHost() {
  if (mounted || typeof document === 'undefined') return
  mounted = true
  let el = document.getElementById('toast-root')
  if (!el) {
    el = document.createElement('div')
    el.id = 'toast-root'
    document.body.appendChild(el)
  }
  createRoot(el).render(<ToastHost />)
}

export default toast
