import { GlobalScope } from "@/scope/globalScopeManager";
import { Symbol, SymbolType } from "@/scope";
import { ObjectDefinition } from "./metaObjectDefinition";
import { GlobalScopeItem, PredefinedType, TypeDefinition } from "@/scope";
import { PLATFORM_SCOPE_ID } from "../platform";
import { PlatformScope } from "../platform/loader";

interface TypeInfo { name: string, collection: string, typePattern: string }
const types: { [key: string]:  TypeInfo} = {}

appendType('Документ', 'Документы', '<Имя документа>')
appendType('Обработка', 'Обработки', '<Имя обработки>')

function appendType(name: string, collection: string, typePattern: string) {
    const def = {
        name, collection, typePattern
    }
    types[name] = def
    types[collection] = def
}

export class ConfigurationScope extends GlobalScopeItem {
    objects: { [key: string]: ObjectDefinition[] } = {}

    resolveType(typeId: string): TypeDefinition | undefined {
        const type = super.resolveType(typeId)
        if (type) {
            return type
        }

        if (typeId.startsWith('обработки')) {
            this.importDefinition('Обработка', 'Тестовая', { properties: [{ name: 'Свойство1', type: 'Строка' }] })
        }
        return super.resolveType(typeId)
    }

    private importDefinition(type: string, name: string, object: ObjectDefinition): void {
        this.appendType(createCollectionManagerType(type, [name]))
        this.appendType(createManagerType(type, name))
        this.appendType(createObjectType(type, name, object))
    }
}

const configurationScope = new ConfigurationScope([], []);

function getPlatformScope(): PlatformScope {
    return GlobalScope.registeredScopes[PLATFORM_SCOPE_ID] as PlatformScope
}

function getCollectionManagerType(type: string): string {
    const collectionName = types[type].collection
    return collectionName + 'Менеджер'
}

function getItemManagerType(typeInfo: TypeInfo, name?: string): string {
    if (name) {
        return `${typeInfo.name}Менеджер.${name}`

    } else {
        return `${typeInfo.name}Менеджер.<?>`
    }
}

function getObjectType(typeInfo: TypeInfo, name?: string): string {
    if (name) {
        return `${typeInfo.name}Объект.${name}`

    } else {
        return `${typeInfo.name}Объект.<?>`
    }
}

function getPlatformType(typeId: string): TypeDefinition {
    const type = getPlatformScope().resolveGenericTypes(typeId)
    if (!type) {
        throw 'Unknown type ' + typeId
    }
    return type
}

function createCollectionManagerType(type: string, names: string[]) {
    const collectionManagerType = getCollectionManagerType(type)
    const baseType = getPlatformScope().resolveType(collectionManagerType)

    if (!baseType) {
        throw 'Unknown type ' + collectionManagerType
    }
    const typeInfo = types[type]
    const baseMembers = [...baseType.getMembers()]
    const members = names.map(name => { return { kind: SymbolType.property, name, type: getItemManagerType(typeInfo, name) } })


    return new PredefinedType(collectionManagerType, baseMembers.concat(members))
}

function createManagerType(type: string, name: string) {
    const typeInfo = types[type]
    const typeId = getItemManagerType(typeInfo, name)
    const baseType = getPlatformType(getItemManagerType(typeInfo))

    const members = getGenericTypeMembers(baseType, typeInfo, name)
    return new PredefinedType(typeId, members)
}

function createObjectType(type: string, name: string, object: ObjectDefinition) {
    const typeInfo = types[type]
    const typeId = getObjectType(typeInfo, name)
    const baseType = getPlatformType(getObjectType(typeInfo))

    const members = getGenericTypeMembers(baseType, typeInfo, name)

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

function getGenericTypeMembers(genericType: TypeDefinition, typeInfo:TypeInfo, name: string) {
    const markers = new Set([getItemManagerType(typeInfo, typeInfo.typePattern), getObjectType(typeInfo, typeInfo.typePattern)])
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

GlobalScope.registerScope('configuration-scope', configurationScope)