## 1. Baseline and Public Contract

- [ ] 1.1 Capture current BSL/YAxUnit editor behavior with focused tests or snapshots for editor construction, Lezer-backed model creation, Monaco provider registration, and YAxUnit test discovery.
- [ ] 1.2 Define reusable editor construction options for parser adapter, Monaco container/model input, scope providers, and optional plugins.
- [ ] 1.3 Define a parser adapter interface that returns parser diagnostics, supports full rebuild, supports incremental update where available, and updates a `BslCodeModel`.
- [ ] 1.4 Define a compatibility path so the existing `YAxUnitEditor` entry point can keep its current default behavior during migration.

## 2. Parser Adapter Extraction

- [ ] 2.1 Extract duplicated module-model behavior from `LezerModuleModel` and `ChevrotainModuleModel` into a shared adapter-backed module model helper.
- [ ] 2.2 Convert the existing Lezer code-model factory into a concrete parser adapter behind the new parser adapter interface.
- [ ] 2.3 Update `BslEditor` model creation to accept a configured parser adapter while defaulting to the Lezer adapter.
- [ ] 2.4 Keep parser-specific CST/tree types out of `ModuleModel`, language providers, and public editor construction types.
- [ ] 2.5 Add parser-adapter tests proving the Lezer adapter still produces methods, variables, expressions, scope data, and parser diagnostics needed by existing features.

## 3. Language Service Boundary

- [ ] 3.1 Introduce editor-independent language-service functions for completion, hover, definition, document symbols, and signature help.
- [ ] 3.2 Refactor Monaco completion provider to delegate semantic completion calculation to the language service and only map results to Monaco completion items.
- [ ] 3.3 Refactor Monaco hover, definition, document symbol, and signature providers to delegate semantic work to the language service.
- [ ] 3.4 Add language-service tests that call service functions without invoking Monaco provider registration.
- [ ] 3.5 Keep Monaco language registration behavior compatible with the current `bsl` language id and provider set.

## 4. Scope Provider Composition

- [ ] 4.1 Introduce an editor or language context that owns registered scope providers for a specific editor instance.
- [ ] 4.2 Adapt platform scope registration so platform globals, constructors, enums, and type members can be registered through the context.
- [ ] 4.3 Preserve `GlobalScope` as a compatibility facade while new context-scoped registration is introduced.
- [ ] 4.4 Add tests proving a plain BSL editor can run without YAxUnit scope data and a YAxUnit-enabled editor receives YAxUnit scope data.

## 5. YAxUnit Plugin Extraction

- [ ] 5.1 Define a plugin contribution interface for scopes, snippets, commands, code lenses, decorations, markers, and model-change observers.
- [ ] 5.2 Convert YAxUnit scope and snippets into plugin contributions instead of unconditional side-effect setup for every BSL editor.
- [ ] 5.3 Convert YAxUnit test resolver, status decorator, message marker provider, code lens provider, and run-test command into plugin contributions.
- [ ] 5.4 Rebuild `YAxUnitEditor` as a compatibility facade that composes the base BSL editor with the YAxUnit plugin.
- [ ] 5.5 Add tests proving test discovery and run-test UI contributions are present only when the YAxUnit plugin is enabled.

## 6. Tree-sitter Adapter Readiness

- [ ] 6.1 Add a Tree-sitter parser adapter module boundary or skeleton that depends only on the parser adapter interface and `BslCodeModel` symbols.
- [ ] 6.2 Map the minimum Tree-sitter BSL syntax nodes needed for top-level procedure/function declarations, parameters, variable declarations, call expressions, access chains, constructors, and assignment statements.
- [ ] 6.3 Report unsupported Tree-sitter grammar/model cases as explicit parser diagnostics or tracked adapter gaps instead of regex fallback behavior.
- [ ] 6.4 Add parity tests comparing Lezer and Tree-sitter adapter output for representative BSL snippets when the Tree-sitter runtime is available.
- [ ] 6.5 Keep Tree-sitter runtime loading isolated so importing the core editor or Lezer adapter does not require Tree-sitter dependencies.

## 7. Package Exports and Documentation

- [ ] 7.1 Define package exports or internal entry points for core model, language service, Monaco adapter, Lezer adapter, and YAxUnit plugin.
- [ ] 7.2 Update README and technical documentation to describe the BSL editor base as primary and YAxUnit tests as an optional feature layer.
- [ ] 7.3 Document how another project can create a plain BSL editor and select Lezer or Tree-sitter parser adapters.
- [ ] 7.4 Document current non-goals: no full LSP server in this change, no parser-node public API, and no regex fallback for parser gaps.

## 8. Validation

- [ ] 8.1 Run `pnpm test`.
- [ ] 8.2 Run `pnpm build`.
- [ ] 8.3 Run playground smoke verification for the default YAxUnit editor path.
- [ ] 8.4 Run OpenSpec validation for `extract-bsl-editor-core`.
- [ ] 8.5 Review the final diff to confirm unrelated existing changes such as local `package.json` edits and unrelated docs are not included unless intentionally required.
