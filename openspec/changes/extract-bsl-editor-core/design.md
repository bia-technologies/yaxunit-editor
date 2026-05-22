## Context

The current package is named and documented as a YAxUnit editor, but most of the valuable implementation is a general BSL code editor: Monaco integration, semantic symbols, local/module/global scopes, completions, hover, definitions, signatures, snippets, platform metadata, and incremental parser-backed code-model updates.

The current construction path is tightly coupled:

- `BslEditor` creates a Monaco editor in a fixed DOM container and hard-wires `LezerModuleModel`.
- Monaco providers consume `ModuleModel`, `BslCodeModel`, `EditorScope`, and `GlobalScope`, which are already parser-agnostic enough to reuse.
- `LezerModuleModel` and `ChevrotainModuleModel` duplicate the same adapter behavior around different parser factories.
- `YAxUnitEditor` inherits from `BslEditor` and adds test discovery, code lenses, decorators, markers, and run commands.

The target use case is a reusable 1C/BSL editor base that can keep the existing Lezer implementation and also support another project using Tree-sitter. Tests remain an optional feature layer, not the root abstraction.

## Goals / Non-Goals

**Goals:**

- Establish a reusable BSL editor foundation with explicit boundaries between semantic core, parser engines, editor hosts, scopes, language features, and optional plugins.
- Preserve the current YAxUnit editor behavior while making it a composition of BSL editor base plus YAxUnit extension behavior.
- Make Lezer selectable as the existing parser adapter.
- Define the Tree-sitter integration point so it can build the same semantic model without forcing Monaco, web-tree-sitter, WASM, or Node-specific runtime details into the core.
- Prepare a language-service boundary that can back both Monaco providers and a future LSP adapter.

**Non-Goals:**

- Rewriting the semantic model from scratch.
- Replacing Monaco with another editor host in this change.
- Implementing a complete LSP server in the extraction step.
- Making YAxUnit test execution part of the core editor contract.
- Adding compatibility fallbacks that silently bypass parser gaps with regex or ad hoc lexical parsing.

## Decisions

### Decision: Keep `BslCodeModel` as the semantic contract

Parser engines SHALL produce the existing semantic model shape rather than exposing Lezer CST, Tree-sitter CST, or raw parser-node facts to language features.

Rationale: existing completions, hover, definitions, document symbols, variable collection, and type calculation already operate on `BslCodeModel` and symbol classes. Keeping this contract avoids rewriting working features and keeps parser-specific details behind adapters.

Alternatives considered:

- Expose Tree-sitter nodes directly to providers. Rejected because it would duplicate provider logic and make Lezer and Tree-sitter behavior diverge.
- Introduce a completely new semantic model first. Rejected because it creates a larger migration with no immediate reuse benefit.

### Decision: Introduce parser adapters above concrete parser factories

The editor foundation SHALL construct module models through a parser adapter contract. The Lezer implementation becomes one adapter; Tree-sitter becomes another adapter.

Conceptually:

```text
Text model changes
      │
      ▼
ParserAdapter
  ├─ parse/reparse
  ├─ incremental update if supported
  ├─ diagnostics
  └─ semantic model builder
      │
      ▼
BslCodeModel
```

Rationale: Lezer, Chevrotain, and Tree-sitter differ in parse tree APIs and incremental update mechanics, but the editor should depend on a stable model-update capability.

Alternatives considered:

- Add Tree-sitter inside `BslEditor.createModel()`. Rejected because it preserves the current hard-wired construction problem.
- Fork Monaco providers for Tree-sitter. Rejected because it makes language-service behavior parser-specific.

### Decision: Split language service from Monaco provider registration

Language features SHALL be expressible as editor-independent capabilities first, with Monaco provider wrappers adapting those capabilities to Monaco APIs.

Target boundary:

```text
LanguageService
  ├─ completions(document, position)
  ├─ hover(document, position)
  ├─ definition(document, position)
  ├─ documentSymbols(document)
  ├─ signatureHelp(document, position, context)
  └─ diagnostics(document)

Monaco adapter
  └─ maps Monaco model/ranges/provider results to LanguageService calls
```

Rationale: this is the smallest credible path toward LSP support. LSP should reuse the language service instead of reimplementing Monaco providers.

Alternatives considered:

- Treat existing Monaco providers as the canonical service API. Rejected because their signatures and range types are Monaco-specific.

### Decision: Convert YAxUnit behavior into optional plugin-style composition

YAxUnit SHALL register scope data, snippets, test discovery, decorations, code lenses, markers, and run commands through extension points on the BSL editor host.

Rationale: YAxUnit is valuable but not fundamental to editing BSL. Keeping it optional allows the same editor base to support plain BSL modules, test modules, and future domain-specific extensions.

Alternatives considered:

- Keep `YAxUnitEditor extends BslEditor` as the main reusable API. Rejected because it makes tests the root concept and leaks YAxUnit assumptions into non-test editors.

### Decision: Keep scope providers composable

Platform, configuration, YAxUnit, and future analysis providers SHALL register as composable scopes against an editor/language context rather than relying only on global side effects.

Rationale: reusable editors and future LSP use cases need predictable context construction, testability, and multiple independent editor instances.

Alternatives considered:

- Continue using the existing `GlobalScope` singleton only. Acceptable for current behavior, but insufficient as the long-term foundation because all consumers share one mutable registry.

## Risks / Trade-offs

- Parser adapters may expose gaps in the existing symbol model -> Keep the first Tree-sitter adapter focused on parity with Lezer-backed editor features and record missing grammar/model coverage as parser or model tasks.
- Extracting language service from Monaco providers may be more invasive than expected -> Start by wrapping existing provider logic behind service functions, then narrow Monaco-specific types.
- YAxUnit plugin conversion can accidentally change visible test behavior -> Keep a compatibility `YAxUnitEditor` facade that composes the new base and run existing YAxUnit tests/playground checks.
- Scope registry changes can break platform completions -> Preserve `GlobalScope` as a compatibility facade while introducing context-scoped registration.
- Tree-sitter runtime choices differ by host (Node, browser WASM, Rust/LSP) -> Keep runtime loading outside the core contract and make parser adapters own their runtime dependencies.

## Migration Plan

1. Introduce reusable contracts and construction options without changing current runtime behavior.
2. Rework `BslEditor` to accept parser adapter/editor host options while defaulting to the current Lezer behavior.
3. Extract common module-model adapter code shared by Lezer and Chevrotain.
4. Move Monaco provider logic behind language-service functions while keeping existing provider registrations.
5. Convert YAxUnit integration to plugin-style registration and keep `YAxUnitEditor` as a compatibility facade.
6. Add a Tree-sitter adapter skeleton or implementation behind the parser adapter contract.
7. Validate with existing Vitest coverage and playground behavior.

Rollback strategy: keep the current Lezer/YAxUnit entry point usable throughout the migration. If an extraction step regresses behavior, revert only the new adapter/plugin wiring and retain the existing Lezer module model path.

## Open Questions

- Should the Tree-sitter adapter be implemented in this change, or should this change stop at the adapter contract plus Lezer refactor?
- Which runtime will the first Tree-sitter consumer use: browser WASM, Node binding, or Rust-side LSP?
- Should package publishing use one package with subpath exports or a workspace with separate packages?
- How much of `GlobalScope` should remain as public API after context-scoped registration exists?
