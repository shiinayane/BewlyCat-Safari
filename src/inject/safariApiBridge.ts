import {
  getSafariMainWorldApiDefinition,
  SAFARI_API_REQUEST,
  SAFARI_API_RESPONSE,
} from '~/utils/safariApi'
import { isSafariRuntime } from '~/utils/safariRuntime'

let isSetup = false

function appendSearchParams(url: string, params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '')
      searchParams.append(key, String(value))
  })
  return searchParams.size ? `${url}?${searchParams.toString()}` : url
}

function encodeFormBody(body: Record<string, unknown>): string {
  const bodyParams = new URLSearchParams()
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '')
      bodyParams.append(key, String(value))
  })
  return bodyParams.toString()
}

export async function executeSafariApiRequest(
  namespace: string,
  apiName: string,
  options: Record<string, unknown> = {},
): Promise<unknown> {
  const definition = getSafariMainWorldApiDefinition(namespace, apiName)
  if (!definition)
    throw new Error(`Unknown Safari API: ${namespace}.${apiName}`)

  const params = { ...definition.params }
  const body = { ...definition.body }
  Object.entries(options).forEach(([key, value]) => {
    if (key in body)
      body[key] = value
    else
      params[key] = value
  })

  const response = await fetch(appendSearchParams(definition.url, params), {
    method: definition.method,
    headers: definition.headers,
    credentials: 'include',
    body: encodeFormBody(body) || undefined,
  })
  return response.json()
}

export function setupSafariApiBridge() {
  if (isSetup || !isSafariRuntime())
    return

  isSetup = true
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || typeof event.data !== 'object')
      return

    const { type, requestId, namespace, apiName, options } = event.data
    if (
      type !== SAFARI_API_REQUEST
      || typeof requestId !== 'string'
      || typeof namespace !== 'string'
      || typeof apiName !== 'string'
    ) {
      return
    }

    void executeSafariApiRequest(namespace, apiName, options)
      .then((data) => {
        window.postMessage({ type: SAFARI_API_RESPONSE, requestId, data }, '*')
      })
      .catch((error) => {
        window.postMessage({
          type: SAFARI_API_RESPONSE,
          requestId,
          error: error instanceof Error ? error.message : String(error),
        }, '*')
      })
  })
}
