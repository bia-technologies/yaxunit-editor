import { editor, Position } from 'monaco-editor';
import tokensProvider, { TokensSequence } from './tokensProvider'
import { getModelScope, UnionScope } from '../scope/scopeStore';
import { Scope } from '../scope/Scope';
import globalScope from '../scope/globalScope'

const scopeProvider = {
    resolveScope(model: editor.ITextModel, position: Position): Scope | undefined {
        const tokensSequence = tokensProvider.resolve(model, position)

        console.debug('tokensSequence: ', tokensSequence)
        if (tokensSequence === undefined || tokensSequence.lastSymbol === ')') {
            return undefined
        }

        const scope = getModelScope(model)

        if (tokensSequence.tokens.length === 0 || tokensSequence.tokens.length === 1 && !tokensSequence.closed) {
            return scope
        } else {
            return objectScope(tokensSequence, scope, position.lineNumber)
        }
    }
}

function objectScope(tokensSequence: TokensSequence, unionScope: UnionScope, lineNumber: number): Scope | undefined {

    console.debug('calculate objectScope');

    const tokens = tokensSequence.tokens
    const lastToken = tokens[tokens.length - 1];
    let scope = resolveInUnionScope(lastToken, unionScope, lineNumber)

    if (!scope) {
        console.debug('don\'t found in global scope')
        return undefined
    }

    const minIndex = tokensSequence.closed ? 1 : 0
    for (let index = tokens.length - 2; index > - minIndex; index--) {
        let token = tokens[index];

        console.debug('analyze token ' + token)
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
