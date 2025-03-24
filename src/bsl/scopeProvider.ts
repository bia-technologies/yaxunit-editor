import { editor } from 'monaco-editor-core';
import { Scope, Member, GlobalScope } from '@/common/scope';
import { NamedSymbol } from '@/common/codeModel';
import { isModel } from '@/monaco/utils'
import { EditorScope } from './scope/editorScope'
import { AccessProperty, AccessSequenceSymbol, IndexAccessSymbol } from '@/bsl/codeModel'

type ResolvedSymbol = Promise<Member | undefined>
type ResolvedScope = Promise<Scope | undefined>
type ModelOrScope = editor.ITextModel | Scope

const scopeProvider = {

    async resolveSymbolMember(model: ModelOrScope, symbol: AccessSequenceSymbol | NamedSymbol): ResolvedSymbol {
        let scope: Scope | undefined = isModel(model) ? EditorScope.getScope(model) : model

        if (symbol instanceof AccessSequenceSymbol) {
            return resolveSequenceMember(symbol.access, scope)
        } else {
            return scope.findMember(symbol.name)
        }
    },

    async resolveSymbolParentScope(scope: Scope, symbol: AccessSequenceSymbol | NamedSymbol): ResolvedScope {
        if (symbol instanceof AccessSequenceSymbol) {
            const lastSymbol = symbol.unclosed ? symbol.last : symbol.access[symbol.access.length - 2]
            if (lastSymbol && lastSymbol.type) {
                return await GlobalScope.resolveType(lastSymbol.type)
            }
            const parentSequence = [...symbol.access]
            if (!symbol.unclosed) {
                parentSequence.pop()
            }
            if (parentSequence.length === 0) {
                return scope
            }
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

export {
    scopeProvider
}
