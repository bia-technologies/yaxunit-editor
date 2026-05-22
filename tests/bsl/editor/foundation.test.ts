import '../../../src/polyfill .js'
import { createRequire } from 'node:module'
import { beforeAll, describe, expect, test } from 'vitest'
import { editor, languages, Uri } from 'monaco-editor-core'
import { AdapterBackedModuleModel } from '../../../src/bsl/adapterModuleModel'
import { BslEditor, BslEditorContext, defaultBslEditorOptions } from '../../../src/bsl/editor'
import { getBslCompletions, getBslDocumentSymbols, getBslHover, getBslSignatureHelp } from '../../../src/bsl/languageService'
import { createLezerParserAdapter } from '../../../src/bsl/lezer'
import { EditorScope } from '../../../src/bsl/scope/editorScope'
import { createTreeSitterParserAdapter, TREE_SITTER_BSL_NODE_MAP, TreeSitterNode } from '../../../src/bsl/treeSitter'
import { createYAxUnitPlugin, YAxUnitEditor } from '../../../src/yaxunit'
import { createYAxUnitCodeLensProvider } from '../../../src/yaxunit/features/lensProvider'
import { TestsModel } from '../../../src/yaxunit/test-model'
import { TestsResolver } from '../../../src/yaxunit/test-resolver/resolver'

const optionalTreeSitterRuntime = loadOptionalTreeSitterRuntime()
const treeSitterRuntimeTest = optionalTreeSitterRuntime ? test : test.skip

beforeAll(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        value: () => ({
            webkitBackingStorePixelRatio: 1,
            mozBackingStorePixelRatio: 1,
            msBackingStorePixelRatio: 1,
            oBackingStorePixelRatio: 1,
            backingStorePixelRatio: 1,
            clearRect: () => {},
            fillRect: () => {},
            beginPath: () => {},
            closePath: () => {},
            stroke: () => {},
            rect: () => {},
            moveTo: () => {},
            lineTo: () => {},
            drawImage: () => {},
            getImageData: () => ({ data: [] }),
            createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
            putImageData: () => {},
            measureText: (text: string) => ({ width: text.length })
        })
    })
})

describe('BSL editor foundation contracts', () => {
    test('default editor options select the Lezer parser adapter', () => {
        const adapter = defaultBslEditorOptions().parserAdapter()

        expect(adapter.id).toBe('lezer')
        adapter.dispose()
    })

    test('Lezer parser adapter builds the shared module model contract', () => {
        const model = editor.createModel('Перем ГлобальнаяПеременная;\nПроцедура Тест()\nКонецПроцедуры', 'bsl')
        const moduleModel = AdapterBackedModuleModel.create(model, createLezerParserAdapter())

        expect(moduleModel.getCodeModel().methods.map(method => method.name)).toEqual(['Тест'])
        expect(moduleModel.getCodeModel().vars.map(variable => variable.name)).toEqual(['ГлобальнаяПеременная'])
        expect(moduleModel.getScope().getMethods().map(method => method.name)).toEqual(['Тест'])

        moduleModel.dispose()
    })

    test('language service can read document symbols without Monaco provider registration', () => {
        const model = editor.createModel('Функция Значение()\nВозврат 1;\nКонецФункции', 'bsl')
        const moduleModel = AdapterBackedModuleModel.create(model, createLezerParserAdapter())

        expect(getBslDocumentSymbols(moduleModel).map(symbol => symbol.name)).toEqual(['Значение'])

        moduleModel.dispose()
    })

    test('YAxUnit features are plugin contributions, not plain context defaults', () => {
        const plainContext = new BslEditorContext()
        const yaxunitContext = new BslEditorContext()

        createYAxUnitPlugin().contribute(yaxunitContext)

        expect(plainContext.scopeContributions).toHaveLength(0)
        expect(yaxunitContext.scopeContributions.map(scope => scope.id)).toEqual(['yaxunit-scope'])
        expect(yaxunitContext.snippetContributions.map(snippet => snippet.id)).toEqual(['yaxunit'])
    })

    test('YAxUnit code lenses use plugin-owned test model state', () => {
        const model = editor.createModel('Процедура Тест()\nКонецПроцедуры', 'bsl')
        const otherModel = editor.createModel('', 'bsl')
        const testsModel = new TestsModel()
        testsModel.updateTests([
            { name: 'Тест', isExport: true, startOffset: 0, endOffset: 12 }
        ] as never, offset => model.getPositionAt(offset))

        const provider = createYAxUnitCodeLensProvider(
            { getModel: () => model } as never,
            testsModel,
            () => 'run-test-command'
        )

        expect(provider.provideCodeLenses(model, {} as never).lenses).toMatchObject([{
            id: 'RunTestТест',
            command: {
                id: 'run-test-command',
                title: 'Run test',
                arguments: ['Тест']
            }
        }])
        expect(provider.provideCodeLenses(otherModel, {} as never).lenses).toEqual([])
    })

    test('YAxUnit test resolver discovers tests from the initial code model', () => {
        const source = [
            'Процедура ИсполняемыеСценарии() Экспорт',
            '    ЮТТесты.ДобавитьТест("Сложение");',
            'КонецПроцедуры',
            '',
            'Процедура Сложение() Экспорт',
            'КонецПроцедуры'
        ].join('\n')
        const model = editor.createModel(source, 'bsl')
        const moduleModel = AdapterBackedModuleModel.create(model, createLezerParserAdapter())
        const testsModel = new TestsModel()
        const resolver = new TestsResolver({
            scope: moduleModel.getScope(),
            editor: {
                getModel: () => moduleModel
            }
        } as never, testsModel)

        resolver.onDidChangeContent(moduleModel.getCodeModel())

        expect(testsModel.getTests().map(test => test.method)).toEqual(['Сложение', 'ИсполняемыеСценарии'])

        moduleModel.dispose()
    })

    test('YAxUnit plugin scope resolves access-chain completions after context readiness', async () => {
        const yaxunitEditor = new YAxUnitEditor({
            container: testContainer(),
            uri: Uri.parse('inmemory://test/yaxunit-completions.bsl'),
            editorOptions: testEditorOptions(),
            initialText: [
                'Процедура ИсполняемыеСценарии() Экспорт',
                '    ЮТТесты.',
                'КонецПроцедуры'
            ].join('\n')
        })

        await yaxunitEditor.context.whenReady()

        const completions = await getBslCompletions(yaxunitEditor.getModel(), { lineNumber: 2, column: 13 })
        const labels = completions?.suggestions.map(labelText)

        expect(labels).toContain('ДобавитьТест')
        expect(labels).toContain('ВТранзакции')

        yaxunitEditor.editor.dispose()
        yaxunitEditor.context.dispose()
    })

    test('plain BSL editor does not resolve YAxUnit plugin scope data', async () => {
        const plainEditor = new BslEditor({
            container: testContainer(),
            uri: Uri.parse('inmemory://test/plain-bsl-editor.bsl'),
            editorOptions: testEditorOptions(),
            initialText: 'Процедура Тест()\n    ЮТТесты.\nКонецПроцедуры'
        })

        await plainEditor.context.whenReady()

        const rootCompletions = await getBslCompletions(plainEditor.getModel(), { lineNumber: 2, column: 7 })
        const accessCompletions = await getBslCompletions(plainEditor.getModel(), { lineNumber: 2, column: 13 })
        const rootLabels = rootCompletions?.suggestions.map(labelText)
        const accessLabels = accessCompletions?.suggestions.map(labelText) ?? []

        expect(rootLabels).not.toContain('ЮТТесты')
        expect(accessLabels).not.toContain('ДобавитьТест')

        plainEditor.editor.dispose()
        plainEditor.context.dispose()
    })

    test('YAxUnit signature help uses plugin-provided method signatures', async () => {
        const yaxunitEditor = new YAxUnitEditor({
            container: testContainer(),
            uri: Uri.parse('inmemory://test/yaxunit-signatures.bsl'),
            editorOptions: testEditorOptions(),
            initialText: [
                'Процедура ИсполняемыеСценарии() Экспорт',
                '    ЮТТесты.ДобавитьТест()',
                'КонецПроцедуры'
            ].join('\n')
        })

        await yaxunitEditor.context.whenReady()

        const callLine = '    ЮТТесты.ДобавитьТест('
        const positionOffset = yaxunitEditor.getModel().getOffsetAt({ lineNumber: 2, column: callLine.length + 1 })
        const signatureHelp = await getBslSignatureHelp(yaxunitEditor.getModel(), positionOffset, {
            activeSignatureHelp: undefined,
            isRetrigger: false,
            triggerCharacter: '(',
            triggerKind: languages.SignatureHelpTriggerKind.TriggerCharacter
        })

        const labels = signatureHelp?.value.signatures.map(signature => signature.label) ?? []
        expect(labels.some(label => label.startsWith('ДобавитьТест(') && label.includes('ИмяТестовогоМетода'))).toBe(true)

        yaxunitEditor.editor.dispose()
        yaxunitEditor.context.dispose()
    })

    test('YAxUnit hover uses plugin-provided type information', async () => {
        const yaxunitEditor = new YAxUnitEditor({
            container: testContainer(),
            uri: Uri.parse('inmemory://test/yaxunit-hover.bsl'),
            editorOptions: testEditorOptions(),
            initialText: [
                'Процедура ИсполняемыеСценарии() Экспорт',
                '    ЮТТесты.ДобавитьТест("Сложение");',
                'КонецПроцедуры'
            ].join('\n')
        })

        await yaxunitEditor.context.whenReady()

        const hover = await getBslHover(yaxunitEditor.getModel(), { lineNumber: 2, column: 17 })
        const content = hover?.contents.map(item => item.value).join('\n') ?? ''

        expect(content).toContain('Регистрирует тест')
        expect(content).toContain('**Возвращает:** `ОбщийМодуль.ЮТТесты`')

        yaxunitEditor.editor.dispose()
        yaxunitEditor.context.dispose()
    })

    test('YAxUnit completion does not synthesize plugin members inside comments', async () => {
        const yaxunitEditor = new YAxUnitEditor({
            container: testContainer(),
            uri: Uri.parse('inmemory://test/yaxunit-comment-completions.bsl'),
            editorOptions: testEditorOptions(),
            initialText: [
                'Процедура ИсполняемыеСценарии() Экспорт',
                '    // ЮТТесты.',
                'КонецПроцедуры'
            ].join('\n')
        })

        await yaxunitEditor.context.whenReady()

        const completions = await getBslCompletions(yaxunitEditor.getModel(), { lineNumber: 2, column: 17 })
        const labels = completions?.suggestions.map(labelText) ?? []

        expect(labels).not.toContain('ДобавитьТест')

        yaxunitEditor.editor.dispose()
        yaxunitEditor.context.dispose()
    })

    test('disposing editor disposes plugin context and removes editor scope', async () => {
        const yaxunitEditor = new YAxUnitEditor({
            container: testContainer(),
            uri: Uri.parse('inmemory://test/yaxunit-dispose.bsl'),
            editorOptions: testEditorOptions(),
            initialText: 'Процедура ИсполняемыеСценарии() Экспорт\nКонецПроцедуры'
        })

        await yaxunitEditor.context.whenReady()

        const model = yaxunitEditor.getModel()
        expect(yaxunitEditor.context.getScopes()).not.toHaveLength(0)

        yaxunitEditor.editor.dispose()

        expect(yaxunitEditor.context.getScopes()).toHaveLength(0)
        expect(() => EditorScope.getScope(model)).toThrow('Editor scope not exist')
    })

    test('Tree-sitter adapter reports explicit gaps without loading a runtime', () => {
        const adapter = createTreeSitterParserAdapter()
        const model = adapter.buildModel('Процедура Тест()\nКонецПроцедуры')

        expect(model.children).toHaveLength(0)
        expect(adapter.getDiagnostics()).toEqual([{
            message: 'Tree-sitter runtime is not configured',
            source: 'tree-sitter'
        }])
    })

    test('Tree-sitter adapter tracks the minimum BSL syntax mapping surface', () => {
        expect(TREE_SITTER_BSL_NODE_MAP.methodDeclarations).toContain('procedure_definition')
        expect(TREE_SITTER_BSL_NODE_MAP.parameters).toContain('parameter')
        expect(TREE_SITTER_BSL_NODE_MAP.variableDeclarations).toContain('variable_spec')
        expect(TREE_SITTER_BSL_NODE_MAP.callExpressions).toContain('call_expression')
        expect(TREE_SITTER_BSL_NODE_MAP.accessChains).toContain('property_access')
        expect(TREE_SITTER_BSL_NODE_MAP.constructors).toContain('new_expression')
        expect(TREE_SITTER_BSL_NODE_MAP.assignments).toContain('assignment_statement')
    })

    test('Tree-sitter adapter maps representative BSL syntax into the shared code model', () => {
        const runtime = {
            parse: () => ({ rootNode: treeSitterFixture() })
        }

        const adapter = createTreeSitterParserAdapter(runtime)
        const model = adapter.buildModel('')

        expect(model.methods.map(method => method.name)).toEqual(['Сложение'])
        expect(model.methods[0].params.map(param => ({ name: param.name, byVal: param.byVal }))).toEqual([
            { name: 'Операнд', byVal: true }
        ])
        expect(model.vars.map(variable => variable.name)).toEqual(['ГлобальнаяПеременная'])
        expect(model.methods[0].children).toMatchObject([
            { vars: [{ name: 'ЛокальнаяПеременная' }] },
            { variable: { access: [{ name: 'Объект' }, { name: 'Имя' }] }, expression: { name: 'Структура' } },
            { name: 'Сообщить' }
        ])
        expect(adapter.getDiagnostics()).toEqual([])
    })

    test('Tree-sitter adapter reports unsupported semantic node gaps', () => {
        const runtime = {
            parse: () => ({ rootNode: treeSitterFixture({ unsupportedBodyNode: 'return_statement' }) })
        }

        const adapter = createTreeSitterParserAdapter(runtime)
        adapter.buildModel('')

        expect(adapter.getDiagnostics()).toEqual([{
            message: 'Unsupported Tree-sitter BSL semantic node: return_statement',
            source: 'tree-sitter',
            startOffset: 0,
            endOffset: 'Возврат Операнд;'.length
        }])
    })

    test('fixture-backed Tree-sitter adapter keeps parity for top-level method discovery', () => {
        const source = 'Процедура Сложение(Знач Операнд)\nКонецПроцедуры'
        const lezerModel = createLezerParserAdapter().buildModel(source)
        const treeSitterModel = createTreeSitterParserAdapter({
            parse: () => ({ rootNode: treeSitterFixture({ includeBody: false, includeModuleVariable: false }) })
        }).buildModel(source)

        expect(treeSitterModel.methods.map(method => method.name)).toEqual(lezerModel.methods.map(method => method.name))
        expect(treeSitterModel.methods[0].params.map(param => param.name)).toEqual(lezerModel.methods[0].params.map(param => param.name))
    })

    treeSitterRuntimeTest('Tree-sitter runtime keeps parity with Lezer for module declarations', () => {
        const runtime = optionalTreeSitterRuntime!
        const parser = new runtime.Parser()
        parser.setLanguage(runtime.language)
        const source = 'Перем ГлобальнаяПеременная;\nПроцедура Сложение(Знач Операнд)\nКонецПроцедуры'
        const lezerModel = createLezerParserAdapter().buildModel(source)
        const adapter = createTreeSitterParserAdapter({
            parse: text => parser.parse(text)
        })
        const treeSitterModel = adapter.buildModel(source)

        expect(adapter.getDiagnostics()).toEqual([])
        expect(treeSitterModel.methods.map(method => method.name)).toEqual(lezerModel.methods.map(method => method.name))
        expect(treeSitterModel.methods[0].params.map(param => ({ name: param.name, byVal: param.byVal }))).toEqual(
            lezerModel.methods[0].params.map(param => ({ name: param.name, byVal: param.byVal }))
        )
        expect(treeSitterModel.vars.map(variable => variable.name)).toEqual(lezerModel.vars.map(variable => variable.name))
    })
})

interface TreeSitterParser {
    setLanguage(language: unknown): void
    parse(text: string): { rootNode: TreeSitterNode }
}

interface TreeSitterParserConstructor {
    new(): TreeSitterParser
}

function loadOptionalTreeSitterRuntime(): { Parser: TreeSitterParserConstructor, language: unknown } | undefined {
    const require = createRequire(import.meta.url)
    try {
        const parserModule = require('tree-sitter')
        const languageModule = require('tree-sitter-bsl')
        return {
            Parser: parserModule.default ?? parserModule,
            language: languageModule.default ?? languageModule
        }
    } catch {
        return undefined
    }
}

function treeSitterFixture(options: {
    includeBody?: boolean,
    includeModuleVariable?: boolean,
    unsupportedBodyNode?: string
} = {}): TreeSitterNode {
    const includeBody = options.includeBody ?? true
    const includeModuleVariable = options.includeModuleVariable ?? true
    const parameter = tsNode('parameter', 'Знач Операнд', [], {
        val: tsNode('VAL_KEYWORD', 'Знач'),
        name: tsNode('identifier', 'Операнд')
    })
    const parameters = tsNode('parameters', '(Знач Операнд)', [parameter])
    const procedureChildren = [
        tsNode('identifier', 'Сложение'),
        parameters,
        ...(includeBody ? [
            tsNode('var_statement', 'Перем ЛокальнаяПеременная;', [
                tsNode('identifier', 'ЛокальнаяПеременная')
            ]),
            tsNode('assignment_statement', 'Объект.Имя = Новый Структура(Операнд);', [], {
                left: tsNode('property_access', 'Объект.Имя', [
                    tsNode('identifier', 'Объект'),
                    tsNode('property', 'Имя')
                ]),
                right: tsNode('new_expression', 'Новый Структура(Операнд)', [
                    tsNode('identifier', 'Структура'),
                    tsNode('arguments', '(Операнд)', [
                        tsNode('identifier', 'Операнд')
                    ])
                ], {
                    type: tsNode('identifier', 'Структура'),
                    arguments: tsNode('arguments', '(Операнд)', [
                        tsNode('identifier', 'Операнд')
                    ])
                })
            }),
            tsNode('call_statement', 'Сообщить(Операнд);', [
                tsNode('method_call', 'Сообщить(Операнд)', [
                    tsNode('identifier', 'Сообщить'),
                    tsNode('arguments', '(Операнд)', [
                        tsNode('identifier', 'Операнд')
                    ])
                ], {
                    name: tsNode('identifier', 'Сообщить'),
                    arguments: tsNode('arguments', '(Операнд)', [
                        tsNode('identifier', 'Операнд')
                    ])
                })
            ])
        ] : [])
    ]
    if (includeBody && options.unsupportedBodyNode) {
        procedureChildren.push(tsNode(options.unsupportedBodyNode, 'Возврат Операнд;'))
    }

    return tsNode('source_file', '', [
        ...(includeModuleVariable ? [
            tsNode('var_definition', 'Перем ГлобальнаяПеременная;', [
                tsNode('variable_spec', 'ГлобальнаяПеременная', [], {
                    name: tsNode('identifier', 'ГлобальнаяПеременная')
                })
            ])
        ] : []),
        tsNode('procedure_definition', 'Процедура Сложение(Знач Операнд)', procedureChildren, {
            name: tsNode('identifier', 'Сложение'),
            parameters
        })
    ])
}

function tsNode(
    type: string,
    text: string,
    namedChildren: TreeSitterNode[] = [],
    fields: Record<string, TreeSitterNode | undefined> = {}
): TreeSitterNode {
    return {
        type,
        text,
        startIndex: 0,
        endIndex: text.length,
        namedChildren,
        childForFieldName: name => fields[name] ?? null
    }
}

function testContainer(): HTMLElement {
    const container = document.createElement('div')
    document.body.appendChild(container)
    return container
}

function testEditorOptions(): editor.IStandaloneEditorConstructionOptions {
    return {
        minimap: { enabled: false },
        overviewRulerLanes: 0
    }
}

function labelText(item: { label: unknown }): string {
    return typeof item.label === 'string'
        ? item.label
        : (item.label as { label: string }).label
}
