interface Symbol {
    name: string
}

interface SymbolRange extends Symbol{
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
}

export interface Parameter extends Symbol {
    default?: string
    byVal: boolean
}

export type Variable = Symbol
export interface ModuleVariable extends Symbol{
    isExport: boolean
}

export interface Method extends SymbolRange {
    isExport: boolean
    isProc: boolean
    params: Parameter[]
    vars: Variable[]
    autoVars: Variable[]
}

export interface Module {
    vars: ModuleVariable[]
    methods: Method[]
}
