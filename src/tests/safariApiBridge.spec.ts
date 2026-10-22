import { afterEach, describe, expect, it, vi } from 'vitest'

import { executeSafariApiRequest } from '~/inject/safariApiBridge'
import {
  SAFARI_MAIN_WORLD_API_DEFINITIONS,
  shouldUseSafariMainWorldBridge,
} from '~/utils/safariApi'
import { isSafariRuntime } from '~/utils/safariRuntime'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('safari API bridge routing', () => {
  it('keeps the main-world surface limited to current CSRF-sensitive writes', () => {
    expect(Object.keys(SAFARI_MAIN_WORLD_API_DEFINITIONS)).toEqual([
      'auth.logout',
      'watchlater.saveToWatchLater',
      'watchlater.removeFromWatchLater',
      'watchlater.clearAllWatchLater',
      'history.deleteHistoryItem',
      'history.clearAllHistory',
      'history.setHistoryPauseStatus',
      'favorite.patchDelFavoriteResources',
      'favorite.moveFavoriteResources',
      'favorite.copyFavoriteResources',
      'favorite.editFavoriteFolder',
      'favorite.delFavoriteFolder',
      'favorite.unfavFavoriteSeason',
      'favorite.updateVideoFavorites',
      'moment.setMomentLike',
      'moment.setMomentCommentLike',
      'moment.addMomentComment',
      'moment.deleteMomentComment',
      'moment.reportMoment',
      'video.webDislikeVideo',
      'user.relationModify',
      'user.exchangeCoupon',
      'user.receiveVipExp',
    ])
  })

  it('routes by namespace and method instead of method name alone', () => {
    expect(shouldUseSafariMainWorldBridge('watchlater', 'saveToWatchLater')).toBe(true)
    expect(shouldUseSafariMainWorldBridge('favorite', 'moveFavoriteResources')).toBe(true)
    expect(shouldUseSafariMainWorldBridge('moment', 'setMomentLike')).toBe(true)
    expect(shouldUseSafariMainWorldBridge('video', 'getVideoInfo')).toBe(false)
    expect(shouldUseSafariMainWorldBridge('other', 'saveToWatchLater')).toBe(false)
  })

  it('matches the background favorite write contract', async () => {
    const json = vi.fn().mockResolvedValue({ code: 0 })
    const fetchMock = vi.fn().mockResolvedValue({ json })
    vi.stubGlobal('fetch', fetchMock)

    await executeSafariApiRequest('favorite', 'patchDelFavoriteResources', {
      resources: '1:2',
      media_id: 3,
      csrf: 'token',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/v3/fav/resource/batch-del',
      expect.objectContaining({
        method: 'post',
        credentials: 'include',
        body: 'resources=1%3A2&media_id=3&platform=web&csrf=token',
      }),
    )
  })

  it('omits empty comment form fields like the background serializer', async () => {
    const json = vi.fn().mockResolvedValue({ code: 0 })
    const fetchMock = vi.fn().mockResolvedValue({ json })
    vi.stubGlobal('fetch', fetchMock)

    await executeSafariApiRequest('moment', 'addMomentComment', {
      oid: '42',
      type: 11,
      root: '',
      parent: '',
      message: 'hi',
      at_name_to_mid: '',
      pictures: '',
      sync_to_dynamic: '',
      csrf: 'token',
    })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.bilibili.com/x/v2/reply/add')
    const body = new URLSearchParams(init.body)
    expect(Object.fromEntries(body)).toEqual({
      type: '11',
      oid: '42',
      message: 'hi',
      plat: '1',
      gaia_source: 'main_web',
      statistics: JSON.stringify({ appId: 100, platform: 5 }),
      csrf: 'token',
    })
  })

  it('preserves JSON bodies and query CSRF parameters', async () => {
    const json = vi.fn().mockResolvedValue({ code: 0 })
    const fetchMock = vi.fn().mockResolvedValue({ json })
    vi.stubGlobal('fetch', fetchMock)

    await executeSafariApiRequest('moment', 'setMomentLike', {
      dyn_id_str: '123',
      up: 2,
      csrf: 'token',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/dynamic/feed/dyn/thumb?csrf=token',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dyn_id_str: '123',
          up: 2,
          spmid: '333.1369.0.0',
          from_spmid: '333.999.0.0',
        }),
      }),
    )
  })
})

describe('safari runtime detection', () => {
  it('accepts Safari and excludes Chromium-family browsers', () => {
    expect(isSafariRuntime({
      userAgent: 'Mozilla/5.0 Version/18.5 Safari/605.1.15',
      vendor: 'Apple Computer, Inc.',
    })).toBe(true)
    expect(isSafariRuntime({
      userAgent: 'Mozilla/5.0 CriOS/138.0 Mobile Safari/604.1',
      vendor: 'Apple Computer, Inc.',
    })).toBe(false)
  })
})
