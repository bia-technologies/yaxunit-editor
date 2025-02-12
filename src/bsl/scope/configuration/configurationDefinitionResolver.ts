import { ObjectDefinition } from "./objectDefinition"
import { Types, getTypeInfo } from './configurationTypes'
import { getItemManagerType } from "./genericTypes"

export class DefinitionResolver {
    async resolveTypeDefinition(typeId: string): Promise<ObjectDefinition | undefined> {
        if (Types.isManagerType(typeId)) {
            return resolveObjectsList(Types.getManagerName(typeId))
        } else if (Types.isObjectType(typeId)) {
            return resolveObjectDefinition(Types.getObjectName(typeId))
        }
        return undefined
    }
}

async function resolveObjectsList(listId: string): Promise<ObjectDefinition | undefined> {
    const item = data[listId.toLocaleLowerCase()]
    if (!item) {
        return undefined
    }
    const typeInfo = getTypeInfo(listId)

    return {
        properties: Object.keys(item).map(n => {
            return {
                name: n,
                type: getItemManagerType(typeInfo, n)
            }
        })
    }
}

async function resolveObjectDefinition(objectId: string) {
    return undefined
}

const data: {
    [key: string]: {
        [key: string]: ObjectDefinition
    }
} = {
    обработки: {
        Тестовая: { properties: [{ name: 'Свойство1', type: 'Строка' }] }
    },
    документы: {
        Тестовый: { properties: [{ name: 'РеквизитДокумента1', type: 'Строка' }, { name: 'РеквизитДокумента2', type: 'Строка' }] }
    }
}