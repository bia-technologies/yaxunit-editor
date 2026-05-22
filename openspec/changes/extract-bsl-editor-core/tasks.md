## 1. Baseline and Public Contract

- [x] 1.1 Capture current BSL/YAxUnit editor behavior with focused tests or snapshots for editor construction, Lezer-backed model creation, Monaco provider registration, and YAxUnit test discovery.
- [x] 1.2 Define reusable editor construction options for parser adapter, Monaco container/model input, scope providers, and optional plugins.
- [x] 1.3 Define a parser adapter interface that returns parser diagnostics, supports full rebuild, supports incremental update where available, and updates a `BslCodeModel`.
- [x] 1.4 Define a compatibility path so the existing `YAxUnitEditor` entry point can keep its current default behavior during migration.

## 2. Parser Adapter Extraction

- [x] 2.1 Extract duplicated module-model behavior from `LezerModuleModel` and `ChevrotainModuleModel` into a shared adapter-backed module model helper.
- [x] 2.2 Convert the existing Lezer code-model factory into a concrete parser adapter behind the new parser adapter interface.
- [x] 2.3 Update `BslEditor` model creation to accept a configured parser adapter while defaulting to the Lezer adapter.
- [x] 2.4 Keep parser-specific CST/tree types out of `ModuleModel`, language providers, and public editor construction types.
- [x] 2.5 Add parser-adapter tests proving the Lezer adapter still produces methods, variables, expressions, scope data, and parser diagnostics needed by existing features.

## 3. Language Service Boundary

- [x] 3.1 Introduce editor-independent language-service functions for completion, hover, definition, document symbols, and signature help.
- [x] 3.2 Refactor Monaco completion provider to delegate semantic completion calculation to the language service and only map results to Monaco completion items.
- [x] 3.3 Refactor Monaco hover, definition, document symbol, and signature providers to delegate semantic work to the language service.
- [x] 3.4 Add language-service tests that call service functions without invoking Monaco provider registration.
- [x] 3.5 Keep Monaco language registration behavior compatible with the current `bsl` language id and provider set.

## 4. Scope Provider Composition

- [x] 4.1 Introduce an editor or language context that owns registered scope providers for a specific editor instance.
- [x] 4.2 Adapt platform scope registration so platform globals, constructors, enums, and type members can be registered through the context.
- [x] 4.3 Preserve `GlobalScope` as a compatibility facade while new context-scoped registration is introduced.
- [x] 4.4 Add tests proving a plain BSL editor can run without YAxUnit scope data and a YAxUnit-enabled editor receives YAxUnit scope data.

## 5. YAxUnit Plugin Extraction

- [x] 5.1 Define a plugin contribution interface for scopes, snippets, commands, code lenses, decorations, markers, and model-change observers.
- [x] 5.2 Convert YAxUnit scope and snippets into plugin contributions instead of unconditional side-effect setup for every BSL editor.
- [x] 5.3 Convert YAxUnit test resolver, status decorator, message marker provider, code lens provider, and run-test command into plugin contributions.
- [x] 5.4 Rebuild `YAxUnitEditor` as a compatibility facade that composes the base BSL editor with the YAxUnit plugin.
- [x] 5.5 Add tests proving test discovery and run-test UI contributions are present only when the YAxUnit plugin is enabled.

## 6. Tree-sitter Adapter Readiness

- [x] 6.1 Add a Tree-sitter parser adapter module boundary or skeleton that depends only on the parser adapter interface and `BslCodeModel` symbols.
- [x] 6.2 Map the minimum Tree-sitter BSL syntax nodes needed for top-level procedure/function declarations, parameters, variable declarations, call expressions, access chains, constructors, and assignment statements.
- [x] 6.3 Report unsupported Tree-sitter grammar/model cases as explicit parser diagnostics or tracked adapter gaps instead of regex fallback behavior.
- [x] 6.4 Add parity tests comparing Lezer and Tree-sitter adapter output for representative BSL snippets when the Tree-sitter runtime is available.
- [x] 6.5 Keep Tree-sitter runtime loading isolated so importing the core editor or Lezer adapter does not require Tree-sitter dependencies.

## 7. Package Exports and Documentation

- [x] 7.1 Define package exports or internal entry points for core model, language service, Monaco adapter, Lezer adapter, and YAxUnit plugin.
- [x] 7.2 Update README and technical documentation to describe the BSL editor base as primary and YAxUnit tests as an optional feature layer.
- [x] 7.3 Document how another project can create a plain BSL editor and select Lezer or Tree-sitter parser adapters.
- [x] 7.4 Document current non-goals: no full LSP server in this change, no parser-node public API, and no regex fallback for parser gaps.

## 8. Validation

- [x] 8.1 Run `pnpm test`.
- [x] 8.2 Run `pnpm build`.
- [x] 8.3 Run playground smoke verification for the default YAxUnit editor path.
- [x] 8.4 Run OpenSpec validation for `extract-bsl-editor-core`.
- [x] 8.5 Review the final diff to confirm unrelated existing changes such as local `package.json` edits and unrelated docs are not included unless intentionally required.
