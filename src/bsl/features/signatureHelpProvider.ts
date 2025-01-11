import { editor, languages, Position, CancellationToken } from 'monaco-editor'
import { scopeProvider } from '../scopeProvider'
import { Symbol, PlatformMethodSymbol, SymbolType } from '../../scope'
import { signatureDocumentation, signatureLabel } from './documentationRender'
import tokensProvider from '../tokensProvider'

function currentMethodInfo(model: editor.ITextModel, position: Position) {
    const tokensSequence = tokensProvider.findMethod(model, position)
    if (!tokensSequence) {
        return undefined
    }

    const symbol = scopeProvider.currentMethod(model, position)
    if (!symbol) {
        return undefined
    }

    return {
        tokensSequence,
        symbol,
        activeParameter: tokensSequence.end ? tokensProvider.getParameterNumber(model, tokensSequence.end, position) : 0
    }
}

const signatureHelpProvider: languages.SignatureHelpProvider = {
    signatureHelpTriggerCharacters: ['(', ','],
    signatureHelpRetriggerCharacters: [')'],

    provideSignatureHelp(model: editor.ITextModel, position: Position, _: CancellationToken, context: languages.SignatureHelpContext): languages.ProviderResult<languages.SignatureHelpResult> {

        const methodInfo = currentMethodInfo(model, position)
        console.debug('Method info', methodInfo)
        console.debug('Method context', context)
        if (methodInfo) {
            const symbol = methodInfo.symbol
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
                    activeParameter: methodInfo.activeParameter,
                    activeSignature: 0
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
                label: signatureLabel(symbol, s),
                documentation: signatureDocumentation(symbol, s),
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