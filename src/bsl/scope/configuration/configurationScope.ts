import { GlobalScope } from "@/scope/globalScopeManager";
import { Symbol, SymbolType } from "@/scope";
import { ObjectDefinition } from "./metaObjectDefinition";
import { MetaObjectType } from "./metaObjectType";
import { GlobalScopeItem, PredefinedType, TypeDefinition } from "@/scope";
import { PLATFORM_SCOPE_ID } from "../platform";

const types: { [key: string]: { name: string, collection: string, typePattern: string } } = {}

appendType('Документ', 'Документы', 'Имя документа')
appendType('Обработка', 'Обработки', 'Имя обработки')

function appendType(name: string, collection: string, typePattern: string) {
    const def = {
        name, collection, typePattern
    }
    types[name] = def
    types[collection] = def
}



export class ConfigurationScope extends GlobalScopeItem {
    objects: { [key: string]: ObjectDefinition[] } = {}

    registerType(typeId: string, members: Symbol[]) {
        const type = getPlatformScope().resolveType(typeId.toLocaleLowerCase())
        if (!type) {
            throw 'Unknown type ' + typeId
        }
        if (type instanceof MetaObjectType) {
            (<MetaObjectType>type).members.push(...members)
            return
        }
        console.log(type)
        const meta = new MetaObjectType(type, members)
        this.appendType(meta)
    }

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

function getPlatformScope(): GlobalScopeItem {
    return GlobalScope.registeredScopes[PLATFORM_SCOPE_ID] as GlobalScopeItem
}

function registerMembers(typeId: string, members: Symbol[]) {
    const type = GlobalScope.resolveType(typeId)
    if (!type) {
        throw 'Unknown type ' + typeId
    }
    if (type instanceof MetaObjectType) {
        (<MetaObjectType>type).members.push(...members)
        return
    }
    const meta = new MetaObjectType(type, members)
    GlobalScope.replaceType(typeId, meta)
}

function getCollectionManagerType(type: string): string {
    const collectionName = types[type].collection
    return collectionName + 'Менеджер'
}

function getItemManagerType(type: string, name?: string): string {
    const typeInfo = types[type]
    if (name) {
        return `${typeInfo.name}Менеджер.${name ?? typeInfo.typePattern}`

    } else {
        return `${typeInfo.name}Менеджер.<${name ?? typeInfo.typePattern}>`
    }
}

function getObjectType(type: string, name?: string): string {
    const typeInfo = types[type]
    if (name) {
        return `${typeInfo.name}Объект.${name ?? typeInfo.typePattern}`

    } else {
        return `${typeInfo.name}Объект.<${name ?? typeInfo.typePattern}>`
    }
}

function createType(typeId: string, members: Symbol[]) {
    const type = getPlatformType(typeId)
    return new MetaObjectType(type, members)
}

function getPlatformType(typeId: string): TypeDefinition {
    const type = getPlatformScope().resolveType(typeId.toLocaleLowerCase())
    if (!type) {
        throw 'Unknown type ' + typeId
    }
    return type
}

function createCollectionManagerType(type: string, names: string[]) {
    const collectionManagerType = getCollectionManagerType(type)
    const members = names.map(name => { return { kind: SymbolType.property, name, type: getItemManagerType(type, name) } })
    return createType(collectionManagerType, members)
}

function createManagerType(type: string, name: string) {
    const typeId = getItemManagerType(type, name)
    const baseType = getPlatformType(getItemManagerType(type))

    const marker = `<${types[type].typePattern}>`

    const members = baseType.getMembers().map(m => {
        if (!m.type || !m.type.endsWith(marker)) {
            return m
        }
        const copy = { ...m }
        copy.type = m.type.replace(marker, name)
        return copy
    })
    return new PredefinedType(typeId, members)
}
function createObjectType(type: string, name: string, object: ObjectDefinition) {
    const typeId = getObjectType(type, name)
    const baseType = getPlatformType(getObjectType(type))

    const marker = `<${types[type].typePattern}>`

    const members = baseType.getMembers().map(m => {
        if (!m.type || !m.type.endsWith(marker)) {
            return m
        }
        const copy = { ...m }
        copy.type = m.type.replace(marker, name)
        return copy
    })
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

GlobalScope.registerScope('configuration-scope', configurationScope)