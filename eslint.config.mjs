import pluginVue from 'eslint-plugin-vue'

export default [
   // add more generic rulesets here, such as:
   // js.configs.recommended,
   ...pluginVue.configs['flat/recommended'],
   {
      rules: {
         'import/extensions': ['error', 'always', {
            ignorePackages: true,
            pattern: {
               js: 'always'
            }
         }],
         'indent': ['warn', 3],
         'quotes': ['warn', 'single'],
         'quote-props': ['error', 'consistent'],
         'semi': ['warn', 'never', { 'beforeStatementContinuationChars': 'always' }],
         'arrow-spacing': 'warn',
         'prefer-const': 'warn',
         'rest-spread-spacing': ['warn', 'never'],
         'space-before-blocks': 'warn',
         'comma-spacing': 'warn',
         'no-useless-escape': 'off',
         'max-len': 'off',
         'no-console': 'off',
         'no-debugger': 'off',
         'no-trailing-spaces': 'off',
         'no-multi-spaces': 'off',
         'no-multiple-empty-lines': 'off'
      }
   }
]
