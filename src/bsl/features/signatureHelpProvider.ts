import { editor, languages, Position, CancellationToken } from 'monaco-editor-core'
import { scopeProvider } from '../scopeProvider'
import { Symbol, SymbolType, MethodSymbol, MethodSignature, isPlatformMethod } from '../../scope'
import { parameterDocumentation, signatureDocumentation, signatureLabel } from './documentationRender'
import tokensProvider from '../tokensProvider'

function currentMethodInfo(model: editor.ITextModel, position: Position) {
    const tokensSequence = tokensProvider.currentMethod(model, position)
    if (!tokensSequence) {
        return undefined
    }

    const symbol = scopeProvider.currentMethod(model, position, tokensSequence)
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

function methodSignature(symbol: Symbol): languages.SignatureInformation[] {
    if (isPlatformMethod(symbol)) {
        return symbol.signatures.map(s => createSignature(symbol, s))
    }else {
        const methodSymbol  = symbol as MethodSymbol;
        return [createSignature(methodSymbol, methodSymbol)]
    }
}

function  createSignature(method: Symbol, sign: MethodSignature): languages.SignatureInformation{
    return {
        label: signatureLabel(method, sign),
        documentation: signatureDocumentation(method, sign),
        parameters: sign.params.map(p => {
            return {
                label: p.name,
                documentation: parameterDocumentation(p)
            }
        })
    }
}

export {
    signatureHelpProvider
}
