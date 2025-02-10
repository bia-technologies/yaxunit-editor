import { SymbolType, PredefinedType, MethodSymbol, GlobalScope, GlobalScopeItem } from "@/scope"

class YAxUnitScope extends GlobalScopeItem { }

async function loadScope() {
    const scopeData = await import('@/assets/yaxunit-scope.json')
    const types = scopeData.default.map((t: any) => {
        return new PredefinedType(t.name, t.methods.map(handleMethod))
    })
    const members = types.filter(v => v.id.startsWith("ОбщийМодуль."))
        .map(t => {
            return {
                kind: SymbolType.property,
                name: t.id.substring(12),
                type: t.id
            }
        })
    return new YAxUnitScope(members, types)
}

function handleMethod(m: any): MethodSymbol {
    return {
        name: m.name,
        kind: m.return ? SymbolType.function : SymbolType.procedure,
        description: m.description,
        type: m.return,
        params: m.params
    }
}

loadScope().then(s => GlobalScope.registerScope('yaxunit-scope', s))