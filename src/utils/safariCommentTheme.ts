import { isSafariRuntime } from '~/utils/safariRuntime'

const COMMENT_HOST_SELECTOR = 'bili-comments, bili-user-profile'
const COMMENT_VARIABLE_PREFIXES = ['--bg', '--text', '--graph', '--line']

const appliedVariableNames = new Set<string>()
let commentThemeObserver: MutationObserver | null = null
let isEnabled = false

function collectCommentThemeVariables(): Record<string, string> {
  const style = getComputedStyle(document.documentElement)
  const variables: Record<string, string> = {}
  for (let i = 0; i < style.length; i += 1) {
    const name = style[i]
    if (!COMMENT_VARIABLE_PREFIXES.some(prefix => name.startsWith(prefix)))
      continue
    const value = style.getPropertyValue(name).trim()
    if (value)
      variables[name] = value
  }
  return variables
}

function applyCommentThemeVariables(targets?: HTMLElement[]) {
  const hosts = targets ?? Array.from(document.querySelectorAll<HTMLElement>(COMMENT_HOST_SELECTOR))
  if (!hosts.length)
    return

  const variables = collectCommentThemeVariables()
  Object.entries(variables).forEach(([name, value]) => {
    appliedVariableNames.add(name)
    hosts.forEach(host => host.style.setProperty(name, value))
  })
}

function clearCommentThemeVariables() {
  const hosts = document.querySelectorAll<HTMLElement>(COMMENT_HOST_SELECTOR)
  hosts.forEach((host) => {
    appliedVariableNames.forEach(name => host.style.removeProperty(name))
  })
  appliedVariableNames.clear()
}

function collectAddedCommentHosts(mutations: MutationRecord[]): HTMLElement[] {
  const hosts = new Set<HTMLElement>()
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (!(node instanceof HTMLElement))
        return
      if (node.matches(COMMENT_HOST_SELECTOR))
        hosts.add(node)
      node.querySelectorAll<HTMLElement>(COMMENT_HOST_SELECTOR).forEach(host => hosts.add(host))
    })
  })
  return [...hosts]
}

function ensureCommentThemeObserver() {
  if (commentThemeObserver)
    return

  commentThemeObserver = new MutationObserver((mutations) => {
    if (!isEnabled)
      return
    const hosts = collectAddedCommentHosts(mutations)
    if (hosts.length)
      applyCommentThemeVariables(hosts)
  })
  commentThemeObserver.observe(document.documentElement, { childList: true, subtree: true })
}

export function updateSafariCommentTheme(enabled: boolean): void {
  if (!isSafariRuntime() || typeof document === 'undefined')
    return

  isEnabled = enabled
  if (enabled) {
    applyCommentThemeVariables()
    ensureCommentThemeObserver()
    return
  }

  commentThemeObserver?.disconnect()
  commentThemeObserver = null
  clearCommentThemeVariables()
}
