interface BrowserLike {
  runtime: {
    openOptionsPage?: () => Promise<void>
    getURL: (path: string) => string
  }
  tabs: {
    create: (createProperties: { url: string }) => Promise<unknown>
  }
}

export async function openExtensionOptionsPage(browserApi: BrowserLike): Promise<void> {
  try {
    if (typeof browserApi.runtime.openOptionsPage === 'function') {
      await browserApi.runtime.openOptionsPage()
      return
    }
  }
  catch {
    // Fall back to the bundled options page when the browser does not expose options pages.
  }

  await browserApi.tabs.create({
    url: browserApi.runtime.getURL('dist/options/index.html'),
  })
}
