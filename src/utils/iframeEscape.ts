interface WebkitFullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null
}

function isEditableTarget(target: EventTarget): boolean {
  if (!(target instanceof HTMLElement))
    return false

  if (target.matches('input, textarea, select'))
    return true

  return target.isContentEditable
    || (target.hasAttribute('contenteditable') && target.getAttribute('contenteditable') !== 'false')
}

/** Keep iframe-level Escape handling out of native editing and fullscreen flows. */
export function shouldIgnoreIframeEscape(
  event: KeyboardEvent,
  documentLike: Document = document,
): boolean {
  if (event.isComposing || event.keyCode === 229)
    return true

  if (event.composedPath().some(isEditableTarget))
    return true

  const webkitDocument = documentLike as WebkitFullscreenDocument
  return Boolean(documentLike.fullscreenElement || webkitDocument.webkitFullscreenElement)
}
