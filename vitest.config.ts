import { defineConfig } from "vitest/config";
import path from 'path'

export default defineConfig({

	plugins: [],
	test: {
		globals: true, coverage: { enabled: false },
		environment: "jsdom",
		alias: [
			{
				find: /^monaco-editor-core$/,
				replacement:
					path.resolve(__dirname, "./node_modules/monaco-editor-core/esm/vs/editor/editor.api")
			}, {
				find: '@',
				replacement: path.resolve(__dirname, "./src"),
			}, {
				find: '@assets',
				replacement: path.resolve(__dirname, "./assets"),
			}
		],

	},
});