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
