const MANAGER_TYPE_PATTERN = /^([\wа-я]+)Менеджер$/i
const BASE_TYPE_PATTERN = /^([\wа-я]+)(Менеджер|Объект|Выборка|Ссылка)$/i
const OBJECT_TYPE_PATTERN = /^([\wа-я]+)Объект\.([\wа-я_][\wа-я_\d]*)$/i

function isManagerType(typeId: string) {
    return MANAGER_TYPE_PATTERN.test(typeId)
}

function getManagerName(typeId: string) {
    const match = MANAGER_TYPE_PATTERN.exec(typeId)
    return match ? match[1] : ''
}

function isObjectType(typeId: string) {
    return OBJECT_TYPE_PATTERN.test(typeId)
}

function getObjectName(typeId: string) {
    const match = OBJECT_TYPE_PATTERN.exec(typeId)
    return match ? match[1] + '.' + match[2] : ''
}

function getBaseTypeId(typeId: string) {
    const match = BASE_TYPE_PATTERN.exec(typeId)
    if (!match) {
        return undefined
    }

    const typeInfo = getTypeInfo(match[1])

    if (typeInfo.collection + match[2] === typeId) {
        return typeId
    }
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
    isManagerType,
    getManagerName,
    isObjectType,
    getObjectName
}