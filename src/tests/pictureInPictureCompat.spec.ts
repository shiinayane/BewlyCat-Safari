import { describe, expect, it, vi } from 'vitest'

import { toggleVideoPictureInPicture } from '~/utils/pictureInPicture'

function createVideo(overrides: Record<string, any> = {}) {
  return {
    readyState: 4,
    disablePictureInPicture: false,
    requestPictureInPicture: vi.fn().mockResolvedValue(undefined),
    webkitSupportsPresentationMode: vi.fn(() => false),
    webkitSetPresentationMode: vi.fn(),
    webkitPresentationMode: 'inline',
    ...overrides,
  }
}

describe('picture-in-picture compatibility', () => {
  it('uses standard picture-in-picture when available', async () => {
    const video = createVideo()
    const doc = {
      pictureInPictureEnabled: true,
      pictureInPictureElement: null,
      fullscreenElement: null,
      exitFullscreen: vi.fn().mockResolvedValue(undefined),
      exitPictureInPicture: vi.fn().mockResolvedValue(undefined),
    } as any

    await expect(toggleVideoPictureInPicture(video as any, doc)).resolves.toBe(true)
    expect(video.requestPictureInPicture).toHaveBeenCalledOnce()
  })

  it('falls back to Safari webkit presentation mode when standard PiP is unavailable', async () => {
    const video = createVideo({
      requestPictureInPicture: undefined,
      webkitSupportsPresentationMode: vi.fn((mode: string) => mode === 'picture-in-picture'),
    })
    const doc = {
      pictureInPictureEnabled: false,
      pictureInPictureElement: null,
      fullscreenElement: null,
      exitFullscreen: vi.fn().mockResolvedValue(undefined),
      exitPictureInPicture: vi.fn().mockResolvedValue(undefined),
    } as any

    await expect(toggleVideoPictureInPicture(video as any, doc)).resolves.toBe(true)
    expect(video.webkitSetPresentationMode).toHaveBeenCalledWith('picture-in-picture')
  })

  it('returns false when neither standard nor Safari PiP is available', async () => {
    const video = createVideo({
      requestPictureInPicture: undefined,
      webkitSupportsPresentationMode: vi.fn(() => false),
    })
    const doc = {
      pictureInPictureEnabled: false,
      pictureInPictureElement: null,
      fullscreenElement: null,
      exitFullscreen: vi.fn().mockResolvedValue(undefined),
      exitPictureInPicture: vi.fn().mockResolvedValue(undefined),
    } as any

    await expect(toggleVideoPictureInPicture(video as any, doc)).resolves.toBe(false)
  })
})
