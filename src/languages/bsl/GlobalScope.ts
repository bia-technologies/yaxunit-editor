import { Scope, Symbol } from '../../scope/Scope'
import yaxUnit from './YAxUnitScope'

const registry: Map<string, Scope> = new Map
const globalScope: Symbol[] = []

yaxUnit.global.members.forEach(m => {
    globalScope.push(m)
})
yaxUnit.symbols.forEach(s => {
    registry.set(s.id, s)
});

function resolveType(type:string){
    return registry.get(type)
}

export default {
    members: globalScope,
    resolveType
}