// Test-only stub. The real `server-only` package throws unconditionally in
// plain Node — Next.js aliases it to a no-op only inside its own server
// bundler. Vitest runs in plain Node, so alias it here instead (see
// vitest.config.mts) to let server-only modules load under test.
export {};
