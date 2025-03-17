export interface Variable {
    type?: string | Promise<string | undefined>
    name: string
}

export interface ModuleVariable {
    isExport: boolean
    name: string
}