import { ObjectDefinition } from "./objectDefinition";
import { GlobalScope, GlobalScopeItem, TypeDefinition } from "@/common/scope";
import { createConfigurationType, createProxyType } from "./genericTypes";
import { DefinitionResolver } from "./configurationDefinitionResolver";
import { Types } from "./configurationTypes";

export class ConfigurationScope extends GlobalScopeItem {
    objects: { [key: string]: ObjectDefinition[] } = {}
    definitionResolver: DefinitionResolver = new DefinitionResolver()

    async resolveType(typeId: string): Promise<TypeDefinition | undefined> {
        const type = await super.resolveType(typeId)
        if (type) {
            return type
        }

        let registeredNewType = false
        let definition: ObjectDefinition | undefined = undefined

        if (Types.isGlobalManagerType(typeId)) {
            definition = await this.definitionResolver.resolveObjectsList(Types.getGlobalManagerType(typeId))
            if (definition) {
                registeredNewType = await this.registerType(typeId, definition)
            }
        } else if (Types.isManagerType(typeId)) {
            registeredNewType = await this.registerProxyType(typeId)
        } else if (Types.isObjectType(typeId)) {
            const typeDetails = Types.getTypeDetails(typeId)
            if (typeDetails) {
                definition = await this.definitionResolver.resolveObject(typeDetails.type, typeDetails.name)
                if (definition) {
                    registeredNewType = await this.registerObjectType(typeId, definition)
                }
            }
        } else if (Types.isRefType(typeId)) {
            const typeDetails = Types.getTypeDetails(typeId)
            if (typeDetails) {
                registeredNewType = await this.registerProxyType(typeId)
            }
        }

        if (registeredNewType) {
            return super.resolveType(typeId)
        }
        return undefined
    }

    async registerType(typeId: string, definition: ObjectDefinition): Promise<boolean> {
        const type = await createConfigurationType(typeId, definition)
        return this.addType(type)
    }

    async registerProxyType(typeId: string): Promise<boolean> {
        const type = await createProxyType(typeId)
        return this.addType(type)
    }

    async registerObjectType(typeId: string, definition: ObjectDefinition): Promise<boolean> {
        const type = await createProxyType(typeId, definition)
        return this.addType(type)
    }

    addType(type: TypeDefinition | undefined): boolean {
        if (type) {
            this.appendType(type)
            console.debug('append new configuration type', type)
            return true
        } else {
            return false
        }
    }
}

const configurationScope = new ConfigurationScope([], []);

GlobalScope.registerScope('configuration-scope', configurationScope)