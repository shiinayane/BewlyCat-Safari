import type { SafariApiDefinition } from '~/utils/safariApi'
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

function encodeRequestBody(definition: SafariApiDefinition, body: Record<string, unknown>): BodyInit | undefined {
  if (!Object.keys(body).length)
    return undefined
  if (definition.bodySerializer)
    return definition.bodySerializer(body)
  if (definition.headers?.['Content-Type']?.includes('application/json'))
    return JSON.stringify(body)
  return encodeFormBody(body) || undefined
}

export async function executeSafariApiRequest(
  namespace: string,
  apiName: string,
  options: Record<string, unknown> = {},
): Promise<unknown> {
  const definition = getSafariMainWorldApiDefinition(namespace, apiName)
  if (!definition)
    throw new Error(`Unknown Safari API: ${namespace}.${apiName}`)

  // 与后台 apiListenerFactory 的合并规则一致：body 与 params 同时声明的字段两边都写入。
  const defaultParams = definition.params ?? {}
  const defaultBody = definition.body ?? {}
  const params: Record<string, unknown> = { ...defaultParams }
  const body: Record<string, unknown> = { ...defaultBody }
  Object.entries(options).forEach(([key, value]) => {
    if (value === undefined)
      return
    if (defaultBody[key] !== undefined)
      body[key] = value
    if (defaultParams[key] !== undefined)
      params[key] = value
    else if (defaultBody[key] === undefined)
      params[key] = value
  })

  const response = await fetch(appendSearchParams(definition.url, params), {
    method: definition.method,
    headers: definition.headers,
    credentials: 'include',
    body: encodeRequestBody(definition, body),
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
