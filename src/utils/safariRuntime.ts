interface NavigatorLike {
  userAgent?: string
  vendor?: string
}

export function isSafariRuntime(
  navigatorLike: NavigatorLike | undefined = typeof navigator === 'undefined' ? undefined : navigator,
): boolean {
  if (!navigatorLike)
    return false

  const userAgent = navigatorLike.userAgent ?? ''
  const vendor = navigatorLike.vendor ?? ''
  return /Safari/i.test(userAgent)
    && !/Chrome|Chromium|CriOS|Edg/i.test(userAgent)
    && /Apple/i.test(vendor)
}

/** Safari exposes storage.sync as a local storage area without cross-device sync. */
export function supportsBrowserSettingsSync(
  navigatorLike?: NavigatorLike,
): boolean {
  return !isSafariRuntime(navigatorLike)
}
