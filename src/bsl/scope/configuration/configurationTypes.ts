const GLOBAL_MANAGER_TYPE_PATTERN = /^([\wа-я]+)Менеджер$/i
const MANAGER_TYPE_PATTERN = /^([\wа-я]+)Менеджер.([\wа-я_][\wа-я_\d]*)$/i
const BASE_TYPE_PATTERN = /([\wа-я]+)(Менеджер|Объект|Выборка|Ссылка)(?:\.([\wа-я_][\wа-я_\d]*))?/i
const OBJECT_TYPE_PATTERN = /^([\wа-я]+)Объект\.([\wа-я_][\wа-я_\d]*)$/i

function isGlobalManagerType(typeId: string) {
    return GLOBAL_MANAGER_TYPE_PATTERN.test(typeId)
}

function getGlobalManagerType(typeId: string) {
    const match = GLOBAL_MANAGER_TYPE_PATTERN.exec(typeId)
    return match ? match[1] : ''
}

function isManagerType(typeId: string) {
    return MANAGER_TYPE_PATTERN.test(typeId)
}

function isObjectType(typeId: string) {
    return OBJECT_TYPE_PATTERN.test(typeId)
}

function isRefType(typeId: string) {
    return getTypeDetails(typeId)?.kind === 'ссылка'
}

function getObjectName(typeId: string) {
    const match = OBJECT_TYPE_PATTERN.exec(typeId)
    return match ? match[1] + '.' + match[2] : ''
}

function getTypeDetails(typeId: string) {
    const match = BASE_TYPE_PATTERN.exec(typeId)
    if (!match) {
        return undefined
    }

    return {
        type: match[1],
        kind: match[2],
        name: match[3]
    }
}

function getBaseTypeId(typeId: string) {
    const typeDetails = getTypeDetails(typeId)
    if (!typeDetails) {
        return undefined
    }

    const typeInfo = getTypeInfo(typeDetails.type)

    if (!typeDetails.name && (typeInfo.collection + typeDetails.kind).toLocaleLowerCase() === typeId.toLocaleLowerCase()) {
        return typeId
    }
    return `${typeDetails.type}${typeDetails.kind}.${typeInfo.typePattern}`
}

export interface TypeInfo { name: string, collection: string, typePattern: string, types: AvailableTypes }
export function getTypeInfo(type: string) {
    return typesInfo[type.toLocaleLowerCase()]
}

interface AvailableTypes { manager: boolean, object: boolean, ref: boolean }
interface AvailableTypesOptions { manager?: boolean, object?: boolean, ref?: boolean }
const typesInfo: { [key: string]: TypeInfo } = {}

function appendType(name: string, collection: string, typePattern: string, typesOpt: AvailableTypesOptions) {
    const gTypes = Object.assign({}, { manager: true, object: false, ref: false } as AvailableTypes, typesOpt) as AvailableTypes
    const def = {
        name, collection, typePattern, types: gTypes
    }
    typesInfo[name.toLocaleLowerCase()] = def
    typesInfo[collection.toLocaleLowerCase()] = def
}

appendType('Документ', 'Документы', '<Имя документа>', { object: true, ref: true })
appendType('Обработка', 'Обработки', '<Имя обработки>', { object: true })

export const Types = {
    isGlobalManagerType,
    getGlobalManagerType,
    isObjectType,
    getObjectName,
    getBaseTypeId,
    isManagerType,
    getTypeDetails,
    getTypeInfo,
    isRefType
}