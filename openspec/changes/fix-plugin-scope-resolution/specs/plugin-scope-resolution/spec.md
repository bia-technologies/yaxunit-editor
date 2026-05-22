## ADDED Requirements

### Requirement: Plugin scopes participate in type resolution

The system SHALL resolve types, constructors, and access-chain members from plugin-contributed scopes in the editor context.

#### Scenario: YAxUnit access-chain completion

- **WHEN** a YAxUnit-enabled editor requests completion after `ЮТТесты.`
- **THEN** completion includes members of the YAxUnit type contributed by the YAxUnit plugin

#### Scenario: Plugin type hover

- **WHEN** hover or signature help resolves a member whose type is provided by a plugin scope
- **THEN** the language service uses the plugin-provided type information instead of returning unknown data because the type is absent from `GlobalScope`

### Requirement: Plugin scope readiness is deterministic

The system SHALL provide a deterministic readiness path for asynchronous plugin scope and snippet contributions before language features consume them.

#### Scenario: Await editor context readiness

- **WHEN** a consumer awaits the editor context readiness after constructing a YAxUnit-enabled editor
- **THEN** YAxUnit scopes and snippets are available to completion and signature-help queries

#### Scenario: First completion after readiness

- **WHEN** the first completion request runs after the editor context is ready
- **THEN** the result is independent of dynamic import timing for plugin scope or snippet data

### Requirement: Plain editor plugin isolation

The system SHALL keep plugin-contributed scopes isolated to editor contexts that explicitly enable those plugins.

#### Scenario: Plain editor excludes YAxUnit scope

- **WHEN** a plain BSL editor is constructed without the YAxUnit plugin
- **THEN** YAxUnit globals, YAxUnit snippets, YAxUnit code lenses, and YAxUnit type definitions are not available in that editor context

#### Scenario: YAxUnit editor does not leak globally

- **WHEN** a YAxUnit-enabled editor and a plain BSL editor exist at the same time
- **THEN** the plain BSL editor does not resolve YAxUnit plugin members through global side effects from the YAxUnit-enabled editor

### Requirement: Existing YAxUnit editor behavior remains compatible

The system SHALL preserve the user-visible YAxUnit editor behavior while fixing plugin scope resolution.

#### Scenario: YAxUnit facade keeps test features

- **WHEN** existing code constructs `YAxUnitEditor`
- **THEN** test discovery, run-test code lenses, result decorations, error markers, YAxUnit snippets, and YAxUnit API completions remain available

#### Scenario: Foundation archive is gated

- **WHEN** `fix-plugin-scope-resolution` has not passed validation and focused review
- **THEN** `extract-bsl-editor-core` MUST NOT be archived as complete
