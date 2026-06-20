import { describe, expect, it } from 'vitest'

import { shouldUseSafariMainWorldBridge } from '~/utils/safariApi'

describe('safari API bridge routing', () => {
  it('routes known CSRF-sensitive Safari actions through the main-world bridge', () => {
    expect(shouldUseSafariMainWorldBridge('watchlater', 'saveToWatchLater')).toBe(true)
    expect(shouldUseSafariMainWorldBridge('history', 'deleteHistoryItem')).toBe(true)
    expect(shouldUseSafariMainWorldBridge('user', 'relationModify')).toBe(true)
    expect(shouldUseSafariMainWorldBridge('video', 'webDislikeVideo')).toBe(true)
  })

  it('keeps normal GET-style APIs on the background path', () => {
    expect(shouldUseSafariMainWorldBridge('video', 'getVideoInfo')).toBe(false)
    expect(shouldUseSafariMainWorldBridge('user', 'getUserInfo')).toBe(false)
    expect(shouldUseSafariMainWorldBridge('favorite', 'getFavoriteCategories')).toBe(false)
  })
})
