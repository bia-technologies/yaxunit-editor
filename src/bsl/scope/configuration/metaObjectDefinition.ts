export interface ObjectDefinition {
    properties: PropertyDefinition[]
    objectModule?: string
    managerModule?: string
}

export interface PropertyDefinition {
    name: string,
    type: string,
    description?: string
}