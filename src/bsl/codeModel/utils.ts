import { BaseSymbol, CodeSymbol, CompositeSymbol, isCompositeSymbol } from "@/common/codeModel"
import { AccessProperty, AccessSequenceSymbol, MethodCallSymbol } from './model'
import { editor, IRange } from 'monaco-editor-core'
import { FunctionDefinitionSymbol, isMethodDefinition, ProcedureDefinitionSymbol } from "../codeModel"

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
        seq.type = seq.last.type
        return seq
    }
}

export function symbolRange(symbol: BaseSymbol, model: editor.ITextModel): IRange {
    const method = isMethodDefinition(symbol) ? undefined : getParentMethodDefinition(symbol)
    const offset = method?.startOffset ?? 0
    const start = model.getPositionAt(offset + symbol.startOffset)
    const end = model.getPositionAt(offset + symbol.endOffset)

    return {
        startLineNumber: start.lineNumber,
        startColumn: start.column,
        endLineNumber: end.lineNumber,
        endColumn: end.column
    }
}

export function descendantByOffset(offset: number, compositeSymbol: CompositeSymbol): CodeSymbol | undefined {
    if (isMethodDefinition(compositeSymbol)) {
        offset -= compositeSymbol.startOffset
    }
    const children = compositeSymbol.getChildrenSymbols()
    const { node } = findNodeByOffset(children, offset) ?? {}
    if (node && isCompositeSymbol(node)) {
        const descendant = descendantByOffset(offset, node)
        if (descendant) {
            return descendant
        }
    }
    return node
}

export function descendantByRange(compositeSymbol: CompositeSymbol, start: number, end: number): BaseSymbol | undefined {
    if (isMethodDefinition(compositeSymbol)) {
        start -= compositeSymbol.startOffset
        end -= compositeSymbol.startOffset
    }
    const nodes = compositeSymbol.getChildrenSymbols()
    const { index: startIndex } = findNodeByOffset(nodes, start) ?? { index: 0 }

    for (let index = startIndex; index < nodes.length; index++) {
        const node = nodes[index];
        if (node && node.position.startOffset > end) {
            break
        }
        if (node && node.position.startOffset <= start && node.position.endOffset >= end) {
            const sub = isCompositeSymbol(node) ? descendantByRange(node, start, end) : undefined
            if (sub) {
                return sub
            } else {
                return node
            }
        }
    }
    return undefined
}

export function findNodeByOffset(nodes: (BaseSymbol | undefined)[], offset: number) {
    let lo = 0, hi = nodes.length - 1, mid = 0, node
    while (lo <= hi) {
        mid = Math.floor((lo + hi) / 2)
        node = nodes[mid]
        if (!node || node.startOffset > offset)
            hi = mid - 1
        else if (node.endOffset < offset)
            lo = mid + 1
        else {
            return { node, index: mid }
        }
    }
}

export function getParentMethodDefinition(symbol: BaseSymbol): ProcedureDefinitionSymbol | FunctionDefinitionSymbol | undefined {
    if (!symbol) {
        return undefined
    }
    if (isMethodDefinition(symbol)) {
        return symbol
    }
    let parent = symbol.parent
    while (parent && !isMethodDefinition(parent)) {
        parent = parent.parent
    }
    return parent as ProcedureDefinitionSymbol | FunctionDefinitionSymbol
}

export function updateOffset(symbols: (BaseSymbol | undefined)[], diffOffset: number) {
    for (const symbol of symbols) {
        if (symbol) {
            symbol.position.startOffset += diffOffset
            symbol.position.endOffset += diffOffset
            if (isCompositeSymbol(symbol)) updateOffset(symbol.getChildrenSymbols(), diffOffset)
        }
    }
}

export function hitOffset(symbol: BaseSymbol | undefined, offset: number) {
    if (!symbol || !symbol.position) {
        return false
    }
    return symbol.position.startOffset <= offset && symbol.position.endOffset >= offset
}
