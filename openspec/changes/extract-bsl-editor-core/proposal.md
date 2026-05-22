## Why

The project currently contains reusable BSL editor capabilities, but they are packaged around a YAxUnit-specific editor entry point and a hard-wired Lezer module model. This blocks reuse in another 1C code editor that should use Tree-sitter while preserving the existing semantic model, Monaco language features, platform scopes, and optional YAxUnit test tooling.

## What Changes

- Extract the BSL editor foundation into explicit reusable layers: semantic core, language service, parser adapters, Monaco host integration, scope providers, and optional feature plugins.
- Make Lezer a parser adapter selected through configuration instead of the implicit editor default.
- Add an extension point for a Tree-sitter parser adapter that builds the same BSL semantic model as the existing Lezer path.
- Move YAxUnit-specific behavior from inheritance-based editor construction toward an optional plugin model.
- Prepare the language-service boundary so Monaco providers and a future LSP adapter can share the same analysis capabilities.
- Preserve the current YAxUnit editor behavior while introducing the reusable BSL editor base.

## Capabilities

### New Capabilities

- `bsl-editor-foundation`: Reusable BSL editor architecture covering parser adapters, language-service capabilities, host adapters, scope providers, and optional feature plugins.

### Modified Capabilities

- None.

## Impact

- Affected code: `src/bsl/editor`, `src/bsl/moduleModel.ts`, `src/bsl/lezer`, `src/bsl/codeModel`, `src/bsl/scope`, `src/bsl/editor/providers`, `src/yaxunit`, package exports, and playground entry points.
- Existing public behavior: the current YAxUnit editor should continue to run with Lezer and existing Monaco language features.
- New API surface: parser adapter selection, editor/core construction options, plugin registration, and language-service abstractions.
- Dependencies: no Tree-sitter runtime dependency is required for the first extraction step unless the Tree-sitter adapter is implemented in this change; the design must keep parser engines isolated behind adapter boundaries.
