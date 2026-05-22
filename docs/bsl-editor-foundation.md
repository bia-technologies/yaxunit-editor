# BSL editor foundation

The package now exposes a reusable BSL editor foundation underneath the existing
YAxUnit editor facade. The base editor owns Monaco host creation, BSL semantic
model construction, scope composition, language-service delegation, and optional
feature plugins. YAxUnit test tooling is one plugin layer over that base.

## Plain BSL editor

Create a plain BSL editor by importing the base editor and omitting YAxUnit
plugins:

```ts
import { BslEditor } from './src/bsl'

const editor = new BslEditor({
  container: document.getElementById('container')!,
  initialText: 'Процедура Тест()\nКонецПроцедуры'
})
```

The default parser adapter is Lezer, so this path preserves the current BSL
language behavior without registering YAxUnit test commands, code lenses, test
status decorations, message markers, or YAxUnit scope data.

## Parser adapters

Parser engines are selected through the parser adapter contract:

```ts
import { BslEditor } from './src/bsl'
import { createLezerParserAdapter } from './src/bsl/lezer'
import { createTreeSitterParserAdapter } from './src/bsl/treeSitter'

new BslEditor({
  container: document.getElementById('container')!,
  parserAdapter: createLezerParserAdapter
})

new BslEditor({
  container: document.getElementById('container')!,
  parserAdapter: () => createTreeSitterParserAdapter(runtime)
})
```

Adapters build and update the shared `BslCodeModel` semantic model and report
parser diagnostics. Language features consume the semantic model instead of
Lezer CST nodes, Tree-sitter nodes, or parser-specific runtime objects.

The Tree-sitter adapter boundary is currently isolated as a skeleton. Importing
the core editor or the Lezer adapter does not load Tree-sitter runtime
dependencies such as browser WASM, Node bindings, or Rust bindings.

## Language service

Monaco providers delegate semantic work to `src/bsl/languageService.ts`:

- completions;
- hover;
- definitions;
- document symbols;
- signature help.

The Monaco provider layer only adapts provider calls and return shapes. This
keeps the semantic calculation reusable for future host adapters, including a
possible LSP adapter.

## Scope and plugins

`BslEditorContext` owns per-editor scope contributions and plugin setup.
Platform, configuration, YAxUnit, and future analysis scopes can be registered
as composable contributions.

The current `YAxUnitEditor` class remains a compatibility facade. It composes
the base BSL editor with `createYAxUnitPlugin()` and then registers the existing
test resolver, run-test command, code lenses, decorators, and markers.

## Non-goals

- This change does not introduce a full LSP server.
- Parser CST nodes are not public editor API.
- Tree-sitter semantic parity is not complete yet.
- Parser gaps must be reported as diagnostics or tracked adapter gaps, not
  hidden behind regex or ad hoc lexical fallback behavior.
