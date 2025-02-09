import { Scope, UnionScope } from './scope'
import { TypeDefinition, isTypeHolder } from './types'

const registry: { [key: string]: TypeDefinition } = {}
const globalScope: UnionScope = new UnionScope()

function resolveType(type: string): TypeDefinition | undefined {
    return registry[type.toLocaleLowerCase()]
}

function appendScope(scope: Scope) {
    globalScope.scopes.push(scope)

    if (isTypeHolder(scope)) {
        registerTypes(scope.getTypes())
    }
}

function registerTypes(symbols: TypeDefinition[]): void {
    symbols.forEach(symbol => {
        registry[symbol.id.toLocaleLowerCase()] = symbol
    });
}

function replaceType(typeId: string, type: TypeDefinition): void {
    registry[typeId.toLocaleLowerCase()] = type
}

export const GlobalScope = {
    id: 'global-scope',
    scope: globalScope,
    resolveType,
    appendScope,
    replaceType
}