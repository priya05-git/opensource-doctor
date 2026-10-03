export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { bg: '#0a0f0f', panel: '#10161a', chip: '#161c24', line: '#1f2a30', ink: '#e8edf2', mute: '#8a97a3', neon: '#5ef08e', amber: '#f5c542', danger: '#ff6b6b' },
      fontFamily: { head: ['"Space Grotesk"', 'system-ui', 'sans-serif'], mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'] },
    },
  },
};
