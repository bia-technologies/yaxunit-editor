import { GlobalScope, PredefinedType, Symbol, SymbolType, TypeDefinition } from "@/scope"
import { ObjectDefinition } from "./metaObjectDefinition"
import { PlatformScope } from "../platform/loader"
import { PLATFORM_SCOPE_ID } from "../platform"

const types: { [key: string]: TypeInfo } = {}
interface AvailableTypes { manager: boolean, object: boolean, ref: boolean }
interface AvailableTypesOptions { manager?: boolean, object?: boolean, ref?: boolean }

appendType('Документ', 'Документы', '<Имя документа>', { object: true, ref: true })
appendType('Обработка', 'Обработки', '<Имя обработки>', { object: true })

export interface TypeInfo { name: string, collection: string, typePattern: string, types: AvailableTypes }

export function getTypeInfo(type: string) {
    return types[type]
}

export function createCollectionManagerType(type: TypeInfo, names: string[]) {
    const collectionManagerType = getCollectionManagerType(type)
    const baseType = getPlatformScope().resolveType(collectionManagerType)

    if (!baseType) {
        throw 'Unknown type ' + collectionManagerType
    }
    const baseMembers = [...baseType.getMembers()]
    const members = names.map(name => { return { kind: SymbolType.property, name, type: getItemManagerType(type, name) } })

    return new PredefinedType(collectionManagerType, baseMembers.concat(members))
}

export function createManagerType(type: TypeInfo, name: string) {
    const typeId = getItemManagerType(type, name)
    const baseType = getPlatformType(getItemManagerType(type))

    const members = getGenericTypeMembers(baseType, type, name)
    return new PredefinedType(typeId, members)
}

export function createRefType(type: TypeInfo, name: string) {
    const typeId = getRefType(type, name)
    const baseType = getPlatformType(getRefType(type))

    const members = getGenericTypeMembers(baseType, type, name)
    return new PredefinedType(typeId, members)
}

export function createObjectType(type: TypeInfo, name: string, object: ObjectDefinition) {
    const typeId = getObjectType(type, name)
    const baseType = getPlatformType(getObjectType(type))

    const members = getGenericTypeMembers(baseType, type, name)

    object.properties.forEach(p => {
        members.push({
            name: p.name,
            kind: SymbolType.property,
            type: p.type,
            description: p.description
        } as Symbol)
    })
    return new PredefinedType(typeId, members)
}

function appendType(name: string, collection: string, typePattern: string, typesOpt: AvailableTypesOptions) {
    const gTypes = Object.assign({}, { manager: true, object: false, ref: false } as AvailableTypes, typesOpt) as AvailableTypes
    const def = {
        name, collection, typePattern, types: gTypes
    }
    types[name] = def
    types[collection] = def
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

function getPlatformType(typeId: string): TypeDefinition {
    const type = getPlatformScope().resolveGenericTypes(typeId)
    if (!type) {
        throw 'Unknown type ' + typeId
    }
    return type
}

function getPlatformScope(): PlatformScope {
    return GlobalScope.registeredScopes[PLATFORM_SCOPE_ID] as PlatformScope
}

function getItemManagerType(typeInfo: TypeInfo, name?: string): string {
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

function getCollectionManagerType(type: TypeInfo): string {
    const collectionName = type.collection
    return collectionName + 'Менеджер'
}

