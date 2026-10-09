import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
	{ ignores: ['build/**', 'node_modules/**'] },
	js.configs.recommended,
	{
		files: ['**/*.{js,jsx}'],
		plugins: { react, 'react-hooks': reactHooks },
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: { ecmaFeatures: { jsx: true } },
			globals: { ...globals.browser },
		},
		settings: { react: { version: 'detect' } },
		rules: {
			...react.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			'react/react-in-jsx-scope': 'off', // the automatic JSX runtime needs no React import
			'react/prop-types': 'off',
		},
	},
	{
		// Vitest globals (describe, test, expect, vi, ...) and Node-side config files.
		files: ['**/*.test.{js,jsx}', 'src/setupTests.js'],
		languageOptions: { globals: { ...globals.browser, ...globals.vitest, ...globals.node } },
	},
	{
		files: ['vite.config.js', 'eslint.config.js'],
		languageOptions: { globals: { ...globals.node } },
	},
];
