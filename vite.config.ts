import { defineConfig } from 'vite'
import { viteSingleFile } from "vite-plugin-singlefile"
import path from 'path'
// import MonacoEditorNlsPlugin, {
//   esbuildPluginMonacoEditorNls,
//   Languages,
// } from 'vite-plugin-monaco-editor-nls';

// https://github.com/microsoft/vscode-loc/blob/main/i18n/vscode-language-pack-ru/translations/main.i18n.json
import ru_ru from './nls/ru.json' with { type: "json" }

export default defineConfig(api => {
  const isDev = api.mode === 'development';

  return {
    build: {
      minify: !isDev,
      sourcemap: isDev,
      target: 'es2018',
    },
    esbuild: {
      // Configure this value when the browser version of the development environment is lower
      target: 'es2018',
      include: /\.(ts|jsx|tsx)$/,
    },
    // optimizeDeps: {
    //   /** vite >= 2.3.0 */
    //   esbuildOptions: {
    //     plugins: [
    //       esbuildPluginMonacoEditorNls({
    //         locale: Languages.ru,
    //         localeData: ru_ru.contents
    //       }),
    //     ],
    //   },
    // },
    plugins: [
      viteSingleFile({
        removeViteModuleLoader: true,
        deleteInlinedFiles: true
      }),
      // MonacoEditorNlsPlugin.default({
      //   locale: Languages.ru,
      //   localeData: ru_ru.contents
      // }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, "./src"),
        '@assets': path.resolve(__dirname, "./assets"),
      },
    },
  }
})
