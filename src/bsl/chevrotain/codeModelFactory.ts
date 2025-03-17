import { isModel } from "@/monaco/utils"
import { ModuleModel } from "../moduleModel"
import { BSLParser } from "./parser"
import {
    BslCodeModel,
    isAcceptable,
    isMethodDefinition,
    MethodDefinition,
} from "../codeModel"
import { BaseSymbol, CompositeSymbol, SymbolPosition } from "@/common/codeModel"
import { editor, MarkerSeverity } from "monaco-editor-core"
import { AutoDisposable } from "@/common/utils/autodisposable"
import { CodeModelFactoryVisitor } from "./codeModelFactoryVisitor"
import { descendantByRange, getParentMethodDefinition, updateOffset } from "./utils"
import { RuleNameCalculator } from "../codeModel/calculators/ruleNameCalculator"

export class ChevrotainSitterCodeModelFactory extends AutoDisposable {
    parser = new BSLParser()
    visitor = new CodeModelFactoryVisitor()

    buildModel(model: ModuleModel | string): BslCodeModel {
        const codeModel = new BslCodeModel()
        this.reBuildModel(codeModel, model)
        return codeModel
    }

    reBuildModel(codeModel: BslCodeModel, model: ModuleModel | string) {
        const start = performance.now()
        const text = isModel(model) ? model.getValue() : model
        const tree = this.parser.parseModule(text)

        tree.lexErrors.forEach(e => console.error('lexError', e))
        tree.parseErrors.forEach(e => console.error('parseError', e.token, e))

        if (isModel(model)) {
            const markers = convertErrorsToMarkers(tree.lexErrors, tree.parseErrors, model);
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

    updateModel(codeModel: BslCodeModel, changes: editor.IModelContentChange[]): boolean {
        if (!codeModel.children.length || isReplace(codeModel, changes)) {
            this.reBuildModel(codeModel, changes[0].text)
            return true
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
                const changedItem = replaceNode(codeModel, symbol, newSymbol)
                moveMethodChildren(newSymbol, range.diff)

                codeModel.afterUpdate(changedItem)
            } else {
                return false
            }
        }
        console.log('Increment update changes', changes, performance.now() - start, 'ms')
        return true
    }
}

function getSymbolPosition(symbol: BaseSymbol): SymbolPosition {
    const method = getParentMethodDefinition(symbol)
    return method ? {
        startOffset: method.startOffset + symbol.startOffset,
        endOffset: method.startOffset + symbol.endOffset
    } : symbol.position
}

function moveMethodChildren(symbol: BaseSymbol, diff: number) {
    if (isMethodDefinition(symbol)) {
        updateMethodChildrenOffset(symbol)
        return
    }
    let method = getParentMethodDefinition(symbol)
    if (method) {
        updateOffset([symbol], -method.startOffset)
        moveRightChildren(symbol, method, diff)
    }
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

function replaceNode(model: BslCodeModel, oldSymbol: BaseSymbol, newSymbol: BaseSymbol) {
    if (!oldSymbol.parent) { // model children
        const index = model.children.indexOf(oldSymbol)
        model.children[index] = newSymbol
        return model.children[index]
    } else {
        const parent: any = oldSymbol.parent
        for (const key in oldSymbol.parent) {
            if (parent[key] === oldSymbol) {
                parent[key] = newSymbol
                newSymbol.parent = parent
                break
            }
        }

        return parent
    }
}

function isReplace(codeModel: BslCodeModel, changes: editor.IModelContentChange[]) {
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
function convertErrorsToMarkers(lexErrors: any[], parseErrors: any[], model: editor.ITextModel): editor.IMarkerData[] {
    const markers: editor.IMarkerData[] = [];

    // Обработка лексических ошибок
    for (const error of lexErrors) {
        const startPosition = model.getPositionAt(error.offset);
        const endPosition = model.getPositionAt(error.offset + (error.length || 1));

        markers.push({
            severity: MarkerSeverity.Error,
            message: `Лексическая ошибка: ${error.message || 'Неизвестная ошибка'}`,
            startLineNumber: startPosition.lineNumber,
            startColumn: startPosition.column,
            endLineNumber: endPosition.lineNumber,
            endColumn: endPosition.column,
            source: 'chevrotain-lexer'
        });
    }

    // Обработка синтаксических ошибок
    for (const error of parseErrors) {
        const token = error.token;
        const startPosition = model.getPositionAt(token.startOffset);
        const endPosition = model.getPositionAt((token.endOffset || token.startOffset) + 1);

        markers.push({
            severity: MarkerSeverity.Error,
            message: `Синтаксическая ошибка: ${error.message}`,
            startLineNumber: startPosition.lineNumber,
            startColumn: startPosition.column,
            endLineNumber: endPosition.lineNumber,
            endColumn: endPosition.column,
            source: 'chevrotain-parser'
        });
    }

    return markers;
}
