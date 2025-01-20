import { SymbolType, PredefinedType, MethodSymbol, GlobalScope } from "../scope"
import * as scopeData from './scope.json'

const scope = scopeData.default.map(t => {
    return new PredefinedType(t.name, t.methods.map(handleMethod))
})

function handleMethod(m: any): MethodSymbol {
    return {
        name: m.name,
        kind: m.return ? SymbolType.function : SymbolType.procedure,
        description: m.description,
        type: m.return,
        params: m.params
    }
}

const member = scope.filter((v) => v.id.startsWith("ОбщийМодуль."))
    .map(t => {
        return {
            kind: SymbolType.property,
            name: t.id.substring(12),
            type: t.id
        }
    })

GlobalScope.registerGlobalSymbols(member)
GlobalScope.registerTypes(scope)