export const SAFARI_MAIN_WORLD_API_NAMES = new Set([
  'saveToWatchLater',
  'removeFromWatchLater',
  'clearAllWatchLater',
  'deleteHistoryItem',
  'clearAllHistory',
  'setHistoryPauseStatus',
  'patchDelFavoriteResources',
  'webDislikeVideo',
  'relationModify',
  'exchangeCoupon',
  'receiveVipExp',
  'logout',
])

export function shouldUseSafariMainWorldBridge(namespace: string | symbol, apiName: string | symbol): boolean {
  return typeof namespace === 'string'
    && typeof apiName === 'string'
    && SAFARI_MAIN_WORLD_API_NAMES.has(apiName)
}
