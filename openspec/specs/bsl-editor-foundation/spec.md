# bsl-editor-foundation Specification

## Purpose
Defines the reusable BSL editor foundation: configurable editor construction, parser adapter isolation, editor-independent language services, composable scope providers, optional plugins, and Monaco host integration while preserving the existing YAxUnit editor facade.
## Requirements
### Requirement: Configurable BSL editor construction

The system SHALL provide a reusable BSL editor construction path that is not tied to YAxUnit-specific behavior and accepts explicit configuration for parser adapter, host editor integration, scope providers, and optional plugins.

#### Scenario: Create plain BSL editor

- **WHEN** a consumer creates a BSL editor without enabling YAxUnit features
- **THEN** the editor uses the configured parser adapter and provides BSL language features without registering YAxUnit test commands, code lenses, or test status decorations

#### Scenario: Preserve current YAxUnit editor facade

- **WHEN** existing code creates the current YAxUnit editor entry point
- **THEN** the editor initializes with the default Lezer-backed BSL behavior and YAxUnit test features remain available

### Requirement: Parser adapter contract

The system SHALL define a parser adapter contract that converts BSL source text and content changes into parser diagnostics and a `BslCodeModel` semantic model without exposing parser-specific CST nodes to editor language features.

#### Scenario: Lezer adapter builds semantic model

- **WHEN** the Lezer parser adapter parses a BSL module
- **THEN** it produces the same semantic model capabilities required by completions, hover, definitions, document symbols, signatures, scopes, and type calculations

#### Scenario: Tree-sitter adapter can be added behind the same contract

- **WHEN** a Tree-sitter parser adapter is selected
- **THEN** editor language features consume its results through the parser adapter contract and do not depend on Tree-sitter-specific node APIs

### Requirement: Parser runtime isolation

The system SHALL keep parser runtime loading and parser-specific dependencies inside parser adapter packages or modules.

#### Scenario: Core loads without Tree-sitter runtime

- **WHEN** a consumer imports the BSL semantic core or language-service core without selecting the Tree-sitter adapter
- **THEN** the consumer is not required to load Tree-sitter runtime dependencies such as browser WASM, Node bindings, or Rust bindings

#### Scenario: Parser gap is discovered

- **WHEN** a parser adapter cannot represent required BSL syntax correctly
- **THEN** the gap is reported as a parser or semantic-model issue instead of being silently bypassed with regex or ad hoc lexical fallback behavior

### Requirement: Editor-independent language service

The system SHALL expose BSL language-service capabilities independently from Monaco provider APIs.

#### Scenario: Monaco provider requests completions

- **WHEN** a Monaco completion provider is invoked for a BSL model
- **THEN** the provider delegates semantic completion calculation to the language service and only adapts the result to Monaco completion item shapes

#### Scenario: Future LSP adapter requests definitions

- **WHEN** an LSP adapter requests a definition for a BSL document position
- **THEN** it can use the same language-service definition capability as the Monaco definition provider

### Requirement: Composable scope providers

The system SHALL support composable scope providers for platform API data, module-local symbols, configuration metadata, YAxUnit API data, and future analysis providers.

#### Scenario: Platform scope is enabled

- **WHEN** the platform scope provider is registered for an editor context
- **THEN** completion, hover, signature help, and type resolution can use platform global methods, properties, constructors, enums, and type members

#### Scenario: YAxUnit scope is disabled

- **WHEN** a plain BSL editor context does not register the YAxUnit scope provider
- **THEN** YAxUnit-specific globals and snippets are not contributed to that editor context

### Requirement: Optional feature plugins

The system SHALL provide an extension mechanism for optional editor features such as YAxUnit tests, snippets, commands, code lenses, decorations, and markers.

#### Scenario: Enable YAxUnit plugin

- **WHEN** the YAxUnit plugin is enabled for a BSL editor
- **THEN** it registers YAxUnit scope data, snippets, test discovery, code lenses, decorations, markers, and run-test commands without requiring the base editor class to inherit from a YAxUnit-specific class

#### Scenario: Disable test features

- **WHEN** no test plugin is enabled
- **THEN** the editor does not run test discovery and does not register test-specific UI contributions

### Requirement: Monaco host adapter

The system SHALL keep Monaco-specific editor creation, language registration, keybindings, provider registration, ranges, and markers inside a Monaco host adapter layer.

#### Scenario: Register Monaco language features

- **WHEN** the Monaco host adapter registers BSL language support
- **THEN** it wires Monaco providers to the editor-independent language service and configured editor context

#### Scenario: Use non-default editor container

- **WHEN** a consumer provides a target container or existing Monaco model through editor construction options
- **THEN** the BSL editor initializes without requiring a hard-coded DOM element id

### Requirement: Current behavior remains compatible

The system SHALL preserve existing user-visible behavior for the current Lezer-backed YAxUnit editor while the reusable foundation is introduced.

#### Scenario: Existing playground opens

- **WHEN** the current playground entry point creates the YAxUnit editor
- **THEN** BSL syntax support, completions, hover, definitions, document symbols, snippets, test discovery, run-test code lenses, status decorations, and error markers continue to work through the compatibility facade

#### Scenario: Existing tests run

- **WHEN** the existing Vitest suite is executed
- **THEN** parser-backed code model tests, YAxUnit test model tests, and editor feature tests remain green or are updated only to reflect intentional public API changes from this specification
