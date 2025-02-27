import { Symbol } from "./symbol"

export interface Variable extends Symbol {
    type?: string | Promise<string | undefined>
}

export interface ModuleVariable extends Variable {
    isExport: boolean
}