import { describe, expect, it, vi } from 'vitest'

import { openExtensionOptionsPage } from '~/utils/extensionPage'

describe('extension page helpers', () => {
  it('uses runtime.openOptionsPage when available', async () => {
    const openOptionsPage = vi.fn().mockResolvedValue(undefined)
    const create = vi.fn().mockResolvedValue(undefined)
    const getURL = vi.fn((path: string) => `mock://${path}`)

    await openExtensionOptionsPage({
      runtime: { openOptionsPage, getURL },
      tabs: { create },
    } as any)

    expect(openOptionsPage).toHaveBeenCalledOnce()
    expect(create).not.toHaveBeenCalled()
  })

  it('falls back to opening the bundled options page in a new tab', async () => {
    const openOptionsPage = vi.fn().mockRejectedValue(new Error('unsupported'))
    const create = vi.fn().mockResolvedValue(undefined)
    const getURL = vi.fn((path: string) => `mock://${path}`)

    await openExtensionOptionsPage({
      runtime: { openOptionsPage, getURL },
      tabs: { create },
    } as any)

    expect(create).toHaveBeenCalledWith({ url: 'mock://dist/options/index.html' })
  })
})
