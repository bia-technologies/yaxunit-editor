import { TypeDefinition, Symbol } from './Scope'

const registry: Map<string, TypeDefinition> = new Map
const globalScope: Symbol[] = []

function resolveType(type:string){
    return registry.get(type)
}

function registerGlobalSymbols(symbols: Symbol[]):void{
    symbols.forEach(s => {
        globalScope.push(s)
    })
}

function registerTypes(symbols:TypeDefinition[]):void {
    symbols.forEach(s => {
        registry.set(s.id, s)
    });
}
export default {
    id: 'global-scope',
    members: globalScope,
    resolveType,
    registerGlobalSymbols,
    registerTypes
}