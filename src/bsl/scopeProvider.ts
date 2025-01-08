import { editor, Position } from 'monaco-editor';
import tokensProvider, { TokensSequence } from './tokensProvider'
import { getModelScope, UnionScope } from '../scope/scopeStore';
import { Scope, Symbol } from '../scope/Scope';
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
    },
    currentSymbol(model: editor.ITextModel, position: Position): Symbol | undefined {
        const tokensSequence = tokensProvider.resolve(model, position)

        console.debug('tokensSequence: ', tokensSequence)
        if (tokensSequence === undefined || tokensSequence.lastSymbol === ')') {
            return undefined
        }

        const scope = getModelScope(model)
        const word = model.getWordAtPosition(position)?.word
        return currentMember(tokensSequence, scope, position.lineNumber, word)
    }
}

function currentMember(tokensSequence: TokensSequence, unionScope: UnionScope, lineNumber: number, word?:string): Symbol | undefined {
    tokensSequence.closed = false
    if (tokensSequence.tokens.length === 1) {
        return globalScopeMember(word??tokensSequence.tokens[0], unionScope, lineNumber)
    }
    const scope = objectScope(tokensSequence, unionScope, lineNumber)
    if (scope) {
        return findMember(scope, word??tokensSequence.tokens[tokensSequence.tokens.length - 1])
    }
}

function objectScope(tokensSequence: TokensSequence, unionScope: UnionScope, lineNumber: number): Scope | undefined {

    console.debug('calculate objectScope');

    const tokens = tokensSequence.tokens
    const firstToken = tokens[tokens.length - 1];
    let scope = resolveInUnionScope(firstToken, unionScope, lineNumber)

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

        const member = findMember(scope, token)
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

function findMember(scope: Scope, token: string): Symbol | undefined {
    return scope.getMembers().find(s => s.name.localeCompare(token, undefined, { sensitivity: 'accent' }) === 0)
}

function globalScopeMember(token: string, unionScope: UnionScope, lineNumber: number): Symbol | undefined {
    const scopes = unionScope.getScopes(lineNumber);

    for (let index = scopes.length - 1; index >= 0; index--) {
        const scope = scopes[index]
        const member = findMember(scope, token)
        if (member) {
            return member
        }
    }
    return undefined
}

function resolveInUnionScope(token: string, unionScope: UnionScope, lineNumber: number): Scope | undefined {
    const member = globalScopeMember(token, unionScope, lineNumber)

    if (member) {
        if (member.type) {
            const tokenScope = globalScope.resolveType(member.type)
            if (tokenScope) {
                return tokenScope
            }
        }
        return undefined
    }
}

export {
    scopeProvider
}
