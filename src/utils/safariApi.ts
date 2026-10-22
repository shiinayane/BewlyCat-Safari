export const SAFARI_API_REQUEST = 'BEWLY_API_REQUEST'
export const SAFARI_API_RESPONSE = 'BEWLY_API_RESPONSE'

export interface SafariApiDefinition {
  url: string
  method: 'post'
  headers?: Record<string, string>
  body?: Record<string, unknown>
  params?: Record<string, unknown>
  bodySerializer?: (body: Record<string, unknown>) => BodyInit
}

const FORM_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
}

// 与后台 moment.ts 的 serializeMomentVoteBody 一致：动态 id 超出安全整数，需按原文拼入 JSON。
function serializeMomentVoteBody(body: Record<string, unknown>) {
  const dynamicId = String(body.dynamic_id ?? '')
  const serializedDynamicId = /^\d+$/.test(dynamicId) ? dynamicId : '0'
  const { dynamic_id: _dynamicId, ...rest } = body
  const serializedRest = JSON.stringify(rest)
  return `${serializedRest.slice(0, -1)},"dynamic_id":${serializedDynamicId}}`
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
    body: { media_id: 0, title: '', privacy: 0, platform: 'web', csrf: '' },
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
  'favorite.unfavFavoriteFolder': {
    url: 'https://api.bilibili.com/x/v3/fav/folder/unfav',
    method: 'post',
    headers: FORM_HEADERS,
    body: { media_id: 0, platform: 'web', csrf: '' },
  },
  'favorite.updateVideoFavorites': {
    url: 'https://api.bilibili.com/x/v3/fav/resource/deal',
    method: 'post',
    headers: FORM_HEADERS,
    body: { rid: 0, type: 2, add_media_ids: '', del_media_ids: '', platform: 'web', csrf: '' },
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
  'moment.setMomentCommentLike': {
    url: 'https://api.bilibili.com/x/v2/reply/action',
    method: 'post',
    headers: FORM_HEADERS,
    body: { type: 17, oid: '', rpid: '', action: 1, csrf: '' },
  },
  'moment.addMomentComment': {
    url: 'https://api.bilibili.com/x/v2/reply/add',
    method: 'post',
    headers: FORM_HEADERS,
    // 与后台 serializeCommentForm 一致：空 root/parent 等字段由 encodeFormBody 省略。
    body: {
      type: 17,
      oid: '',
      root: '',
      parent: '',
      message: '',
      plat: 1,
      at_name_to_mid: '',
      pictures: '',
      sync_to_dynamic: '',
      gaia_source: 'main_web',
      statistics: JSON.stringify({ appId: 100, platform: 5 }),
      csrf: '',
    },
  },
  'moment.deleteMomentComment': {
    url: 'https://api.bilibili.com/x/v2/reply/del',
    method: 'post',
    headers: FORM_HEADERS,
    body: { type: 17, oid: '', rpid: '', csrf: '' },
  },
  'moment.checkRepost': {
    url: 'https://api.bilibili.com/x/dynamic/feed/create/submit_check',
    method: 'post',
    headers: JSON_HEADERS,
    body: { content: {}, scene: 4, attach_card: undefined },
    params: { csrf: '' },
  },
  'moment.submitRepost': {
    url: 'https://api.bilibili.com/x/dynamic/feed/create/dyn',
    method: 'post',
    headers: JSON_HEADERS,
    body: { dyn_req: {}, web_repost_src: { dyn_id_str: '' } },
    params: { csrf: '', platform: 'web' },
  },
  'moment.submitMomentVote': {
    url: 'https://api.bilibili.com/x/vote/do_vote',
    method: 'post',
    headers: JSON_HEADERS,
    body: {
      vote_id: 0,
      votes: [],
      voter_uid: 0,
      status: 0,
      op_bit: 0,
      dynamic_id: '',
      csrf: '',
      csrf_token: '',
    },
    params: { csrf: '' },
    bodySerializer: serializeMomentVoteBody,
  },
  'moment.reserveMoment': {
    url: 'https://api.bilibili.com/x/space/reserve',
    method: 'post',
    headers: FORM_HEADERS,
    body: { sid: '', csrf: '' },
  },
  'moment.cancelMomentReservation': {
    url: 'https://api.bilibili.com/x/space/reserve/cancel',
    method: 'post',
    headers: FORM_HEADERS,
    body: { sid: '', csrf: '' },
  },
  'moment.reportMoment': {
    url: 'https://api.bilibili.com/x/dynamic/feed/dynamic_report/add',
    method: 'post',
    headers: JSON_HEADERS,
    body: { accused_uid: 0, dynamic_id: '', reason_type: 0, reason_desc: null },
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
  'user.createFollowingGroup': {
    url: 'https://api.bilibili.com/x/relation/tag/create',
    method: 'post',
    headers: FORM_HEADERS,
    body: { tag: '', csrf: '' },
  },
  'user.renameFollowingGroup': {
    url: 'https://api.bilibili.com/x/relation/tag/update',
    method: 'post',
    headers: FORM_HEADERS,
    body: { tagid: '', name: '', csrf: '' },
  },
  'user.deleteFollowingGroup': {
    url: 'https://api.bilibili.com/x/relation/tag/del',
    method: 'post',
    headers: FORM_HEADERS,
    body: { tagid: '', csrf: '' },
  },
  'user.moveFollowingUsers': {
    url: 'https://api.bilibili.com/x/relation/tags/moveUsers',
    method: 'post',
    headers: FORM_HEADERS,
    body: { beforeTagids: '', afterTagids: '', fids: '', csrf: '' },
  },
  'user.copyFollowingUsers': {
    url: 'https://api.bilibili.com/x/relation/tags/copyUsers',
    method: 'post',
    headers: FORM_HEADERS,
    body: { fids: '', tagids: '', csrf: '' },
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
