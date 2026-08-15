import { watch } from 'vue'
import type { Alarms } from 'webextension-polyfill'
import browser from 'webextension-polyfill'

import { appAuthTokens, resetAppAuthTokens } from '~/logic/appAuthStorage'
import { refreshAppAccessToken } from '~/utils/authProvider'

const APP_AUTH_REFRESH_ALARM = 'bewly-app-auth-refresh'
const CHECK_INTERVAL_MINUTES = 5
const REFRESH_BUFFER = 10 * 60 * 1000 // 10 minutes

let initialized = false
let stopTokenWatch: (() => void) | null = null
let refreshing = false

function handleAppAuthAlarm(alarm: Alarms.Alarm) {
  if (alarm.name === APP_AUTH_REFRESH_ALARM)
    void ensureFreshTokens()
}

async function ensureFreshTokens() {
  const tokens = appAuthTokens.value

  if (!tokens.accessToken || !tokens.refreshToken)
    return

  if (tokens.refreshTokenExpiresAt && tokens.refreshTokenExpiresAt <= Date.now()) {
    console.warn('[BewlyCat] APP refresh token 已过期，清除授权。')
    resetAppAuthTokens()
    return
  }

  if (!tokens.accessTokenExpiresAt)
    return

  const shouldRefresh = tokens.accessTokenExpiresAt <= Date.now() + REFRESH_BUFFER
  if (!shouldRefresh)
    return

  if (refreshing)
    return

  refreshing = true
  try {
    const ok = await refreshAppAccessToken()
    if (!ok)
      console.warn('[BewlyCat] APP access token 刷新失败，请重新授权。')
  }
  finally {
    refreshing = false
  }
}

export function setupAppAuthScheduler() {
  if (initialized)
    return

  initialized = true
  browser.alarms.onAlarm.addListener(handleAppAuthAlarm)
  void browser.alarms.create(APP_AUTH_REFRESH_ALARM, {
    periodInMinutes: CHECK_INTERVAL_MINUTES,
  })

  stopTokenWatch = watch(
    () => appAuthTokens.value,
    () => {
      void ensureFreshTokens()
    },
    { deep: true, immediate: true },
  )
}

export function teardownAppAuthScheduler() {
  if (!initialized)
    return

  initialized = false
  browser.alarms.onAlarm.removeListener(handleAppAuthAlarm)
  void browser.alarms.clear(APP_AUTH_REFRESH_ALARM)
  stopTokenWatch?.()
  stopTokenWatch = null
}
