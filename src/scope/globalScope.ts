import { Scope, Symbol } from './Scope'

const registry: Map<string, Scope> = new Map
const globalScope: Symbol[] = []

function resolveType(type:string){
    return registry.get(type)
}

function registerGlobalSymbols(symbols: Symbol[]):void{
    symbols.forEach(s => {
        globalScope.push(s)
    })
}

function registerTypes(symbols:Scope[]):void {
    symbols.forEach(s => {
        registry.set(s.id, s)
    });
}
export default {
    members: globalScope,
    resolveType,
    registerGlobalSymbols,
    registerTypes
}