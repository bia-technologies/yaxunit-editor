import { AccessProperty, AccessSequenceSymbol, MethodCallSymbol } from './model'

export * from '@/common/codeModel/utils'

export function currentAccessSequence(symbol: AccessProperty | MethodCallSymbol) {
    if (symbol.parent instanceof AccessSequenceSymbol) {
        const seq = new AccessSequenceSymbol(symbol.parent.position)
        seq.parent = symbol.parent.parent

        seq.access = [...symbol.parent.access]
        for (let index = seq.access.length; index > 0; index--) {
            if (symbol === seq.access[index - 1]) {
                seq.access.length = index
                break
            }
        }
        seq.type = seq.access[seq.accept.length - 1].type
        return seq
    }
}