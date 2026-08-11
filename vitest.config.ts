import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Without this, vitest walks .claude/worktrees — 203MB of stale checkouts
    // of this same repo — and runs every suite two extra times from old copies
    // of the code. That triples the run, reports failures against files nobody
    // is editing, and the contention makes timing-sensitive tests flaky.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.claude/worktrees/**'],
  },
})
