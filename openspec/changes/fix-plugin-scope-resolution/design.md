## Context

`extract-bsl-editor-core` moved YAxUnit from unconditional global registration into an optional plugin. The review found a semantic gap in that extraction: plugin scopes are appended to `EditorScope.scopes`, so top-level member completion can see plugin globals, but type-aware access-chain resolution still uses `GlobalScope.resolveType()` and `GlobalScope.getConstructors()`.

That means a plain member such as `ЮТТесты` can be visible, while `ЮТТесты.` may not resolve methods from the `ОбщийМодуль.ЮТТесты` type contributed by the YAxUnit plugin. This is a correctness regression from the previous `GlobalScope.registerScope('yaxunit-scope', ...)` side-effect path.

The second review issue is readiness: plugin scope/snippet contributions can be promises, but editor construction currently starts language features without a deterministic way to wait for those contributions.

## Goals / Non-Goals

**Goals:**

- Make plugin-contributed scopes first-class for member lookup, type resolution, constructor lookup, completions, hover, signature help, and type calculation.
- Add a deterministic readiness path for asynchronous plugin scope and snippet contributions.
- Preserve `YAxUnitEditor` behavior from the user point of view.
- Keep plugin scope resolution independent from parser runtime details.
- Add regression tests for `ЮТТесты.` completion and immediate post-construction/readiness behavior.

**Non-Goals:**

- Reintroducing unconditional YAxUnit global registration for every plain BSL editor.
- Implementing a full LSP server.
- Expanding Tree-sitter semantic parity.
- Replacing the existing global platform scope in the same slice unless required for plugin correctness.
- Hiding parser or scope gaps behind regex or ad hoc lexical fallback behavior.

## Decisions

### Decision: Introduce a context-level semantic registry

The editor context should expose a semantic registry that can resolve:

- scopes for member lookup;
- type holders for `resolveType(typeId)`;
- constructor holders for constructor completion/signature help;
- snippet contributions.

The existing `GlobalScope` can remain a compatibility/default registry, but language-service calls that operate for a specific editor should prefer the editor context registry.

Conceptually:

```text
BslEditorContext
  ├─ scopes
  ├─ typeHolders
  ├─ constructorHolders
  ├─ snippets
  └─ ready()

EditorScope
  └─ uses context registry + module/method scope

LanguageService
  └─ resolves through editor context, with GlobalScope only as compatibility fallback
```

Rationale: plugin scopes need the same semantic status as global platform/YAxUnit scopes had before extraction, without forcing every plugin into the global singleton.

Alternative considered: call `GlobalScope.registerScope()` from `YAxUnitPlugin`. Rejected as the primary fix because it restores global side effects and makes plain editors observe plugin scopes after any YAxUnit editor has been constructed.

### Decision: Route type resolution through the editor-aware scope path

`scopeProvider`, completion logic, signature help, hover/type calculation paths should resolve types through the editor context when a `ModuleModel` or `EditorScope` is available.

The implementation can keep `GlobalScope.resolveType()` as fallback for old call sites, but new editor-specific APIs must not bypass plugin type holders.

Rationale: `ЮТТесты.` completion, chained member resolution, constructor lookup, and hover all depend on a type-resolution path, not only top-level member lookup.

### Decision: Add explicit readiness for async contributions

`BslEditorContext` should track contribution promises and expose a readiness promise or method. Language-service code and tests should have a clear way to wait for plugin scopes/snippets before querying completions.

Rationale: dynamic imports for scope/snippet data are asynchronous. Fire-and-forget registration creates timing-dependent behavior in the first editor interactions.

Alternative considered: make all plugin contributions synchronous. Rejected because current scope/snippet loading uses dynamic JSON imports and future providers may also be async.

### Decision: Keep archive blocked until this follow-up is reviewed

The complete `extract-bsl-editor-core` change should remain unarchived until this follow-up passes tests, OpenSpec validation, and a focused review of the plugin-scope semantics.

Rationale: archiving the foundation before this fix would record an incomplete plugin contract as accepted behavior.

## Risks / Trade-offs

- Context registry duplicates some `GlobalScopeManager` behavior -> Mitigate by extracting shared helper behavior or delegating to `GlobalScope` for default platform data while adding context-owned plugin holders.
- Async readiness can complicate editor construction -> Keep construction synchronous but expose an explicit `ready`/`whenReady` path for language features and tests.
- Existing code may still call `GlobalScope` directly -> Add targeted regressions for YAxUnit access-chain completions, hover/signature resolution, and constructor lookup paths.
- Multiple editors may use different plugin sets -> Tests must cover plain editor without YAxUnit and YAxUnit editor with YAxUnit scope to prevent global leakage.

## Migration Plan

1. Add context-owned registration for scopes, type holders, constructor holders, and snippets.
2. Track async contribution readiness in `BslEditorContext`.
3. Update `EditorScope`, `scopeProvider`, and language-service functions to resolve through the editor-aware registry when possible.
4. Update type calculation paths that currently use `GlobalScope.resolveType()` directly where editor context is available.
5. Add regressions for plain editor isolation, YAxUnit `ЮТТесты.` completion, and first-query-after-readiness behavior.
6. Run `pnpm test`, `pnpm build`, `openspec validate fix-plugin-scope-resolution --strict`, and then repeat review before archiving `extract-bsl-editor-core`.
