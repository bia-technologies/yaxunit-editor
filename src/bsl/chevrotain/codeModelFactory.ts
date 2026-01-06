import { isModel } from "@/monaco/utils"
import { ModuleModel } from "../moduleModel"
import { IModelContentChange, IncrementalBslParser } from "./parser"
import { BslCodeModel, isMethodDefinition } from "../codeModel"
import { BaseSymbol, SymbolPosition } from "@/common/codeModel"
import { AutoDisposable } from "@/common/utils/autodisposable"
import { CodeModelFactoryVisitor } from "./codeModelFactoryVisitor"
import { descendantByRange, getParentMethodDefinition, findContainingMethod } from "./utils"
import { RuleNameCalculator } from "../codeModel/calculators/ruleNameCalculator"
import { CstNode, ILexingError, IRecognitionException } from "chevrotain"
import { ErrorCollector } from "@/bsl/diagnostics"
import { MarkersManager } from "@/bsl/editor/diagnostics"
import { editor } from 'monaco-editor-core'
import { EditType } from "./editTypes"
import { replaceSymbol, removeSymbol, appendSymbol } from "./symbolOperations"
import { shiftMethodOffsetsAfterEdit, moveModelItems, updateMethodChildrenOffset } from "./offsetManager"

export class ChevrotainCodeModelFactory extends AutoDisposable {
    parser = new IncrementalBslParser()
    visitor = new CodeModelFactoryVisitor()
    private errorCollector = new ErrorCollector()
    private markersManager?: MarkersManager

    buildModel(model: ModuleModel | string): BslCodeModel {
        const codeModel = new BslCodeModel()
        // Запускаем асинхронную перестройку, но не ждем завершения
        // чтобы не менять сигнатуру buildModel
        this.reBuildModel(codeModel, model)
        return codeModel
    }

    async reBuildModel(codeModel: BslCodeModel, model: ModuleModel | string) {
        const start = performance.now()
        const text = isModel(model) ? model.getValue() : model
        const tree = this.parser.parseModule(text)

        // Инициализация MarkersManager для Monaco модели
        if (isModel(model) && !this.markersManager) {
            this.markersManager = new MarkersManager(model)
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
            .forEach(updateMethodChildrenOffset)

        codeModel.afterUpdate(codeModel)
        
        // Обновляем маркеры после построения модели
        if (isModel(model)) {
            this.updateMarkers(codeModel, tree.lexErrors, tree.parseErrors, tree.cst)
        }
    }

    async updateModel(codeModel: BslCodeModel, changes: IModelContentChange[]): Promise<boolean> {
        if (!codeModel.children.length || isReplace(codeModel, changes)) {
            console.warn('Model empty or text replaced -> rebuild')
            return false
        }

        const start = performance.now()
        const ranges = this.parser.updateTokens(changes)

        let success = true

        for (const range of ranges) {
            // В промежуточных состояниях (например, при посимвольном расскомментировании)
            // возможно появление лексических ошибок. В этом случае не пытаемся перестраивать
            // часть модели (это часто приводит к рассинхронизации), а только сдвигаем оффсеты,
            // чтобы последующие правки могли примениться инкрементально.
            if (range.errors && range.errors.length > 0) {
                const method = findContainingMethod(codeModel, range.start, range.end)
                if (method && isMethodDefinition(method)) {
                    shiftMethodOffsetsAfterEdit(method, range.start, range.diff)
                    moveModelItems(codeModel, method, range.diff)
                    codeModel.afterUpdate(codeModel)
                }
                continue
            }

            let rangeSymbol: BaseSymbol | undefined = descendantByRange(codeModel, range.start, range.end)
            if (!rangeSymbol) {
                // Если точный символ не найден (например, при расскомментировании),
                // пытаемся найти ближайший метод, который содержит этот диапазон
                rangeSymbol = findContainingMethod(codeModel, range.start, range.end)
                if (!rangeSymbol) {
                    codeModel.afterUpdate(codeModel)
                    console.warn('Dont find edited symbol -> full reparse')
                    // this.reparseWholeModule(codeModel)
                    return true
                }
            } else {
                rangeSymbol = getParentMethodDefinition(rangeSymbol) ?? rangeSymbol
            }

            let { symbol, newSymbol, editType } = this.parseChange(rangeSymbol, range.diff)

            switch (editType) {
                case EditType.replace:
                    success = replaceSymbol(codeModel, symbol, newSymbol, range.diff)
                    break
                case EditType.delete:
                    success = removeSymbol(codeModel, symbol, range.diff)
                    break
                case EditType.append:
                    appendSymbol()
                    break
            }
            if (!success) {
                break
            }
        }
        if (success) {
            console.log('Increment update changes', changes, performance.now() - start, 'ms')
            
            // Обновляем маркеры после успешного инкрементального обновления
            // Для инкрементального обновления нужно перепарсить весь модуль
            // чтобы получить актуальный CST и все ошибки
            if (this.markersManager) {
                await this.updateMarkersAfterIncremental(codeModel)
            }
        } else {
            console.warn('Changes parsing error -> rebuild')
        }
        return success
    }


    private parseChange(baseSymbol: BaseSymbol | undefined, diff: number): {
        symbol: BaseSymbol | undefined, newSymbol: BaseSymbol | BaseSymbol[] | undefined, editType: EditType
    } {
        let { rule, symbol } = RuleNameCalculator.getAvailableSymbol(baseSymbol)

        let firstParse = true
        while (symbol) {
            const position = getSymbolPosition(symbol)
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

    /**
     * Обновляет маркеры Monaco, объединяя ошибки парсера и модели
     */
    private updateMarkers(
        codeModel: BslCodeModel,
        lexErrors: ILexingError[],
        parseErrors: IRecognitionException[],
        cst?: CstNode
    ): void {
        if (!this.markersManager) {
            return
        }

        // Собираем ошибки парсера/лексера
        const parserDiagnostics = this.errorCollector.combineErrors(
            this.errorCollector.collectLexerErrors(lexErrors),
            this.errorCollector.collectParserErrors(parseErrors)
        )

        // Собираем ошибки из garbageToken, если CST предоставлен
        const garbageDiagnostics = cst 
            ? this.errorCollector.collectGarbageTokenErrors(cst)
            : []

        // Объединяем с ошибками модели
        const allDiagnostics = this.errorCollector.combineErrors(
            parserDiagnostics,
            garbageDiagnostics,
            codeModel.diagnostics
        )

        // Устанавливаем маркеры
        this.markersManager.updateMarkers(allDiagnostics)
    }

    /**
     * Обновляет маркеры после инкрементального обновления.
     * Перепарсивает весь модуль для получения актуальных ошибок и CST.
     */
    private async updateMarkersAfterIncremental(codeModel: BslCodeModel): Promise<void> {
        if (!this.markersManager) {
            return
        }

        // Получаем текст из модели
        const model = (this.markersManager as any).model as editor.ITextModel
        const text = model.getValue()

        // Перепарсиваем весь модуль для получения актуального CST и ошибок
        const parseResult = this.parser.parseModule(text)

        // Обновляем маркеры с актуальными данными
        this.updateMarkers(
            codeModel,
            parseResult.lexErrors,
            parseResult.parseErrors,
            parseResult.cst
        )
    }
}


/**
 * Получает абсолютную позицию символа в тексте модуля
 */
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