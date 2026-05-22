import { MemberType, PredefinedType, MethodMember, GlobalScopeItem } from "@/common/scope"

class YAxUnitScope extends GlobalScopeItem { }

export const YAXUNIT_SCOPE_ID = 'yaxunit-scope'

export async function loadYAxUnitScope() {
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
