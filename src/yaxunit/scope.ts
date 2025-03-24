import { MemberType, PredefinedType, MethodMember, GlobalScope, GlobalScopeItem } from "@/common/scope"

class YAxUnitScope extends GlobalScopeItem { }

async function loadScope() {
    const scopeData = await import('@assets/yaxunit-scope.json')
    const types = scopeData.default.map(t => {
        return new PredefinedType(t.name, t.methods.map(handleMethod))
    })
    const members = types.filter(v => v.id.startsWith("ОбщийМодуль."))
        .map(t => {
            return {
                kind: MemberType.property,
                name: t.id.substring(12),
                type: t.id
            }
        })
    return new YAxUnitScope(members, types)
}

function handleMethod(m: any): MethodMember {
    return {
        name: m.name,
        kind: m.return ? MemberType.function : MemberType.procedure,
        description: m.description,
        type: m.return,
        params: m.params
    }
}

GlobalScope.registerScope('yaxunit-scope', loadScope())