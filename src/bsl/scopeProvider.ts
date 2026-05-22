import { editor } from 'monaco-editor-core';
import { Scope, Member, GlobalScope, TypeDefinition } from '@/common/scope';
import { NamedSymbol } from '@/common/codeModel';
import { isModel } from '@/monaco/utils'
import { EditorScope } from './scope/editorScope'
import { AccessProperty, AccessSequenceSymbol, IndexAccessSymbol } from '@/bsl/codeModel'

type ResolvedSymbol = Promise<Member | undefined>
type ResolvedScope = Promise<Scope | undefined>
type ModelOrScope = editor.ITextModel | Scope
type TypeResolver = Pick<EditorScope, 'resolveType'>

const scopeProvider = {

    async resolveSymbolMember(model: ModelOrScope, symbol: AccessSequenceSymbol | NamedSymbol): ResolvedSymbol {
        let scope: Scope
        let typeResolver: TypeResolver | undefined
        if (isModel(model)) {
            const editorScope = EditorScope.getScope(model)
            scope = editorScope
            typeResolver = editorScope
        } else {
            scope = model
            typeResolver = typeResolverFromScope(scope)
        }

        if (symbol instanceof AccessSequenceSymbol) {
            return resolveSequenceMember(symbol.access, scope, typeResolver)
        } else {
            return scope.findMember(symbol.name)
        }
    },

    async resolveSymbolParentScope(scope: Scope, symbol: AccessSequenceSymbol | NamedSymbol, typeResolver?: TypeResolver): ResolvedScope {
        const resolver = typeResolver ?? typeResolverFromScope(scope)
        if (symbol instanceof AccessSequenceSymbol) {
            const lastSymbol = symbol.unclosed ? symbol.last : symbol.access[symbol.access.length - 2]
            if (lastSymbol && lastSymbol.type) {
                return await resolveType(lastSymbol.type, resolver)
            }
            const parentSequence = [...symbol.access]
            if (!symbol.unclosed) {
                parentSequence.pop()
            }
            if (parentSequence.length === 0) {
                return scope
            }
            const member = await resolveSequenceMember(parentSequence, scope, resolver)
            if (member) {
                return resolveType(await member.type, resolver)
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
}

async function resolveSequenceMember(symbols: AccessProperty[], scope: Scope, typeResolver?: TypeResolver) {

    let resolvedScope: Scope | undefined = scope
    let resolvedMember: Member | undefined

    for (const accessSymbol of symbols) {
        if (accessSymbol instanceof IndexAccessSymbol) {
            return undefined
        }

        if (resolvedMember !== undefined) { // Не первый шаг
            resolvedScope = await resolveType(await resolvedMember.type, typeResolver)
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

async function resolveType(typeId: string | undefined, typeResolver?: TypeResolver): Promise<TypeDefinition | undefined> {
    return await typeResolver?.resolveType(typeId) ?? GlobalScope.resolveType(typeId)
}

function typeResolverFromScope(scope: Scope): TypeResolver | undefined {
    return 'resolveType' in scope && typeof scope.resolveType === 'function'
        ? scope as Scope & TypeResolver
        : undefined
}

export {
    scopeProvider
}
