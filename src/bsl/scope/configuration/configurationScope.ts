import { GlobalScope } from "@/scope/globalScopeManager";
import { ObjectDefinition } from "./metaObjectDefinition";
import { GlobalScopeItem, TypeDefinition } from "@/scope";
import { createCollectionManagerType, createManagerType, createObjectType, createRefType, getTypeInfo } from "./genericTypes";

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
        if (typeId.startsWith('документы')) {
            this.importDefinition('Документ', 'Тестовый', { properties: [{ name: 'РеквизитДокумента1', type: 'Строка' }, { name: 'РеквизитДокумента2', type: 'Строка' }] })
        }
        return super.resolveType(typeId)
    }

    private importDefinition(type: string, name: string, object: ObjectDefinition): void {
        const typeInfo = getTypeInfo(type)
        this.appendType(createCollectionManagerType(typeInfo, [name]))
        if (typeInfo.types.manager) {
            this.appendType(createManagerType(typeInfo, name))
        }
        if (typeInfo.types.object) {
            this.appendType(createObjectType(typeInfo, name, object))
        }
        if (typeInfo.types.ref) {
            this.appendType(createRefType(typeInfo, name))
        }
    }
}

const configurationScope = new ConfigurationScope([], []);

GlobalScope.registerScope('configuration-scope', configurationScope)