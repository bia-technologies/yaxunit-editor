import { BaseSymbol, CompositeSymbol } from "@/common/codeModel"
import { BslCodeModel, isMethodDefinition, MethodDefinition } from "../codeModel"
import { getParentMethodDefinition, updateOffset } from "./utils"

/**
 * Сдвигает оффсеты элементов метода после редактирования
 */
export function shiftMethodOffsetsAfterEdit(
    method: MethodDefinition,
    editStartOffset: number,
    diff: number
): void {
    if (diff === 0) {
        return
    }

    // Дети методов хранятся с относительными оффсетами (от начала метода).
    const relEditStart = editStartOffset - method.startOffset

    // Обновляем границы самого метода
    method.position.endOffset += diff

    // Сдвигаем все элементы метода, которые начинаются строго после точки правки.
    // (При необходимости это место можно усложнить до "пересекается с правкой",
    // но для восстановления инкрементальности при временно-невалидном коде достаточно этого.)
    for (const child of method.children) {
        if (!child) continue
        if (child.position.startOffset > relEditStart) {
            updateOffset([child], diff)
        }
    }
}

/**
 * Перемещает элементы модели после указанного метода
 */
export function moveModelItems(
    codeModel: BslCodeModel,
    method: BaseSymbol | number | undefined,
    diff: number
): void {
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

/**
 * Перемещает дочерние элементы массива методов
 */
export function moveMethodsChildren(symbols: BaseSymbol[], diff: number): MethodDefinition | undefined {
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

/**
 * Перемещает дочерние элементы метода
 */
export function moveMethodChildren(symbol: BaseSymbol, diff: number): BaseSymbol | undefined {
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

/**
 * Перемещает правые дочерние элементы до указанного символа
 */
export function moveRightChildren(symbol: BaseSymbol, stopSymbol: BaseSymbol, diff: number): void {
    let parent: any | undefined = symbol
    do {
        parent = parent.parent
        if (!parent) {
            break
        }
        const symbols = (parent as CompositeSymbol)
            .getChildrenSymbols()
            .filter(s => s && s.startOffset > symbol.startOffset)
        updateOffset(symbols, diff);
        (parent as BaseSymbol).position.endOffset += diff
    } while (parent != stopSymbol)
}

/**
 * Обновляет оффсеты дочерних элементов метода относительно начала метода
 */
export function updateMethodChildrenOffset(method: MethodDefinition): void {
    updateOffset(method.params, -method.position.startOffset)
    updateOffset(method.children, -method.position.startOffset)
}
