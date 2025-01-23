import { GlobalScope, PlatformMethodSymbol, PredefinedType, Symbol, SymbolType, TypeDefinition } from '../../scope'
import types from './types.json'
import globalProperties from './global-properties.json'
import globalMethods from './global-methods.json'
import globalEnums from './enums.json'

(types as []).forEach(registerTypeDefinition)

GlobalScope.registerGlobalSymbols(properties(globalProperties))
GlobalScope.registerGlobalSymbols(methods(globalMethods))

GlobalScope.registerGlobalSymbols([
    {
        name: 'Выполнить',
        kind: SymbolType.procedure,
        description: 'Позволяет выполнить фрагмент кода, который передается ему в качестве строкового значения.  \n**Примечание**\nВ режиме запуска веб-клиент оператор не поддерживается, при его вызове будет сгенерировано исключение.',
        signatures: [{
            params: [{
                name: 'Строка',
                description: 'Строка, содержащая текст исполняемого кода.',
            }]
        }]
    } as PlatformMethodSymbol])



const symbols: TypeDefinition[] = []
GlobalScope.registerGlobalSymbols(globalEnums.map(d => {
    const t = new PredefinedType(d.name_en, d.values.map(v => {
        return {
            name: v.name,
            kind: SymbolType.property,
            description: (v as any).description ?? '',
            type: 'unknown'
        }
    }))
    symbols.push(t)
    return {
        name: d.name,
        kind: SymbolType.enum,
        type: d.name_en,
        description: d.description
    }
}))

GlobalScope.registerTypes(symbols)


function registerTypeDefinition(t: any): void {
    const td: TypeDefinition = new PredefinedType(t.name, methods(t.methods).concat(properties(t.properties)))

    GlobalScope.registerType(td)
}

function methods(rawMethods: any[]): Symbol[] {
    return rawMethods.map(d => {
        return {
            name: d.name,
            kind: d.return ? SymbolType.function : SymbolType.procedure,
            type: d.return,
            description: d.description,
            signatures: d.signature.map((s: any) => {
                return {
                    description: s.description,
                    params: s.params
                }
            })
        }
    })
}

function properties(rawProperties: any[]): Symbol[] {
    return rawProperties.map(d => {
        return {
            name: d.name,
            kind: SymbolType.property,
            type: d.type,
            description: d.description
        }
    })
}