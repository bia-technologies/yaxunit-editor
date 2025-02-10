import { GlobalScopeItem, PlatformMethodSymbol, PredefinedType, Scope, Symbol, SymbolType, TypeDefinition } from '@/scope'

class PlatformScope extends GlobalScopeItem { }

export async function loadScope(): Promise<Scope> {

    const propertiesData = await import('@/assets/global-properties.json')
    const methodsData = await import('@/assets/global-methods.json')
    const enumsData = await import('@/assets/enums.json')
    const typesData = await import('@/assets/types.json')

    const properties = propertiesData.default.map(createPropertySymbol)
    const methods = methodsData.default.map(createMethodSymbol)
    const enums = enumsData.default.map(createEnumSymbol)
    const members = [executeMethodDescription() as Symbol].concat(properties).concat(methods).concat(enums)

    const enumTypes = enumsData.default.map(createEnumType)
    const types = (<any[]>typesData.default).map(createType)

    return new PlatformScope(members, types.concat(enumTypes))
}

function executeMethodDescription() {
    return {
        name: 'Выполнить',
        kind: SymbolType.procedure,
        description: 'Позволяет выполнить фрагмент кода, который передается ему в качестве строкового значения.  \n**Примечание**\nВ режиме запуска веб-клиент оператор не поддерживается, при его вызове будет сгенерировано исключение.',
        signatures: [{
            params: [{
                name: 'Строка',
                description: 'Строка, содержащая текст исполняемого кода.',
            }]
        }]
    } as PlatformMethodSymbol
}

function createType(t: any): TypeDefinition {
    const methods = t.methods.map((m: any) => createMethodSymbol(m))
    const properties = t.properties.map((p: any) => createPropertySymbol(p))

    return new PredefinedType(t.name, methods.concat(properties))
}

function createEnumSymbol(d: any) {
    return {
        name: d.name,
        kind: SymbolType.enum,
        type: d.name_en,
        description: d.description
    }
}

function createEnumType(d: any) {
    return new PredefinedType(d.name_en, d.values.map((v: any) => {
        return {
            name: v.name,
            kind: SymbolType.property,
            description: (v as any).description ?? '',
            type: 'unknown'
        }
    }))
}

function createMethodSymbol(d: any): PlatformMethodSymbol {
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
}

function createPropertySymbol(d: any): Symbol {
    return {
        name: d.name,
        kind: SymbolType.property,
        type: d.type,
        description: d.description
    }
}
