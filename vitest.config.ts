import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/render/**', 'src/main.ts', 'src/game.ts', 'src/input.ts', 'src/hud/**'],
    },
  },
});
