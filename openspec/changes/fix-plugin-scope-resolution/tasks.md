## 1. Regression Baseline

- [x] 1.1 Add a focused failing test showing that a YAxUnit-enabled editor resolves `ЮТТесты.` completion through the YAxUnit plugin type scope.
- [x] 1.2 Add a test showing that a plain BSL editor does not expose YAxUnit globals, snippets, code lenses, or YAxUnit type definitions.
- [x] 1.3 Add a readiness test showing that completion after awaiting editor context readiness is not affected by asynchronous plugin imports.
- [x] 1.4 Add a regression for hover or signature help resolving a member whose type comes from a plugin-provided type holder.

## 2. Context Registry

- [x] 2.1 Extend `BslEditorContext` or a shared registry helper to store resolved scopes, type holders, constructor holders, snippets, and contribution promises.
- [x] 2.2 Make context scope registration populate type-holder and constructor-holder indexes when contributed scopes implement those capabilities.
- [x] 2.3 Expose a `ready` or `whenReady` API that resolves after asynchronous scope and snippet contributions are loaded.
- [x] 2.4 Ensure disposing an editor context cleans up registered disposables without leaking plugin state into other editor contexts.

## 3. Editor-Aware Resolution

- [x] 3.1 Update `EditorScope` to use the context registry for plugin scopes and snippets after readiness.
- [x] 3.2 Update `scopeProvider` so editor-aware access-chain resolution uses context type resolution before falling back to `GlobalScope`.
- [x] 3.3 Update completion and signature-help paths to use context constructors and type lookup for the current editor.
- [x] 3.4 Update hover/type-calculation paths where practical so plugin-provided types are visible for the active editor context.

## 4. YAxUnit Compatibility

- [x] 4.1 Keep `YAxUnitEditor` as the compatibility facade that enables the YAxUnit plugin.
- [x] 4.2 Verify `YAxUnitEditor` still registers test discovery, run-test code lenses, result decorators, error markers, snippets, and YAxUnit API completions.
- [x] 4.3 Verify constructing a YAxUnit editor does not make YAxUnit plugin scopes visible in separately constructed plain BSL editors.

## 5. Validation and Archive Gate

- [x] 5.1 Run `pnpm test`.
- [x] 5.2 Run `pnpm build`.
- [x] 5.3 Run `openspec validate fix-plugin-scope-resolution --strict`.
- [x] 5.4 Re-review the focused diff for plugin scope/type-resolution correctness.
- [x] 5.5 Archive `extract-bsl-editor-core` only after this change is implemented, validated, and review findings are resolved.
