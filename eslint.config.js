import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    // `public/` est recopié tel quel par Vite : ce n'est pas du code applicatif.
    // Le service worker y utilise volontairement les globales du worker (`self`).
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', 'public/**'],
  },

  ...pluginVue.configs['flat/recommended'],
  ...vueTsEslintConfig(),
  
  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  {
    name: 'app/test-doubles',
    // Les tests déclarent des composants factices minimaux dans vi.mock : un
    // par fichier ou des props typées n'y apportent rien.
    files: ['src/**/__tests__/*'],
    rules: {
      'vue/one-component-per-file': 'off',
      'vue/require-prop-types': 'off',
    },
  },
  skipFormatting,
]
