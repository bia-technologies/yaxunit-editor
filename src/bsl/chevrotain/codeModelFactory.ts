import { isModel } from "@/monaco/utils"
import { ModuleModel } from "../moduleModel"
import { IModelContentChange, IncrementalBslParser } from "./parser"
import {
    BslCodeModel,
    FunctionDefinitionSymbol,
    isAcceptable,
    isMethodDefinition,
    MethodDefinition,
    ProcedureDefinitionSymbol,
} from "../codeModel"
import { BaseSymbol, CompositeSymbol, SymbolPosition } from "@/common/codeModel"
import { editor, MarkerSeverity } from "monaco-editor-core"
import { AutoDisposable } from "@/common/utils/autodisposable"
import { CodeModelFactoryVisitor } from "./codeModelFactoryVisitor"
import { descendantByRange, getParentMethodDefinition, updateOffset } from "./utils"
import { RuleNameCalculator } from "../codeModel/calculators/ruleNameCalculator"
import { ILexingError, IRecognitionException } from "chevrotain"

export class ChevrotainSitterCodeModelFactory extends AutoDisposable {
    parser = new IncrementalBslParser()
    visitor = new CodeModelFactoryVisitor()
    errors: ErrorInfo[] = []

    buildModel(model: ModuleModel | string): BslCodeModel {
        const codeModel = new BslCodeModel()
        this.reBuildModel(codeModel, model)
        return codeModel
    }

    reBuildModel(codeModel: BslCodeModel, model: ModuleModel | string) {
        const start = performance.now()
        const text = isModel(model) ? model.getValue() : model
        const tree = this.parser.parseModule(text)

        this.errors = handleErrors(tree.lexErrors, tree.parseErrors)

        if (isModel(model)) {
            const markers = convertErrorsToMarkers(this.errors, model);
            editor.setModelMarkers(model, 'chevrotain', markers);
        }
        const visitorStart = performance.now()
        const children = this.visitor.visit(tree.cst)

        codeModel.children.length = 0
        if (Array.isArray(children)) {
            codeModel.children.push(...children)
        } else if (children) {
            codeModel.children.push(children)
        }
        const end = performance.now()
        console.log('Build code model by chevrotain. Parse:', visitorStart - start, 'ms; model build:', end - visitorStart, '; full:', end - start)

        codeModel.children
            .filter(isMethodDefinition)
            .forEach(updateMethodChildrenOffset)

        codeModel.afterUpdate(codeModel)
    }

    updateModel(codeModel: BslCodeModel, changes: IModelContentChange[]): boolean {
        if (!codeModel.children.length || isReplace(codeModel, changes)) {
            return false
        }

        const start = performance.now()
        const ranges = this.parser.updateTokens(changes)

        for (const range of ranges) {
            let symbol: BaseSymbol | undefined = descendantByRange(codeModel, range.start, range.end)
            let rule
            while (symbol && (rule = getSymbolRule(symbol)) === undefined) {
                symbol = symbol?.parent
            }
            if (symbol) {
                const position = getSymbolPosition(symbol)
                const newNode = this.parser.parseChanges(rule as string, position.startOffset, position.endOffset + range.diff)
                const newSymbol = this.visitor.visit(newNode) as BaseSymbol
                if (!newSymbol) {
                    throw 'Не удалось проанализировать новый символ'
                }
                const changedItem = replaceNode(codeModel, symbol, newSymbol)
                if (!changedItem) {
                    throw 'New node not inserted'
                }
                const method = moveMethodChildren(newSymbol, range.diff)
                moveLowerMethods(codeModel, method, range.diff)
                codeModel.afterUpdate(changedItem)
                console.debug('update ', symbol, 'to', newSymbol)
            } else {
                return false
            }
        }
        console.log('Increment update changes', changes, performance.now() - start, 'ms')
        return true
    }
}

function moveLowerMethods(codeModel: BslCodeModel, method: ProcedureDefinitionSymbol | FunctionDefinitionSymbol | undefined, diff: number) {
    if (!method) {
        return
    }
    for (let index = codeModel.children.indexOf(method) + 1; index < codeModel.children.length; index++) {
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

function moveMethodChildren(symbol: BaseSymbol, diff: number) {
    if (isMethodDefinition(symbol)) {
        updateMethodChildrenOffset(symbol)
        return symbol
    }
    let method = getParentMethodDefinition(symbol)
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
function replaceNode(model: BslCodeModel, oldSymbol: BaseSymbol, newSymbol: BaseSymbol) {
    if (!oldSymbol.parent) { // model children
        const index = model.children.indexOf(oldSymbol)
        model.children[index] = newSymbol
        return model.children[index]
    } else {
        const parent: any = oldSymbol.parent
        for (const key in oldSymbol.parent) {
            const value = parent[key]
            if (value === oldSymbol) {
                parent[key] = newSymbol
                newSymbol.parent = parent
                return parent
            } else if (Array.isArray(value)) {
                const index = value.indexOf(oldSymbol)
                if (index !== -1) {
                    value[index] = newSymbol
                    newSymbol.parent = parent
                    return parent
                }
            }
        }
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

function getSymbolRule(symbol: BaseSymbol) {
    return isAcceptable(symbol) ? symbol.accept(RuleNameCalculator.instance) : undefined
}

// Функция для конвертации ошибок Chevrotain в маркеры Monaco
function convertErrorsToMarkers(errors: ErrorInfo[], model: editor.ITextModel): editor.IMarkerData[] {
    return errors.map(error => {
        const startPosition = model.getPositionAt(error.startOffset);
        const endPosition = model.getPositionAt(error.endOffset);
        return {
            severity: MarkerSeverity.Error,
            message: error.message,
            startLineNumber: startPosition.lineNumber,
            startColumn: startPosition.column,
            endLineNumber: endPosition.lineNumber,
            endColumn: endPosition.column,
            source: 'chevrotain'

        }
    })
}

interface ErrorInfo {
    message: string
    startOffset: number
    endOffset: number
}
function handleErrors(lexErrors: ILexingError[], parseErrors: IRecognitionException[]): ErrorInfo[] {
    lexErrors.forEach(e => console.error('lexError', e))
    parseErrors.forEach(e => console.error('parseError', e.token, e))
    return lexErrors.map(error => {
        return {
            message: `Лексическая ошибка: ${error.message || 'Неизвестная ошибка'}`,
            startOffset: error.offset,
            endOffset: error.offset + error.length
        }
    }).concat(parseErrors.map(error => {
        return {
            message: `Синтаксическая ошибка: ${error.message}`,
            startOffset: error.token.startOffset,
            endOffset: (error.token.endOffset ?? error.token.startOffset) + 1
        }
    }))
}

