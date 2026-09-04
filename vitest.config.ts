import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Without this, vitest walks copies of this same repo and runs every suite
    // extra times from stale code: .claude/worktrees is 203MB of old checkouts,
    // and .app-build is the sandbox scripts/build-app.mjs copies the sources
    // into. Either one doubles the run, reports failures against files nobody
    // is editing, and the contention makes timing-sensitive tests flaky.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.claude/worktrees/**',
      '**/.app-build/**',
      '**/out/**',
    ],
  },
})
