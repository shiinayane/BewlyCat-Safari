/**
 * Safari Xcode project post-processing script
 * Adds App Groups entitlements to fix storage persistence after system restart
 */
import path from 'node:path'
import process from 'node:process'

import fs from 'fs-extra'

const BUNDLE_IDENTIFIER = 'com.github.BewlyCat'
const APP_GROUP = `group.${BUNDLE_IDENTIFIER}`

const XCODE_PROJECT_DIR = './extension-safari-xcode/BewlyCat'
const APP_DIR = path.join(XCODE_PROJECT_DIR, 'BewlyCat')
const EXT_DIR = path.join(XCODE_PROJECT_DIR, 'BewlyCat Extension')
const PBXPROJ_PATH = path.join(XCODE_PROJECT_DIR, 'BewlyCat.xcodeproj/project.pbxproj')

// Entitlements content for main app
const APP_ENTITLEMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${APP_GROUP}</string>
    </array>
</dict>
</plist>
`

// Entitlements content for extension
const EXT_ENTITLEMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${APP_GROUP}</string>
    </array>
</dict>
</plist>
`

function generateUUID(): string {
  // Generate a simple hex ID similar to Xcode's format
  const chars = '0123456789ABCDEF'
  let result = ''
  for (let i = 0; i < 24; i++) {
    result += chars[Math.floor(Math.random() * 16)]
  }
  return result
}

async function createEntitlementsFiles() {
  const appEntPath = path.join(APP_DIR, 'BewlyCat.entitlements')
  const extEntPath = path.join(EXT_DIR, 'BewlyCat Extension.entitlements')

  await fs.writeFile(appEntPath, APP_ENTITLEMENTS, 'utf-8')
  console.log(`✅ Created: ${appEntPath}`)

  await fs.writeFile(extEntPath, EXT_ENTITLEMENTS, 'utf-8')
  console.log(`✅ Created: ${extEntPath}`)

  return { appEntPath, extEntPath }
}

async function updatePbxproj() {
  let content = await fs.readFile(PBXPROJ_PATH, 'utf-8')

  // Check if entitlements are already added
  if (content.includes('BewlyCat.entitlements')) {
    console.log('⚠️  Entitlements already configured in project.pbxproj')
    return
  }

  // Generate unique IDs
  const appEntFileRef = generateUUID()
  const extEntFileRef = generateUUID()

  // 1. Add file references in PBXFileReference section
  const fileRefEndMarker = '/* End PBXFileReference section */'
  const fileRefAddition = `\t\t${appEntFileRef} /* BewlyCat.entitlements */ = {isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = BewlyCat.entitlements; sourceTree = "<group>"; };
\t\t${extEntFileRef} /* BewlyCat Extension.entitlements */ = {isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = "BewlyCat Extension.entitlements"; sourceTree = "<group>"; };
${fileRefEndMarker}`

  content = content.replace(fileRefEndMarker, fileRefAddition)

  // 2. Add CODE_SIGN_ENTITLEMENTS to build settings
  // For main app - match all occurrences
  content = content.replace(
    /(PRODUCT_BUNDLE_IDENTIFIER = com\.hankun\.BewlyCat;)(\s+)(PRODUCT_NAME|REGISTER_APP_GROUPS)/g,
    `$1$2CODE_SIGN_ENTITLEMENTS = BewlyCat/BewlyCat.entitlements;$2$3`,
  )

  // For extension - match all occurrences
  content = content.replace(
    /(PRODUCT_BUNDLE_IDENTIFIER = com\.hankun\.BewlyCat\.Extension;)(\s+)(PRODUCT_NAME|SKIP_INSTALL)/g,
    `$1$2CODE_SIGN_ENTITLEMENTS = "BewlyCat Extension/BewlyCat Extension.entitlements";$2$3`,
  )

  // 3. Add entitlements file to BewlyCat group (main app)
  // Find the BewlyCat group and add the entitlements reference
  const appGroupPattern = /(\/\* BewlyCat \*\/ = \{\s*isa = PBXGroup;\s*children = \()/
  content = content.replace(
    appGroupPattern,
    `$1\n\t\t\t\t${appEntFileRef} /* BewlyCat.entitlements */,`,
  )

  // 4. Add entitlements file to BewlyCat Extension group
  const extGroupPattern = /(\/\* BewlyCat Extension \*\/ = \{\s*isa = PBXGroup;\s*children = \()/
  content = content.replace(
    extGroupPattern,
    `$1\n\t\t\t\t${extEntFileRef} /* BewlyCat Extension.entitlements */,`,
  )

  await fs.writeFile(PBXPROJ_PATH, content, 'utf-8')
  console.log(`✅ Updated: ${PBXPROJ_PATH}`)
}

async function main() {
  console.log('🔧 Safari post-convert: Adding App Groups entitlements...\n')

  // Check if Xcode project exists
  if (!await fs.pathExists(PBXPROJ_PATH)) {
    console.error(`❌ Xcode project not found at ${XCODE_PROJECT_DIR}`)
    console.error('   Run "pnpm convert-safari" first.')
    process.exit(1)
  }

  try {
    await createEntitlementsFiles()
    await updatePbxproj()
    console.log('\n✅ Safari post-convert completed!')
    console.log(`   App Group: ${APP_GROUP}`)
    console.log('\n📋 Next steps:')
    console.log('   1. Open Xcode project: extension-safari-xcode/BewlyCat/BewlyCat.xcodeproj')
    console.log('   2. Configure App Groups in Apple Developer Portal:')
    console.log(`      - Register App Group: ${APP_GROUP}`)
    console.log('      - Enable App Groups capability for both App IDs')
    console.log('   3. In Xcode, verify Signing & Capabilities shows App Groups')
  }
  catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
