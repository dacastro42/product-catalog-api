// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // Evita muchos errores "Delete ␍" en Windows por CRLF vs LF.
      // Prettier respeta el salto de línea que ya tenga cada archivo.
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
  
      // Se mantiene la regla activa: la prueba exige evitar `any`.
      '@typescript-eslint/no-explicit-any': 'error',
  
      // Promesas sin await: advertencia (útil en main.ts con bootstrap()).
      '@typescript-eslint/no-floating-promises': 'warn',
  
      // Las reglas "unsafe" se disparan mucho con decoradores de NestJS
      // (TypeORM, Swagger, class-validator) sin aportar valor real aquí.
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
);
