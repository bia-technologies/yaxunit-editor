import { editor, Position } from 'monaco-editor';
import resolver from './resolver'
import { getModelScope, UnionScope } from '../scope/scopeStore';
import { Scope } from '../scope/Scope';
import globalScope from '../scope/globalScope'

const scopeProvider = {
    resolveScope(model: editor.ITextModel, position: Position): Scope | undefined {
        const tokens = resolver.resolve(model, position)

        if (tokens === undefined) {
            return undefined
        }

        const scope = getModelScope(model)
        if (tokens.length === 0) {
            return scope
        } else {
            return objectScopeCompletion(tokens, scope, position.lineNumber)
        }
    }
}

function objectScopeCompletion(tokens: string[], unionScope: UnionScope, lineNumber: number): Scope | undefined {

    const lastToken = tokens[tokens.length - 1];
    let scope = resolveInUnionScope(lastToken, unionScope, lineNumber)

    if (!scope) {
        return undefined
    }

    for (let index = tokens.length - 2; index > 0; index--) {
        let token = tokens[index];

        const pos1 = token.indexOf('(')
        const pos2 = token.indexOf('[')

        if (pos1 > 0 && pos2 > 0) {
            token = token.substring(0, Math.min(pos1, pos2))
        } else if (pos1 > 0) {
            token = token.substring(0, pos1)
        } else if (pos2 > 0) {
            token = token.substring(0, pos2)
        }

        const member = scope.getMembers().find(s => s.name.localeCompare(token, undefined, { sensitivity: 'accent' }) === 0)
        if (member !== undefined && member.type !== undefined) {
            const tokenScope = globalScope.resolveType(member.type)
            if (tokenScope !== undefined) {
                scope = tokenScope
            } else {
                scope = undefined
                break
            }
        } else {
            scope = undefined
            break
        }
    }
    return scope
}

function resolveInUnionScope(token: string, unionScope: UnionScope, lineNumber: number): Scope | undefined {
    const scopes = unionScope.getScopes(lineNumber);

    for (let index = scopes.length - 1; index >= 0; index--) {
        const scope = scopes[index]
        const member = scope.getMembers().find(s => s.name.localeCompare(token, undefined, { sensitivity: 'accent' }) === 0)
        if (member !== undefined) {
            if (member.type !== undefined) {
                const tokenScope = globalScope.resolveType(member.type)
                if (tokenScope !== undefined) {
                    return tokenScope
                }
            }
            return undefined
        }
    }
    return undefined
}

export {
    scopeProvider
}
