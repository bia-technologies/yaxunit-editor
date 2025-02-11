interface Symbol {
    name: string
}

interface SymbolRange extends Symbol {
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
}

export interface Parameter extends Symbol {
    default?: string
    byVal: boolean
}

export interface Variable extends Symbol {
    type?: string
}
export interface ModuleVariable extends Variable {
    isExport: boolean
}

export interface Method extends SymbolRange {
    isExport: boolean
    isProc: boolean
    params: Parameter[]
    vars?: Variable[]
}

export interface Module {
    vars: ModuleVariable[]
    methods: Method[]
}
