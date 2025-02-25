import { editor } from 'monaco-editor-core';
import { TokensSequence, TokensSequenceType } from './tokensProvider'
import { Scope, Symbol, GlobalScope, EditorScope, TypeDefinition, } from '@/scope';
import { Method } from './Symbols';
import { MethodCall } from '@/tree-sitter/symbols';

type ResolvedSymbol = Promise<Symbol | undefined>
type ResolvedScope = Promise<Scope | undefined>

const scopeProvider = {
    async resolveExpressionTypeId(model: editor.ITextModel, tokens: string[]) {
        tokens = tokens.reverse()
        const tokensSequence: TokensSequence = {
            tokens,
            lastSymbol: tokens[0],
            type: TokensSequenceType.expression,
            closed: false
        }
        const scope = EditorScope.getScope(model)
        let resolvedScope: Scope | undefined
        if (tokens.length > 1) {
            resolvedScope = await objectScope(tokensSequence, scope)
        } else {
            resolvedScope = scope
        }
        if (resolvedScope) {
            const type = resolvedScope.findMember(tokensSequence.lastSymbol)?.type
            if (type) {
                return await getType(type)
            }
        }
        return undefined
    },

    async resolveExpressionType(model: editor.ITextModel, tokens: string[]): Promise<TypeDefinition | undefined> {
        const typeId = await this.resolveExpressionTypeId(model, tokens)
        return GlobalScope.resolveType(typeId)
    },

    async currentMethod(model: editor.ITextModel, method: MethodCall): ResolvedSymbol {
        console.debug('Get current method')
        let scope: Scope | undefined
        if (method.path && method.path.length) {
            scope = await this.resolveExpressionType(model, method.path)
        }else{
            scope = EditorScope.getScope(model)
        }
        
        return scope?.findMember(method.name)
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
        if (member && member.type) {
            const tokenScope = await GlobalScope.resolveType(await getType(member.type))
            if (tokenScope) {
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
            const tokenScope = await GlobalScope.resolveType(await getType(member.type))
            if (tokenScope) {
                return tokenScope
            }
        }
    }
    return undefined
}

async function getType(type: string | Promise<string | undefined>): Promise<string | undefined> {
    if (type instanceof Promise) {
        return await type
    } else {
        return type
    }
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
