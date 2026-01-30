import type { API_COLLECTION } from '~/background/messageListeners/api'
import { sendMessage } from '~/utils/messaging'

type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : Lowercase<S>

type APIFunction<T = typeof API_COLLECTION> = {
  [K in keyof T as CamelCase<string & K>]: {
    // @ts-expect-error allow params
    [P in keyof T[K]]: T[K][P] extends (...args: any[]) => any ? T[K][P] : Lowercase<T[K][P]['_fetch']['method']> extends 'get' ? (options?: Partial<T[K][P]['params']>) => Promise<any> : (options?: Partial<T[K][P]['params'] & T[K][P]['_fetch']['body']>) => Promise<any>
  }
}

// eslint-disable-next-line ts/no-unsafe-declaration-merging
export interface APIClient extends APIFunction<typeof API_COLLECTION> {

}

/**
 * 运行时检测是否是 Safari 浏览器
 */
function isSafariRuntime(): boolean {
  const ua = navigator.userAgent
  const vendor = navigator.vendor
  const isSafari = /Safari/i.test(ua)
  const isChromeLike = /Chrome|Chromium|Edg/i.test(ua)
  return isSafari && !isChromeLike && /Apple/i.test(vendor)
}

// Safari 专用：通过 inject 脚本（MAIN world）发起请求的 Promise 管理
const pendingRequests = new Map<string, { resolve: (value: any) => void, reject: (reason?: any) => void }>()
let requestIdCounter = 0

/**
 * Safari 专用：通过 inject 脚本发起请求
 * 因为 inject 脚本运行在 MAIN world，所以请求的 Origin 是 bilibili.com
 */
function safariInjectRequest(apiName: string, options?: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const requestId = `bewly_api_${++requestIdCounter}_${Date.now()}`
    pendingRequests.set(requestId, { resolve, reject })

    // 设置超时
    const timeout = setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId)
        reject(new Error('Safari API request timeout'))
      }
    }, 30000)

    // 发送消息给 inject 脚本
    window.postMessage({
      type: 'BEWLY_API_REQUEST',
      requestId,
      apiName,
      options,
    }, '*')

    // 保存 timeout ID 以便清理
    const entry = pendingRequests.get(requestId)
    if (entry) {
      (entry as any).timeout = timeout
    }
  })
}

// 监听来自 inject 脚本的响应
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    if (event.source !== window)
      return

    const { type, requestId, data, error } = event.data

    if (type === 'BEWLY_API_RESPONSE' && requestId) {
      const pending = pendingRequests.get(requestId)
      if (pending) {
        pendingRequests.delete(requestId)
        if ((pending as any).timeout) {
          clearTimeout((pending as any).timeout)
        }
        if (error) {
          pending.reject(new Error(error))
        }
        else {
          pending.resolve(data)
        }
      }
    }
  })
}

// eslint-disable-next-line ts/no-unsafe-declaration-merging
export class APIClient {
  private readonly cache = new Map<string | symbol, any>()
  private readonly isSafari = isSafariRuntime()

  constructor() {
    // @ts-expect-error ignore
    return new Proxy({}, {
      get: (_, namespace) => { // namespace
        if (this.cache.has(namespace)) {
          return this.cache.get(namespace)
        }
        else {
          const isSafari = this.isSafari
          const api = new Proxy({}, {
            get(_, p) {
              return (options?: object) => {
                // Safari: 对于 watchlater 相关 API，通过 inject 脚本发起请求
                if (isSafari && namespace === 'watchlater') {
                  return safariInjectRequest(p as string, options)
                }
                // 其他情况：通过 background 请求
                return sendMessage(p as string, {
                  contentScriptQuery: p as string,
                  ...options,
                })
              }
            },
          })
          this.cache.set(namespace, api)
          return api
        }
      },
    })
  }
}

const api = new APIClient()

export default api
