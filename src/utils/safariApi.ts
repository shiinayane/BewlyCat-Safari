export const SAFARI_API_REQUEST = 'BEWLY_API_REQUEST'
export const SAFARI_API_RESPONSE = 'BEWLY_API_RESPONSE'

export interface SafariApiDefinition {
  url: string
  method: 'post'
  headers?: Record<string, string>
  body?: Record<string, unknown>
  params?: Record<string, unknown>
}

const FORM_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
}

// Safari rejects these cookie-authenticated writes when they originate from the
// extension background context. Keep this list intentionally narrow: all other
// APIs continue to use the upstream background-message path.
export const SAFARI_MAIN_WORLD_API_DEFINITIONS = {
  'auth.logout': {
    url: 'https://passport.bilibili.com/login/exit/v2',
    method: 'post',
    headers: FORM_HEADERS,
    body: { biliCSRF: '' },
    params: { biliCSRF: '' },
  },
  'watchlater.saveToWatchLater': {
    url: 'https://api.bilibili.com/x/v2/history/toview/add',
    method: 'post',
    headers: FORM_HEADERS,
    body: { aid: 0, bvid: '', csrf: '' },
  },
  'watchlater.removeFromWatchLater': {
    url: 'https://api.bilibili.com/x/v2/history/toview/del',
    method: 'post',
    headers: FORM_HEADERS,
    body: { viewed: false, csrf: '' },
    params: { aid: 0 },
  },
  'watchlater.clearAllWatchLater': {
    url: 'https://api.bilibili.com/x/v2/history/toview/clear',
    method: 'post',
    headers: FORM_HEADERS,
    body: { csrf: '' },
  },
  'history.deleteHistoryItem': {
    url: 'https://api.bilibili.com/x/v2/history/delete',
    method: 'post',
    headers: FORM_HEADERS,
    body: { kid: '', csrf: '' },
  },
  'history.clearAllHistory': {
    url: 'https://api.bilibili.com/x/v2/history/clear',
    method: 'post',
    headers: FORM_HEADERS,
    body: { csrf: '' },
  },
  'history.setHistoryPauseStatus': {
    url: 'https://api.bilibili.com/x/v2/history/shadow/set',
    method: 'post',
    headers: FORM_HEADERS,
    body: { switch: false, csrf: '' },
  },
  'favorite.patchDelFavoriteResources': {
    url: 'https://api.bilibili.com/x/v3/fav/resource/batch-del',
    method: 'post',
    headers: FORM_HEADERS,
    body: { resources: '', media_id: 0, platform: 'web', csrf: '' },
  },
  'favorite.moveFavoriteResources': {
    url: 'https://api.bilibili.com/x/v3/fav/resource/move',
    method: 'post',
    headers: FORM_HEADERS,
    body: { resources: '', src_media_id: 0, tar_media_id: 0, mid: '', platform: 'web', csrf: '' },
  },
  'favorite.copyFavoriteResources': {
    url: 'https://api.bilibili.com/x/v3/fav/resource/copy',
    method: 'post',
    headers: FORM_HEADERS,
    body: { resources: '', src_media_id: 0, tar_media_id: 0, mid: '', platform: 'web', csrf: '' },
  },
  'favorite.editFavoriteFolder': {
    url: 'https://api.bilibili.com/x/v3/fav/folder/edit',
    method: 'post',
    headers: FORM_HEADERS,
    body: { media_id: 0, title: '', platform: 'web', csrf: '' },
  },
  'favorite.delFavoriteFolder': {
    url: 'https://api.bilibili.com/x/v3/fav/folder/del',
    method: 'post',
    headers: FORM_HEADERS,
    body: { media_ids: '', platform: 'web', csrf: '' },
  },
  'favorite.unfavFavoriteSeason': {
    url: 'https://api.bilibili.com/x/v3/fav/season/unfav',
    method: 'post',
    headers: FORM_HEADERS,
    body: { season_id: 0, platform: 'web', csrf: '' },
  },
  'moment.setMomentLike': {
    url: 'https://api.bilibili.com/x/dynamic/feed/dyn/thumb',
    method: 'post',
    headers: JSON_HEADERS,
    body: {
      dyn_id_str: '',
      up: 1,
      spmid: '333.1369.0.0',
      from_spmid: '333.999.0.0',
    },
    params: { csrf: '' },
  },
  'video.webDislikeVideo': {
    url: 'https://api.bilibili.com/x/web-interface/feedback/dislike',
    method: 'post',
    headers: FORM_HEADERS,
    body: {
      app_id: 100,
      platform: 5,
      from_spmid: '',
      spmid: '333.1007.0.0',
      goto: 'av',
      id: 0,
      mid: 0,
      track_id: '',
      feedback_page: 1,
      reason_id: 1,
      csrf: '',
    },
  },
  'user.relationModify': {
    url: 'https://api.bilibili.com/x/relation/modify',
    method: 'post',
    headers: FORM_HEADERS,
    body: { fid: '', act: 1, re_src: 11, csrf: '' },
  },
  'user.exchangeCoupon': {
    url: 'https://api.bilibili.com/x/vip/privilege/receive',
    method: 'post',
    headers: FORM_HEADERS,
    body: { type: '1', csrf: '' },
  },
  'user.receiveVipExp': {
    url: 'https://api.bilibili.com/x/vip/experience/add',
    method: 'post',
    headers: FORM_HEADERS,
    body: { csrf: '' },
  },
} satisfies Record<string, SafariApiDefinition>

export function getSafariMainWorldApiKey(namespace: string, apiName: string): string {
  return `${namespace}.${apiName}`
}

export function getSafariMainWorldApiDefinition(
  namespace: string,
  apiName: string,
): SafariApiDefinition | undefined {
  const key = getSafariMainWorldApiKey(namespace, apiName)
  return SAFARI_MAIN_WORLD_API_DEFINITIONS[key as keyof typeof SAFARI_MAIN_WORLD_API_DEFINITIONS]
}

export function shouldUseSafariMainWorldBridge(namespace: string | symbol, apiName: string | symbol): boolean {
  return typeof namespace === 'string'
    && typeof apiName === 'string'
    && getSafariMainWorldApiDefinition(namespace, apiName) !== undefined
}
