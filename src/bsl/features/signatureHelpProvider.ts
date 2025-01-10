import { editor, languages, Position, CancellationToken } from 'monaco-editor'
import { scopeProvider } from '../scopeProvider'
import { Symbol, PlatformMethodSymbol, SymbolType } from '../../scope'
import { signatureDocumentation, signatureLabel } from './documentationRender'

const signatureHelpProvider: languages.SignatureHelpProvider = {
    signatureHelpRetriggerCharacters: ['(', ','],
    signatureHelpTriggerCharacters: [')'],

    provideSignatureHelp(model: editor.ITextModel, position: Position, _: CancellationToken, context: languages.SignatureHelpContext): languages.ProviderResult<languages.SignatureHelpResult> {
        const symbol = scopeProvider.currentMethod(model, position)
        if (symbol) {
            const signatures = (symbol.kind === SymbolType.function || symbol.kind === SymbolType.procedure) ?
                methodSignature(symbol) :
                [{
                    label: symbol.name,
                    parameters: [],
                    documentation: {
                        value: symbol.description ?? ''
                    }
                }]

            return {
                value: {
                    signatures: signatures,
                    activeParameter: context.activeSignatureHelp?.activeParameter ?? 0,
                    activeSignature: context.activeSignatureHelp?.activeSignature ?? 0
                }, dispose: () => { }
            }
        } else {
            return undefined
        }
    },
}

function isPlatformMethod(symbol: Symbol): symbol is PlatformMethodSymbol {
    return (<PlatformMethodSymbol>symbol).signatures !== undefined
}

function methodSignature(symbol: Symbol): languages.SignatureInformation[] {
    if (isPlatformMethod(symbol)) {
        return symbol.signatures.map(s => {
            return {
                label: signatureLabel(s),
                documentation: signatureDocumentation(symbol, s),
                activeParameter: 0,
                parameters: s.params.map(p => {
                    return {
                        label: p.name,
                        documentation: p.description ? { value: p.description } : 'Type: ' + p.type
                    }
                })
            }
        })
    }
    return []
}

export {
    signatureHelpProvider
}