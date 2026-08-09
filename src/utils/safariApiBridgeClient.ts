import { SAFARI_API_REQUEST, SAFARI_API_RESPONSE } from '~/utils/safariApi'

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
  timeout: ReturnType<typeof setTimeout>
}

const pendingRequests = new Map<string, PendingRequest>()
let requestIdCounter = 0
let responseListenerInstalled = false

function ensureResponseListener() {
  if (responseListenerInstalled || typeof window === 'undefined')
    return

  responseListenerInstalled = true
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || typeof event.data !== 'object')
      return

    const { type, requestId, data, error } = event.data
    if (type !== SAFARI_API_RESPONSE || typeof requestId !== 'string')
      return

    const pending = pendingRequests.get(requestId)
    if (!pending)
      return

    pendingRequests.delete(requestId)
    clearTimeout(pending.timeout)
    if (typeof error === 'string')
      pending.reject(new Error(error))
    else
      pending.resolve(data)
  })
}

export function requestSafariMainWorldApi(
  namespace: string,
  apiName: string,
  options?: object,
): Promise<unknown> {
  ensureResponseListener()

  return new Promise((resolve, reject) => {
    const requestId = `bewly_api_${++requestIdCounter}_${Date.now()}`
    const timeout = setTimeout(() => {
      if (!pendingRequests.delete(requestId))
        return
      reject(new Error('Safari API request timeout'))
    }, 30000)

    pendingRequests.set(requestId, { resolve, reject, timeout })
    window.postMessage({
      type: SAFARI_API_REQUEST,
      requestId,
      namespace,
      apiName,
      options,
    }, '*')
  })
}
