/**
 * 统一网络请求助手
 *
 * 为什么需要它：原生 fetch 只有网络中断才 reject，HTTP 4xx/5xx 依然 resolve，
 * 所以页面里 `try { await fetch(...) } catch {}` 对服务端报错毫无感知，失败会被静默吞掉。
 * 这里把「网络错误」和「HTTP 错误」统一转成带可读信息的异常，交给 toast 提示用户。
 */

const BACKEND_HINT = '请确认后端服务（FastAPI :8000）已启动'

/** 发起请求；返回 ok 的 Response，否则抛出带服务端 detail 的 Error */
export async function apiFetch(url, options = {}) {
  let res
  try {
    res = await fetch(url, options)
  } catch (err) {
    throw new Error(`网络请求失败，${BACKEND_HINT}`)
  }

  if (!res.ok) {
    let detail = ''
    try {
      const data = await res.json()
      detail = data?.detail || data?.message || data?.error || ''
    } catch (_) {
      /* 响应体不是 JSON，忽略，回退到状态码提示 */
    }
    throw new Error(detail ? `${detail}（HTTP ${res.status}）` : `请求失败：HTTP ${res.status}`)
  }

  return res
}

/** 发起请求并解析 JSON；解析失败返回 null 而不抛错 */
export async function apiJson(url, options = {}) {
  const res = await apiFetch(url, options)
  try {
    return await res.json()
  } catch (_) {
    return null
  }
}

/** 把任意异常转成可展示给用户的中文文案 */
export function errMessage(err, fallback = '操作失败') {
  if (!err) return fallback
  if (typeof err === 'string') return err
  const msg = err.message || String(err)
  return msg || fallback
}
