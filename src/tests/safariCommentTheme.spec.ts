import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  document.documentElement.removeAttribute('style')
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('safari comment theme adapter', () => {
  it('applies, observes, and clears only variables written by the adapter', async () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 Version/18.5 Safari/605.1.15',
      vendor: 'Apple Computer, Inc.',
    })
    const { updateSafariCommentTheme } = await import('~/utils/safariCommentTheme')

    document.documentElement.style.setProperty('--bg1', '#111')
    document.documentElement.style.setProperty('--text1', '#eee')
    const existingHost = document.createElement('bili-comments')
    existingHost.style.setProperty('--unrelated', 'keep')
    document.body.append(existingHost)

    updateSafariCommentTheme(true)
    expect(existingHost.style.getPropertyValue('--bg1')).toBe('#111')

    const addedHost = document.createElement('bili-user-profile')
    document.body.append(addedHost)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(addedHost.style.getPropertyValue('--text1')).toBe('#eee')

    updateSafariCommentTheme(false)
    expect(existingHost.style.getPropertyValue('--bg1')).toBe('')
    expect(existingHost.style.getPropertyValue('--unrelated')).toBe('keep')
    expect(addedHost.style.getPropertyValue('--text1')).toBe('')
  })
})
