## Why

The final review of `extract-bsl-editor-core` found that plugin-provided scopes are visible as top-level completion members but are not part of the type-resolution path used for access chains such as `ЮТТесты.`. This blocks archiving the foundation change because optional plugins are not yet semantically equivalent to the previous global YAxUnit registration path.

## What Changes

- Make plugin scope contributions participate in member lookup, type resolution, constructor lookup, and language-service access-chain resolution.
- Add a deterministic readiness path for asynchronous plugin scope and snippet contributions before language features consume the editor context.
- Preserve runtime isolation: plugin scopes must not require Tree-sitter, parser CST objects, or regex fallback behavior.
- Add regression coverage for YAxUnit plugin completions, especially `ЮТТесты.` member completion immediately after editor creation/readiness.
- Keep the existing `YAxUnitEditor` compatibility facade behavior intact.

## Capabilities

### New Capabilities

- `plugin-scope-resolution`: Plugin-contributed scopes and snippets are resolved predictably by the BSL language service and participate in type-aware editor features.

### Modified Capabilities

- None.

## Impact

- Affected code: `src/bsl/editor/context.ts`, `src/bsl/scope/editorScope.ts`, `src/bsl/scopeProvider.ts`, `src/bsl/languageService.ts`, `src/bsl/codeModel/calculators/typesCalculator.ts`, `src/yaxunit/plugin.ts`, and related editor foundation tests.
- Behavioral impact: YAxUnit plugin members must behave like the previous global YAxUnit scope for completion, hover, signature help, and access-chain member resolution.
- OpenSpec lifecycle impact: `extract-bsl-editor-core` should not be archived until this follow-up passes validation and review.
