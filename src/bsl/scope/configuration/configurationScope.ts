import { GlobalScope } from "@/scope/globalScopeManager";
import { Symbol, SymbolType } from "@/scope/symbols";
import { ObjectDefinition } from "./metaObjectDefinition";
import { MetaObjectType } from "./metaObjectType";

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

export class ConfigurationScope {
    importDefinition = importDefinition
}

function importDefinition(type: string, name: string, object: ObjectDefinition): void {
    const collectionManagerType = getCollectionManagerType(type)
    const itemManagerType = getItemManagerType(type)
    registerMembers(collectionManagerType, [{ kind: SymbolType.property, name, type: itemManagerType }])
    // GlobalScope.registerType(itemManagerType)
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

function getItemManagerType(type: string): string {
    const typeInfo = types[type]
    return `${typeInfo.name}Менеджер.<${typeInfo.typePattern}>`
}

importDefinition('Обработка', 'Тестовая', { properties: [{ name: 'Свойство1', type: 'Строка' }] })