import { TypeDefinition } from './scope'
import { Symbol } from './symbols'

const registry: Map<string, TypeDefinition> = new Map
const globalMembers: Symbol[] = []

function resolveType(type:string){
    return registry.get(type)
}

function registerGlobalSymbols(symbols: Symbol[]):void{
    symbols.forEach(s => {
        globalMembers.push(s)
    })
}

function registerTypes(symbols:TypeDefinition[]):void {
    symbols.forEach(s => {
        registry.set(s.id, s)
    });
}

export const GlobalScope = {
    id: 'global-scope',
    members: globalMembers,
    resolveType,
    registerGlobalSymbols,
    registerTypes
}