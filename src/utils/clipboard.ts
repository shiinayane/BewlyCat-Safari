export type ClipboardLike = Pick<Clipboard, 'writeText'> | Partial<Clipboard> | null | undefined

export function hasClipboardWrite(clipboard: ClipboardLike): clipboard is Pick<Clipboard, 'writeText'> {
  return !!clipboard && typeof clipboard.writeText === 'function'
}

export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && hasClipboardWrite(navigator.clipboard)) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    }
    catch {
      // Fall back to execCommand on browsers where the async clipboard API is gated.
    }
  }

  if (typeof document === 'undefined' || typeof document.execCommand !== 'function')
    return false

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  return copied
}
