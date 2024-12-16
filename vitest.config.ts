import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [],
	test: {
		globals: true,
		environment: "jsdom",
        alias: [
            {
              find: /^monaco-editor$/,
              replacement:
                __dirname + "/node_modules/monaco-editor/esm/vs/editor/editor.api",
            },
          ],
	},
});