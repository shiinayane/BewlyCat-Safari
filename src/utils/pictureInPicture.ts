type PictureInPictureDocument = Pick<Document, 'fullscreenElement' | 'pictureInPictureElement' | 'pictureInPictureEnabled' | 'exitFullscreen' | 'exitPictureInPicture'>

type WebkitPictureInPictureVideo = HTMLVideoElement & {
  webkitPresentationMode?: string
  webkitSetPresentationMode?: (mode: 'inline' | 'picture-in-picture' | 'fullscreen') => void
  webkitSupportsPresentationMode?: (mode: 'inline' | 'picture-in-picture' | 'fullscreen') => boolean
}

function supportsStandardPictureInPicture(video: HTMLVideoElement, doc: PictureInPictureDocument) {
  return !!(doc.pictureInPictureEnabled && !video.disablePictureInPicture && typeof video.requestPictureInPicture === 'function')
}

function supportsWebkitPictureInPicture(video: WebkitPictureInPictureVideo) {
  return typeof video.webkitSupportsPresentationMode === 'function'
    && typeof video.webkitSetPresentationMode === 'function'
    && video.webkitSupportsPresentationMode('picture-in-picture')
}

export async function toggleVideoPictureInPicture(
  video: HTMLVideoElement | null,
  doc: PictureInPictureDocument = document,
): Promise<boolean> {
  if (!video || video.readyState === 0)
    return false

  if (supportsStandardPictureInPicture(video, doc)) {
    if (doc.fullscreenElement && typeof doc.exitFullscreen === 'function')
      await doc.exitFullscreen()

    if (doc.pictureInPictureElement && typeof doc.exitPictureInPicture === 'function')
      await doc.exitPictureInPicture()
    else
      await video.requestPictureInPicture()

    return true
  }

  const webkitVideo = video as WebkitPictureInPictureVideo
  if (!supportsWebkitPictureInPicture(webkitVideo))
    return false

  webkitVideo.webkitSetPresentationMode?.(
    webkitVideo.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture',
  )
  return true
}
