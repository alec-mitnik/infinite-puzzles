import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import globals from 'globals';

// Custom rules
const customRules = {
  'no-direct-display': {
    create(context) {
      return {
        MemberExpression(node) {
          // Check for .display that's NOT part of .style.display
          if (node.property.name === 'display' &&
              node.object.property?.name !== 'style') {
            context.report({
              node,
              message: 'Likely Mistake: Use .style.display instead of .display'
            });
          }
        }
      };
    }
  },
  // Add more custom rules here if needed
};

// Auto-generate the rules config
const customRulesConfig = Object.fromEntries(
  Object.keys(customRules).map(ruleName => [`custom/${ruleName}`, 'error'])
);

export default [
  js.configs.recommended,
  {
    plugins: {
      custom: { rules: customRules },
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
        // Add any other browser globals being used
      }
    },
    rules: {
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-floating-promises': ['error', {
        ignoreVoid: true,
        ignoreIIFE: false
      }],
      ...customRulesConfig,
    }
  }
];
