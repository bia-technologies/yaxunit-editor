import { GlobalScope, PredefinedType, Symbol, SymbolType, TypeDefinition } from "@/scope"
import { ObjectDefinition } from "./objectDefinition"
import { PlatformScope } from "../platform/loader"
import { PLATFORM_SCOPE_ID } from "../platform"
import { TypeInfo, Types } from "./configurationTypes"

export async function createConfigurationType(typeId: string, definition: ObjectDefinition): Promise<TypeDefinition | undefined> {
    const baseTypeId = Types.getBaseTypeId(typeId)
    if (!baseTypeId) {
        return undefined
    }
    const baseType = await getPlatformScope().resolveType(baseTypeId)
    if (!baseType) {
        return undefined
    }
    const baseMembers = [...baseType.getMembers()]
    const members: Symbol[] = definition.properties.map(p => {
        return {
            name: p.name,
            type: p.type,
            description: p.description,
            kind: SymbolType.property
        }
    })
    return new PredefinedType(typeId, baseMembers.concat(members))
}

export async function createProxyType(typeId: string, definition: ObjectDefinition | undefined = undefined): Promise<TypeDefinition | undefined> {
    const baseTypeId = Types.getBaseTypeId(typeId)
    const typeDetails = Types.getTypeDetails(typeId)
    if (!baseTypeId || !typeDetails) {
        return undefined
    }
    const baseType = await getPlatformScope().resolveType(baseTypeId)
    if (!baseType) {
        return undefined
    }

    const typeInfo = Types.getTypeInfo(typeDetails.type)
    const baseMembers = getGenericTypeMembers(baseType, typeInfo, typeDetails.name)
    const members: Symbol[] = definition ? definition.properties.map(p => {
        return {
            name: p.name,
            type: p.type,
            description: p.description,
            kind: SymbolType.property
        }
    }) : []
    return new PredefinedType(typeId, baseMembers.concat(members))
}

function getGenericTypeMembers(genericType: TypeDefinition, typeInfo: TypeInfo, name: string) {
    const markers = new Set;
    if (typeInfo.types.manager) {
        markers.add(getItemManagerType(typeInfo, typeInfo.typePattern))
    }
    if (typeInfo.types.object) {
        markers.add(getObjectType(typeInfo, typeInfo.typePattern))
    }
    if (typeInfo.types.ref) {
        markers.add(getRefType(typeInfo, typeInfo.typePattern))
    }

    const replacePattern = /<[\w\s\-а-яА-Я]+?>/gi

    const members = genericType.getMembers().map(m => {
        if (!m.type || !markers.has(m.type)) {
            return m
        }
        const copy = { ...m }
        copy.type = m.type.replace(replacePattern, name)
        return copy
    })

    return members;
}

function getPlatformScope(): PlatformScope {
    return GlobalScope.registeredScopes[PLATFORM_SCOPE_ID] as PlatformScope
}

export function getItemManagerType(typeInfo: TypeInfo, name?: string): string {
    return getTypeId(typeInfo, 'Менеджер', name)
}

function getObjectType(typeInfo: TypeInfo, name?: string): string {
    return getTypeId(typeInfo, 'Объект', name)
}

function getRefType(typeInfo: TypeInfo, name?: string): string {
    return getTypeId(typeInfo, 'Ссылка', name)
}

function getTypeId(typeInfo: TypeInfo, ext: string, name?: string): string {
    if (name) {
        return `${typeInfo.name}${ext}.${name}`

    } else {
        return `${typeInfo.name}${ext}.<?>`
    }
}
