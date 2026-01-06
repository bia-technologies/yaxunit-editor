import { BaseSymbol } from "@/common/codeModel"
import { BslCodeModel } from "../codeModel"
import { moveMethodChildren, moveMethodsChildren, moveModelItems } from "./offsetManager"

/**
 * Заменяет символ в модели кода
 */
export function replaceSymbol(
    codeModel: BslCodeModel,
    symbol: BaseSymbol | undefined,
    newSymbol: BaseSymbol | BaseSymbol[] | undefined,
    diff: number
): boolean {
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
    let rootItem = Array.isArray(newSymbol)
        ? moveMethodsChildren(newSymbol, diff)
        : moveMethodChildren(newSymbol, diff)
    if (!rootItem) {
        rootItem = rootSymbol(newSymbol)
    }
    moveModelItems(codeModel, rootItem, diff)
    codeModel.afterUpdate(changedItem)
    console.debug('update ', symbol, 'to', newSymbol)

    return true
}

/**
 * Удаляет символ из модели кода
 */
export function removeSymbol(
    codeModel: BslCodeModel,
    symbol: BaseSymbol | undefined,
    diff: number
): boolean {
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

/**
 * Добавляет новый символ в модель
 */
export function appendSymbol(): void {
    throw 'Not implementation'
}

/**
 * Находит корневой символ (символ без родителя)
 */
export function rootSymbol(newSymbol: BaseSymbol | BaseSymbol[]): BaseSymbol {
    let rootItem = Array.isArray(newSymbol) ? newSymbol[newSymbol.length - 1] : newSymbol
    while (rootItem.parent) {
        rootItem = rootItem.parent
    }

    return rootItem
}

/**
 * Удаляет узел из модели кода
 */
function removeNode(codeModel: BslCodeModel, oldSymbol: BaseSymbol): boolean {
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
function replaceNode(
    model: BslCodeModel,
    oldSymbol: BaseSymbol,
    newSymbol: BaseSymbol | BaseSymbol[]
): BaseSymbol[] | undefined {
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

/**
 * Заменяет элемент в массиве на новый элемент или массив элементов
 */
function replace(items: BaseSymbol[], position: number, item: BaseSymbol | BaseSymbol[]): void {
    if (Array.isArray(item)) {
        items.splice(position, 1, ...item)
    } else {
        items[position] = item
    }
}
