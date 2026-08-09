// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'

import { copyText, hasClipboardWrite } from '~/utils/clipboard'

const originalSafari = process.env.SAFARI
const originalFirefox = process.env.FIREFOX

afterEach(() => {
  if (originalSafari === undefined)
    delete process.env.SAFARI
  else
    process.env.SAFARI = originalSafari

  if (originalFirefox === undefined)
    delete process.env.FIREFOX
  else
    process.env.FIREFOX = originalFirefox

  vi.restoreAllMocks()
  vi.resetModules()
})

describe('safari compatibility', () => {
  it('includes cookies permission in Safari manifest builds', async () => {
    process.env.SAFARI = 'true'
    process.env.FIREFOX = 'false'

    vi.resetModules()
    const { getManifest } = await import('~/manifest')
    const manifest = await getManifest()

    expect(manifest.permissions).toContain('cookies')
    expect(manifest.permissions).not.toContain('webRequest')
  })

  it('detects clipboard write support safely', () => {
    expect(hasClipboardWrite(undefined)).toBe(false)
    expect(hasClipboardWrite({})).toBe(false)
    expect(hasClipboardWrite({ writeText: vi.fn() })).toBe(true)
  })

  it('falls back to execCommand copy when clipboard API is unavailable', async () => {
    const execCommand = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    })
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })

    await expect(copyText('bewly')).resolves.toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
  })
})
