import { editor, Position } from 'monaco-editor-core';
import tokensProvider, { TokensSequence } from './tokensProvider'
import { Scope, Symbol, GlobalScope, EditorScope } from '../scope';

const scopeProvider = {
    resolveScope(model: editor.ITextModel, position: Position): Scope | undefined {
        const tokensSequence = tokensProvider.resolve(model, position)

        console.debug('tokensSequence: ', tokensSequence)
        if (tokensSequence === undefined || tokensSequence.lastSymbol === ')') {
            return undefined
        }

        const scope = EditorScope.getScope(model)

        if (tokensSequence.tokens.length === 0 || tokensSequence.tokens.length === 1 && !tokensSequence.closed) {
            return scope
        } else {
            return objectScope(tokensSequence, scope, position.lineNumber)
        }
    },
    currentSymbol(model: editor.ITextModel, position: Position): Symbol | undefined {
        console.debug('current symbol')
        const tokensSequence = tokensProvider.resolve(model, position)

        console.debug('tokensSequence: ', tokensSequence)
        if (tokensSequence === undefined || tokensSequence.lastSymbol === ')') {
            return undefined
        }

        tokensSequence.closed = false

        const scope = EditorScope.getScope(model)
        const word = model.getWordAtPosition(position)?.word
        return currentMember(tokensSequence, scope, position.lineNumber, word)
    },
    currentMethod(model: editor.ITextModel, position: Position, tokensSequence?: TokensSequence): Symbol | undefined {
        console.debug('Get current method')
        console.debug('current word', model.getWordUntilPosition(position)?.word)

        if (!tokensSequence) {
            tokensSequence = tokensProvider.findMethod(model, position)
        }
        console.debug('tokensSequence: ', tokensSequence)

        if (tokensSequence === undefined) {
            return undefined
        }

        tokensSequence.closed = false
        const scope = EditorScope.getScope(model)
        return currentMember(tokensSequence, scope, position.lineNumber)
    }
}

function currentMember(tokensSequence: TokensSequence, editorScope: EditorScope, lineNumber: number, word?: string): Symbol | undefined {
    if (tokensSequence.tokens.length === 1) {
        return globalScopeMember(word ?? tokensSequence.tokens[0], editorScope, lineNumber)
    }
    const scope = objectScope(tokensSequence, editorScope, lineNumber)
    if (scope) {
        return findMember(scope, word ?? tokensSequence.lastSymbol)
    }
    return undefined
}

function objectScope(tokensSequence: TokensSequence, editorScope: EditorScope, lineNumber: number): Scope | undefined {

    console.debug('calculate objectScope');

    const tokens = tokensSequence.tokens
    const firstToken = tokens[tokens.length - 1];
    let scope = resolveInEditorScope(firstToken, editorScope, lineNumber)

    if (!scope) {
        console.debug('don\'t found in global scope')
        return undefined
    }

    const minIndex = tokensSequence.closed ? 1 : 0
    for (let index = tokens.length - 2; index > - minIndex; index--) {
        let token = tokens[index];

        console.debug('analyze token ' + token)

        token = cleanToken(token)
        const member = findMember(scope, token)
        if (member !== undefined && member.type !== undefined) {
            const tokenScope = GlobalScope.resolveType(member.type)
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
    const member = scope.getMembers().find(s => s.name.localeCompare(token, undefined, { sensitivity: 'accent' }) === 0)
    console.debug('find member', token, 'in scope', scope, 'result = ', member)
    return member
}

function globalScopeMember(token: string, editorScope: EditorScope, lineNumber: number): Symbol | undefined {
    const scopes = editorScope.getScopesAtLine(lineNumber);

    token = cleanToken(token)
    
    for (let index = scopes.length - 1; index >= 0; index--) {
        const scope = scopes[index]
        const member = findMember(scope, token)
        if (member) {
            return member
        }
    }
    return undefined
}

function resolveInEditorScope(token: string, editorScope: EditorScope, lineNumber: number): Scope | undefined {
    const member = globalScopeMember(token, editorScope, lineNumber)

    if (member) {
        if (member.type) {
            const tokenScope = GlobalScope.resolveType(member.type)
            if (tokenScope) {
                return tokenScope
            }
        }
    }
    return undefined
}

function cleanToken(token: string): string {
    const pos1 = token.indexOf('(')
    const pos2 = token.indexOf('[')

    if (pos1 > 0 && pos2 > 0) {
        return token.substring(0, Math.min(pos1, pos2))
    } else if (pos1 > 0) {
        return token.substring(0, pos1)
    } else if (pos2 > 0) {
        return token.substring(0, pos2)
    }
    return token;
}
export {
    scopeProvider
}
