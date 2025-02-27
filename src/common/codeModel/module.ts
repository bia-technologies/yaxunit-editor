import { Method, ModuleVariable } from "."

export interface Module {
    vars: ModuleVariable[]
    methods: Method[]
}
