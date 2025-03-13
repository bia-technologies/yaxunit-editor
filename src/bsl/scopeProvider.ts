import { editor } from 'monaco-editor-core';
import { Scope, Member, GlobalScope, TypeDefinition, } from '@/common/scope';
import { Method, NamedSymbol } from '@/common/codeModel';
import { isModel } from '@/monaco/utils'
import { EditorScope } from './scope/editorScope'
import { AccessProperty, AccessSequenceSymbol, IndexAccessSymbol } from '@/bsl/codeModel'

type ResolvedSymbol = Promise<Member | undefined>
type ResolvedScope = Promise<Scope | undefined>
type ModelOrScope = editor.ITextModel | Scope

const scopeProvider = {
    async resolveExpressionType(scope: Scope, tokens: string[]): Promise<TypeDefinition | undefined> {
        const typeId = await resolveExpressionTypeId(scope, tokens)
        return GlobalScope.resolveType(typeId)
    },

    async resolveSymbolMember(model: ModelOrScope, symbol: AccessSequenceSymbol | NamedSymbol): ResolvedSymbol {
        let scope: Scope | undefined = isModel(model) ? EditorScope.getScope(model) : model

        if (symbol instanceof AccessSequenceSymbol) {
            return resolveSequenceMember(symbol.access, scope)
        } else {
            return scope.findMember(symbol.name)
        }
    },

    async resolveSymbolParentScope(model: ModelOrScope, symbol: AccessSequenceSymbol | NamedSymbol): ResolvedScope {
        let scope: Scope | undefined = isModel(model) ? EditorScope.getScope(model) : model

        if (symbol instanceof AccessSequenceSymbol) {
            const parentSequence = [...symbol.access]
            parentSequence.pop()
            const member = await resolveSequenceMember(parentSequence, scope)
            if (member) {
                return GlobalScope.resolveType(await member.type)
            } else {
                return undefined
            }
        } else {
            return scope
        }
    },

    resolveType(typeId: string) {
        return GlobalScope.resolveType(typeId)
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

async function resolveExpressionTypeId(scope: Scope, tokens: string[]) {
    tokens = [...tokens]
    const lastSymbol = tokens.pop()

    let resolvedScope: Scope | undefined
    if (tokens.length > 0) {
        resolvedScope = await objectScope(tokens, scope)
    } else {
        resolvedScope = scope
    }

    if (resolvedScope && lastSymbol) {
        const member = resolvedScope.findMember(lastSymbol)
        return await member?.type
    }
    return undefined
}

async function resolveSequenceMember(symbols: AccessProperty[], scope: Scope) {

    let resolvedScope: Scope | undefined = scope
    let resolvedMember: Member | undefined

    for (const accessSymbol of symbols) {
        if (accessSymbol instanceof IndexAccessSymbol) {
            return undefined
        }

        if (resolvedMember !== undefined) { // Не первый шаг
            resolvedScope = await GlobalScope.resolveType(await resolvedMember.type)
        }
        if (resolvedScope) {
            resolvedMember = resolvedScope.findMember(accessSymbol.name)
        }
        if (resolvedMember === undefined) {
            break
        }
    }

    return resolvedMember
}

async function objectScope(tokens: string[], editorScope: Scope): ResolvedScope {

    console.debug('calculate objectScope');

    const firstToken = tokens[0];
    let scope = await globalScopeMember(firstToken, editorScope)

    if (!scope) {
        console.debug('don\'t found in global scope')
        return undefined
    }

    for (let index = 1; index < tokens.length; index++) {
        let token = tokens[index];

        console.debug('analyze token ' + token)

        token = cleanToken(token)
        const member = scope.findMember(token)
        if (member && member.type) {
            const tokenScope = await GlobalScope.resolveType(await member.type)
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

async function globalScopeMember(token: string, scope: Scope): ResolvedScope {
    const member = scope.findMember(token)

    if (member) {
        if (member.type) {
            const tokenScope = await GlobalScope.resolveType(await member.type)
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
