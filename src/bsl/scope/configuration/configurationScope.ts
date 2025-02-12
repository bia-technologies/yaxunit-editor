import { GlobalScope } from "@/scope/globalScopeManager";
import { ObjectDefinition } from "./objectDefinition";
import { GlobalScopeItem, TypeDefinition } from "@/scope";
import { createCollectionManagerType, createManagerType, createObjectType, createRefType } from "./genericTypes";
import { DefinitionResolver } from "./configurationDefinitionResolver";

export class ConfigurationScope extends GlobalScopeItem {
    objects: { [key: string]: ObjectDefinition[] } = {}
    definitionResolver: DefinitionResolver = new DefinitionResolver()

    async resolveType(typeId: string): Promise<TypeDefinition | undefined> {
        const type = await super.resolveType(typeId)
        if (type) {
            return type
        }

        const definition = await this.definitionResolver.resolveTypeDefinition(typeId)
        if (definition) {

        }
        return super.resolveType(typeId)
    }

    // private importDefinition(type: string, name: string, object: ObjectDefinition): void {
    //     const typeInfo = getTypeInfo(type)
    //     this.appendType(createCollectionManagerType(typeInfo, [name]))
    //     if (typeInfo.types.manager) {
    //         this.appendType(createManagerType(typeInfo, name))
    //     }
    //     if (typeInfo.types.object) {
    //         this.appendType(createObjectType(typeInfo, name, object))
    //     }
    //     if (typeInfo.types.ref) {
    //         this.appendType(createRefType(typeInfo, name))
    //     }
    // }
}

const configurationScope = new ConfigurationScope([], []);

GlobalScope.registerScope('configuration-scope', configurationScope)