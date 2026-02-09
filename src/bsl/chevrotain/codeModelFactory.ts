import { isModel } from "@/monaco/utils"
import { ModuleModel } from "../moduleModel"
import { IModelContentChange, IncrementalBslParser } from "./parser"
import {
    BslCodeModel,
    isMethodDefinition,
} from "../codeModel"
import { BaseSymbol} from "@/common/codeModel"
import { editor, MarkerSeverity } from 'monaco-editor-core'
import { AutoDisposable } from "@/common/utils/autodisposable"
import { CodeModelFactoryVisitor } from "./codeModelFactoryVisitor"
import { descendantByRange, getParentMethodDefinition } from "../codeModel/utils"
import { RuleNameCalculator } from "../codeModel/calculators/ruleNameCalculator"
import { CstNode, ILexingError, IRecognitionException } from "chevrotain"
import updateUtils from "../codeModel/utils/updateUtils"

enum EditType {
    replace,
    delete,
    append
}

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
        console.log('------------------------Build code model by chevrotain. Parse:', visitorStart - start, 'ms; model build:', end - visitorStart, '; full:', end - start)

        codeModel.children
            .filter(isMethodDefinition)
            .forEach(updateUtils.updateMethodChildrenOffset)

        codeModel.afterUpdate(codeModel)
    }

    updateModel(codeModel: BslCodeModel, changes: IModelContentChange[]): boolean {
        if (!codeModel.children.length || updateUtils.isReplace(codeModel, changes)) {
            console.debug('Model empty or text replaced -> rebuild')
            return false
        }

        const start = performance.now()
        const ranges = this.parser.updateTokens(changes)

        let success = true

        for (const range of ranges) {
            let rangeSymbol: BaseSymbol | undefined = descendantByRange(codeModel, range.start, range.end)
            if (!rangeSymbol) {
                console.error('Don\'t find edited symbol -> rebuild')
                return false
            }
            rangeSymbol = getParentMethodDefinition(rangeSymbol) ?? rangeSymbol

            let { symbol, newSymbol, editType } = this.parseChange(rangeSymbol, range.diff)

            switch (editType) {
                case EditType.replace:
                    success = updateUtils.replaceSymbol(codeModel, symbol, newSymbol, range.diff)
                    break
                case EditType.delete:
                    success = updateUtils.removeSymbol(codeModel, symbol, range.diff)
                    break
                case EditType.append:
                    updateUtils.appendSymbol()
                    break
            }
            if (!success) {
                break
            }
        }
        if (success) {
            console.log('Increment update changes', changes, performance.now() - start, 'ms')
        } else {
            console.error('Changes parsing error -> rebuild')
        }
        return success
    }

    private parseChange(baseSymbol: BaseSymbol | undefined, diff: number): {
        symbol: BaseSymbol | undefined, newSymbol: BaseSymbol | BaseSymbol[] | undefined, editType: EditType
    } {
        let { rule, symbol } = RuleNameCalculator.getAvailableSymbol(baseSymbol)

        let firstParse = true
        while (symbol) {
            const position = updateUtils.getSymbolPosition(symbol)
            if (position.startOffset === position.endOffset + diff) {
                return {
                    symbol,
                    newSymbol: undefined,
                    editType: EditType.delete
                }
            }
            const { cst: newNode, parseErrors } = this.parser.parseChanges(rule as string, position.startOffset, position.endOffset + diff)

            if (parseErrors.length && firstParse) {
                firstParse = false;
                if (symbol.parent) {
                    symbol = symbol.parent;
                    ({ rule, symbol } = RuleNameCalculator.getAvailableSymbol(baseSymbol));
                } else {
                    rule = 'module'
                }
                continue
            }

            if (!newNode) {
                throw new Error(`Не удалось разобрать новый символ по правилу ${rule}\nInput: ${this.parser.input}`)
            }
            const newSymbol = this.createSymbol(newNode)
            if (!newSymbol) {
                throw new Error(`Не удалось проанализировать новый символ ${newNode.name?? '<unknown>'}\nInput: ${this.parser.input}`)
            }
            return { symbol, newSymbol, editType: EditType.replace }
        }
        return { symbol, newSymbol: undefined, editType: EditType.replace }
    }

    createSymbol(node: CstNode) {
        const newSymbol = this.visitor.visit(node) as BaseSymbol
        return newSymbol
    }
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
