import { defineConfig } from "vitest/config";
import path from 'path'

export default defineConfig({

	plugins: [],
	test: {
		globals: true, coverage: { enabled: false },
		environment: "jsdom",
		alias: [
			{
				find: /^monaco-editor$/,
				replacement:
					path.resolve(__dirname, "./node_modules/monaco-editor/esm/vs/editor/editor.api")
			},
		],

	},
});