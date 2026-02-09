import { IModelContentChange } from "@/bsl/chevrotain/parser"
import { BslCodeModel, isMethodDefinition, MethodDefinition } from "../model"
import { BaseSymbol, CompositeSymbol, SymbolPosition } from "@/common/codeModel"
import { getParentMethodDefinition, updateOffset } from "../utils"

export default {
    replaceSymbol,
    rootSymbol,
    removeSymbol,
    appendSymbol,
    removeNode,
    moveModelItems,
    getSymbolPosition,
    moveMethodsChildren,
    moveMethodChildren,
    moveRightChildren,
    updateMethodChildrenOffset,
    replaceNode,
    replace,
    isReplace
}

function replaceSymbol(codeModel: BslCodeModel, symbol: BaseSymbol | undefined, newSymbol: BaseSymbol | BaseSymbol[] | undefined, diff: number) {
    if (!symbol || !newSymbol) {
        throw 'Unexpected update symbol error'
    }

    if (Array.isArray(newSymbol) && newSymbol.length === 1) {
        newSymbol = newSymbol[0]
    }

    const changedItem = replaceNode(codeModel, symbol, newSymbol)
    if (!changedItem) {
        console.debug('Dont find replaced symbol -> rebuild')
        return false
    }
    let rootItem = Array.isArray(newSymbol) ? moveMethodsChildren(newSymbol, diff) : moveMethodChildren(newSymbol, diff)
    if (!rootItem) {
        rootItem = rootSymbol(newSymbol)
    }
    moveModelItems(codeModel, rootItem, diff)
    codeModel.afterUpdate(changedItem)
    console.debug('update ', symbol, 'to', newSymbol)

    return true
}

function rootSymbol(newSymbol: BaseSymbol | BaseSymbol[]) {
    let rootItem = Array.isArray(newSymbol) ? newSymbol[newSymbol.length - 1] : newSymbol
    while (rootItem.parent) {
        rootItem = rootItem.parent
    }

    return rootItem
}

function removeSymbol(codeModel: BslCodeModel, symbol: BaseSymbol | undefined, diff: number) {
    if (!symbol) {
        throw 'Dont set removed symbol'
    }
    const rootItem = rootSymbol(symbol)
    const rootIndex = rootItem ? codeModel.children.indexOf(rootItem) : -1

    const removed = removeNode(codeModel, symbol)
    moveModelItems(codeModel, rootIndex - 1, diff)

    codeModel.afterUpdate(codeModel)

    return removed
}

function appendSymbol() {
    throw 'Not implementation'
}

function removeNode(codeModel: BslCodeModel, oldSymbol: BaseSymbol) {
    const parent = (oldSymbol.parent ?? codeModel) as any
    for (const key in parent) {
        const value = parent[key]
        if (value === oldSymbol) {
            parent[key] = undefined
            return true
        } else if (Array.isArray(value)) {
            const index = value.indexOf(oldSymbol)
            if (index !== -1) {
                value.splice(index, 1)
                return true
            }
        }
    }
    return false
}

function moveModelItems(codeModel: BslCodeModel, method: BaseSymbol | number | undefined, diff: number) {
    if (method === undefined) {
        return
    }
    const methodIndex = method instanceof BaseSymbol ? codeModel.children.indexOf(method) : method
    for (let index = methodIndex + 1; index < codeModel.children.length; index++) {
        const node = codeModel.children[index];
        node.position.startOffset += diff
        node.position.endOffset += diff
    }
}

function getSymbolPosition(symbol: BaseSymbol): SymbolPosition {
    if (isMethodDefinition(symbol)) {
        return symbol.position
    }
    const method = getParentMethodDefinition(symbol)
    return method ? {
        startOffset: method.startOffset + symbol.startOffset,
        endOffset: method.startOffset + symbol.endOffset
    } : symbol.position
}

function moveMethodsChildren(symbols: BaseSymbol[], diff: number) {
    let lastMethod: MethodDefinition | undefined
    const order = []
    const lastSymbol = new Map<MethodDefinition, BaseSymbol>()
    for (const symbol of symbols) {
        if (isMethodDefinition(symbol)) {
            updateMethodChildrenOffset(symbol)
            lastSymbol.set(symbol, symbol)
        } else {
            const method = getParentMethodDefinition(symbol)
            if (!method) { continue }

            updateOffset([symbol], -method.startOffset)
            if (lastSymbol.has(method)) {
                lastSymbol.set(method, symbol)
            } else {
                lastSymbol.set(method, symbol)
                order.push(method)
            }
        }
    }

    for (const method of order) {
        const symbol = lastSymbol.get(method) as BaseSymbol
        if (symbol !== method) {
            moveRightChildren(symbol, method, diff)
        }
        lastMethod = method
    }
    return lastMethod
}

function moveMethodChildren(symbol: BaseSymbol, diff: number) {
    if (isMethodDefinition(symbol)) {
        updateMethodChildrenOffset(symbol)
        return symbol
    }

    let method = getParentMethodDefinition(symbol) as BaseSymbol
    if (method) {
        updateOffset([symbol], -method.startOffset)
        moveRightChildren(symbol, method, diff)
    }
    return method
}

function moveRightChildren(symbol: BaseSymbol, stopSymbol: BaseSymbol, diff: number) {
    let parent: any | undefined = symbol
    do {
        parent = parent.parent
        if (!parent) {
            break
        }
        const symbols = (parent as CompositeSymbol).getChildrenSymbols().filter(s => s && s.startOffset > symbol.startOffset)
        updateOffset(symbols, diff);
        (parent as BaseSymbol).position.endOffset += diff
    } while (parent != stopSymbol)
}

function updateMethodChildrenOffset(method: MethodDefinition) {
    updateOffset(method.params, -method.position.startOffset)
    updateOffset(method.children, -method.position.startOffset)
}

/**
 * Replaces an existing symbol in the code model with a provided new symbol.
 *
 * If the old symbol has no parent, it is assumed to be a top-level entry in the model and is replaced
 * directly within the model's children. Otherwise, the function locates the existing symbol within its
 * parent's properties or arrays and substitutes it with the new symbol, updating the new symbol's parent
 * reference accordingly.
 *
 * @param model - The code model containing the symbol to replace.
 * @param oldSymbol - The symbol to be replaced.
 * @param newSymbol - The replacement symbol.
 *
 * @returns The parent object in which the replacement occurred, or the new symbol from the top-level
 *          model children if the old symbol had no parent.
 */
function replaceNode(model: BslCodeModel, oldSymbol: BaseSymbol, newSymbol: BaseSymbol | BaseSymbol[]) {
    if (!oldSymbol.parent) { // model children
        const index = model.children.indexOf(oldSymbol)
        replace(model.children, index, newSymbol)

        return Array.isArray(newSymbol) ? newSymbol : [newSymbol]
    } else {
        const parent: any = oldSymbol.parent
        for (const key in parent) {
            const value = parent[key]
            if (value === oldSymbol) {
                if (Array.isArray(newSymbol)) {
                    throw 'Array symbols not supported for ' + key
                }
                parent[key] = newSymbol
                break
            } else if (Array.isArray(value)) {
                const index = value.indexOf(oldSymbol)
                if (index !== -1) {
                    replace(value, index, newSymbol)
                    break
                }
            }
        }
        if (Array.isArray(newSymbol)) {
            newSymbol.forEach(item => item.parent = parent)
        } else {
            newSymbol.parent = parent
        }
        return [parent]
    }
}

function replace(items: BaseSymbol[], position: number, item: any | []) {
    if (Array.isArray(item)) {
        items.splice(position, 1, ...item)
    } else {
        items[position] = item
    }
}

/**
 * Determines whether any of the provided changes fully replaces the entire code model.
 *
 * The function calculates the overall range of the code model using the start offset of its first child
 * and the end offset of its last child. It returns true if any change in the array covers this complete range.
 *
 * @param codeModel - The code model whose complete range is checked.
 * @param changes - An array of content changes, each specifying an offset and length.
 * @returns True if a change replaces the entire code model; otherwise, false.
 */
function isReplace(codeModel: BslCodeModel, changes: IModelContentChange[]) {
    const first = codeModel.children[0].startOffset
    const last = codeModel.children[codeModel.children.length - 1].endOffset
    for (const change of changes) {
        if (change.rangeOffset <= first && change.rangeOffset + change.rangeLength >= last) {
            return true
        }
    }
    return false
}

