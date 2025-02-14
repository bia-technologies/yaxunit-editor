import { editor, Position } from 'monaco-editor-core';
import tokensProvider, { TokensSequence } from './tokensProvider'
import { Scope, Symbol, GlobalScope, EditorScope, } from '@/scope';
import { Method } from './Symbols';

type ResolvedSymbol = Promise<Symbol|undefined>
type ResolvedScope= Promise<Scope|undefined>

const scopeProvider = {
    async resolveScope(model: editor.ITextModel, position: Position): ResolvedScope {
        const tokensSequence = tokensProvider.resolve(model, position)

        console.debug('tokensSequence: ', tokensSequence)
        if (tokensSequence === undefined || tokensSequence.lastSymbol === ')') {
            return undefined
        }

        const scope = EditorScope.getScope(model)

        if (tokensSequence.tokens.length === 0 || tokensSequence.tokens.length === 1 && !tokensSequence.closed) {
            return scope
        } else {
            return objectScope(tokensSequence, scope)
        }
    },
    resolveExpressionType(model: editor.ITextModel, tokens: string[]) {
        tokens = tokens.reverse()
        const tokensSequence: TokensSequence = {
            tokens,
            lastSymbol: tokens[0],
            closed: false
        }
        const scope = EditorScope.getScope(model)
        let resolvedScope: Scope | undefined
        if (tokens.length > 1) {
            resolvedScope = objectScope(tokensSequence, scope)
        } else {
            resolvedScope = scope
        }
        if (resolvedScope) {
            return resolvedScope.findMember(tokensSequence.lastSymbol)?.type
        } else {
            return undefined
        }

    },

    async currentSymbol(model: editor.ITextModel, position: Position): ResolvedSymbol {
        console.debug('current symbol')
        const tokensSequence = tokensProvider.resolve(model, position)

        console.debug('tokensSequence: ', tokensSequence)
        if (tokensSequence === undefined || tokensSequence.lastSymbol === ')') {
            return undefined
        }

        tokensSequence.closed = false

        const scope = EditorScope.getScope(model)
        const word = model.getWordAtPosition(position)?.word
        return currentMember(tokensSequence, scope, word)
    },
    async currentMethod(model: editor.ITextModel, position: Position, tokensSequence?: TokensSequence): ResolvedSymbol {
        console.debug('Get current method')
        console.debug('current word', model.getWordUntilPosition(position)?.word)

        if (!tokensSequence) {
            tokensSequence = tokensProvider.currentMethod(model, position)
        }
        console.debug('tokensSequence: ', tokensSequence)

        if (tokensSequence === undefined) {
            return undefined
        }

        tokensSequence.closed = false
        const scope = EditorScope.getScope(model)
        return await currentMember(tokensSequence, scope)
    },
    getModelMethods(model: editor.ITextModel): Method[] | undefined {
        const scope = EditorScope.getScope(model)
        if (scope) {
            return scope.getMethods()
        } else {
            return undefined
        }
    }
}

async function currentMember(tokensSequence: TokensSequence, editorScope: EditorScope, word?: string): ResolvedSymbol {
    if (tokensSequence.tokens.length === 1) {
        return globalScopeMember(word ?? tokensSequence.tokens[0], editorScope)
    }
    const scope = await objectScope(tokensSequence, editorScope)
    if (scope) {
        return scope.findMember(word ?? tokensSequence.lastSymbol)
    }
    return undefined
}

async function objectScope(tokensSequence: TokensSequence, editorScope: EditorScope): ResolvedScope {

    console.debug('calculate objectScope');

    const tokens = tokensSequence.tokens
    const firstToken = tokens[tokens.length - 1];
    let scope = await resolveInEditorScope(firstToken, editorScope)

    if (!scope) {
        console.debug('don\'t found in global scope')
        return undefined
    }

    const minIndex = tokensSequence.closed ? 1 : 0
    for (let index = tokens.length - 2; index > - minIndex; index--) {
        let token = tokens[index];

        console.debug('analyze token ' + token)

        token = cleanToken(token)
        const member = scope.findMember(token)
        if (member !== undefined && member.type !== undefined) {
            const tokenScope = await GlobalScope.resolveType(member.type)
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

function globalScopeMember(token: string, editorScope: EditorScope): Symbol | undefined {
    token = cleanToken(token)
    return editorScope.findMember(token)
}

async function resolveInEditorScope(token: string, editorScope: EditorScope): ResolvedScope {
    const member = globalScopeMember(token, editorScope)

    if (member) {
        if (member.type) {
            const tokenScope = await GlobalScope.resolveType(member.type)
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
