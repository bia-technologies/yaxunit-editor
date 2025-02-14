import { ObjectDefinition } from "./objectDefinition"
import { Types, getTypeInfo } from './configurationTypes'
import { getItemManagerType } from "./genericTypes"

export class DefinitionResolver {
    async resolveObjectsList(listId: string): Promise<ObjectDefinition | undefined> {
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
    async resolveObject(type: string, name: string): Promise<ObjectDefinition | undefined> {
        const typeInfo = Types.getTypeInfo(type)
        const list = data[typeInfo.collection.toLocaleLowerCase()]
        if (!list) {
            return undefined
        }
        const object = list[name]
        if (!object) {
            return undefined
        }
        return object
    }
}

const data: {
    [key: string]: {
        [key: string]: ObjectDefinition
    }
} = {
    обработки: {
        тестовая: { properties: [{ name: 'Свойство1', type: 'Строка' }] }
    },
    документы: {
        тестовый: { properties: [{ name: 'РеквизитДокумента1', type: 'Строка' }, { name: 'РеквизитДокумента2', type: 'Строка' }] }
    }
}