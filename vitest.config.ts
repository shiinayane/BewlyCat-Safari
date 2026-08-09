import { defineConfig } from 'vitest/config'

import { sharedConfig } from './vite.config'

// 上游 vite.config.ts 不再提供默认导出，Safari 兼容层的单元测试复用共享配置。
export default defineConfig({
  ...sharedConfig,
})
