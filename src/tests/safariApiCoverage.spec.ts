import { afterEach, describe, expect, it, vi } from 'vitest'

import { API_COLLECTION } from '~/background/messageListeners/api'
import { executeSafariApiRequest } from '~/inject/safariApiBridge'
import type { SafariApiDefinition } from '~/utils/safariApi'
import { SAFARI_MAIN_WORLD_API_DEFINITIONS } from '~/utils/safariApi'

// 后台 API 定义链路会引入扩展运行时，测试中只读取静态定义。
vi.mock('webextension-polyfill', () => ({ default: {} }))
vi.mock('~/utils/messaging', () => ({ onMessage: vi.fn(), sendMessage: vi.fn() }))

interface BackgroundApi {
  url: string
  params?: Record<string, unknown>
  _fetch?: {
    method?: string
    headers?: Record<string, string>
    body?: Record<string, unknown>
    bodySerializer?: (body: Record<string, any>) => BodyInit
  }
}

// 暂不经页面环境转发的写接口，需写明原因；新增条目前先确认转发层能否支持。
const PENDING_SAFARI_BRIDGE: Record<string, string> = {
  'moment.removeMoment': '请求体由 extra 展开拼接，待按实机请求核对后再接入',
  'moment.uploadMomentCommentImage': 'multipart 上传需在页面环境还原文件，待单独实现',
}

const CSRF_KEYS = ['csrf', 'biliCSRF']

function toClientNamespace(key: string) {
  return key.toLowerCase().replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
}

function collectBackgroundApis() {
  const apis = new Map<string, BackgroundApi>()
  Object.entries(API_COLLECTION).forEach(([namespace, group]) => {
    Object.entries(group as Record<string, BackgroundApi>).forEach(([name, api]) => {
      apis.set(`${toClientNamespace(namespace)}.${name}`, api)
    })
  })
  return apis
}

function isCsrfWrite(api: BackgroundApi) {
  if (api._fetch?.method?.toLowerCase() !== 'post')
    return false
  const fields = [...Object.keys(api._fetch.body ?? {}), ...Object.keys(api.params ?? {})]
  return fields.some(field => CSRF_KEYS.includes(field))
}

function isJson(headers?: Record<string, string>) {
  return !headers?.['Content-Type']?.includes('application/x-www-form-urlencoded')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const backgroundApis = collectBackgroundApis()
const bridgedApis = Object.entries(SAFARI_MAIN_WORLD_API_DEFINITIONS) as [string, SafariApiDefinition][]

describe('safari API bridge coverage', () => {
  it('routes every CSRF-authenticated background write through the main world', () => {
    const missing = [...backgroundApis]
      .filter(([key, api]) => isCsrfWrite(api) && !(key in SAFARI_MAIN_WORLD_API_DEFINITIONS) && !(key in PENDING_SAFARI_BRIDGE))
      .map(([key, api]) => `${key} ${api.url}`)

    // 同步 workflow 会从日志中提取此标记行写入 issue。
    expect(missing, `SAFARI_BRIDGE_MISSING: ${missing.join(', ')}`).toEqual([])
  })

  it('keeps pending entries limited to real unbridged writes', () => {
    Object.keys(PENDING_SAFARI_BRIDGE).forEach((key) => {
      const api = backgroundApis.get(key)
      expect(api && isCsrfWrite(api), `${key} is no longer a background CSRF write`).toBe(true)
      expect(key in SAFARI_MAIN_WORLD_API_DEFINITIONS, `${key} is already bridged`).toBe(false)
    })
  })

  it.each(bridgedApis)('%s matches the background definition', (key, definition) => {
    const api = backgroundApis.get(key)
    expect(api, `${key} no longer exists in the background API collection`).toBeDefined()
    expect(isCsrfWrite(api!), `${key} is not a background CSRF write`).toBe(true)
    expect(definition.url).toBe(api!.url)
    expect(isJson(definition.headers)).toBe(isJson(api!._fetch?.headers))
    expect(Object.keys(definition.body ?? {}).sort()).toEqual(Object.keys(api!._fetch?.body ?? {}).sort())
    expect(Object.keys(definition.params ?? {}).sort()).toEqual(Object.keys(api!.params ?? {}).sort())
  })

  // 后台自定义序列化的接口，比较页面环境实际发出的请求体，而不是只看是否声明了序列化函数。
  const SERIALIZED_SAMPLES: Record<string, Record<string, unknown>> = {
    'moment.addMomentComment': { oid: '42', type: 11, root: '', parent: '', message: 'hi', sync_to_dynamic: '', csrf: 'token' },
    'moment.submitMomentVote': { vote_id: 7, votes: [1, 2], voter_uid: 3, dynamic_id: '1234567890123456789', csrf: 'token', csrf_token: 'token' },
  }

  it.each(bridgedApis.filter(([key]) => backgroundApis.get(key)?._fetch?.bodySerializer))('%s encodes its body like the background serializer', async (key) => {
    const sample = SERIALIZED_SAMPLES[key]
    expect(sample, `add a sample for ${key} to SERIALIZED_SAMPLES`).toBeDefined()

    const fetchMock = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue({ code: 0 }) })
    vi.stubGlobal('fetch', fetchMock)
    const [namespace, name] = key.split('.')
    await executeSafariApiRequest(namespace, name, sample)

    const api = backgroundApis.get(key)!
    const expected = api._fetch!.bodySerializer!({ ...api._fetch!.body, ...sample })
    expect(String(fetchMock.mock.calls[0][1].body)).toBe(String(expected))
  })
})
