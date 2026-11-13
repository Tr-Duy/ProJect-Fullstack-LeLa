import { defineConfig, mergeConfig } from 'vite';
import app from './vite.config';
export default mergeConfig(app, defineConfig({ build: {
  outDir: '.auth/voice-dist', rollupOptions: { input: 'tests/voice-room.html' },
} }));
