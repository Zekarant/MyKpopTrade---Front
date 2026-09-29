# MyKpopTrade - Front

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### Visual regression tests with [Playwright](https://playwright.dev/)

```sh
npx playwright install chromium   # once
npm run test:visual
```

Reference screenshots are taken on Windows (`-win32` suffix). On macOS or Linux,
generate your own once with `npx playwright test --update-snapshots`.

### Git hooks

`npm install` sets up [husky](https://typicode.github.io/husky/). Each commit runs
the type-check, ESLint (without `--fix`) and the unit tests.
