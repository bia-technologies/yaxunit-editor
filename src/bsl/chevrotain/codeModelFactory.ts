import { isModel } from "@/monaco/utils"
import { ModuleModel } from "../moduleModel"
import { BSLParser } from "./parser"
import { AccessSequenceSymbol, BinaryExpressionSymbol, BslCodeModel, ConstructorSymbol, ConstSymbol, FunctionDefinitionSymbol, MethodCallSymbol, ParameterDefinitionSymbol, ProcedureDefinitionSymbol, TernaryExpressionSymbol, VariableDefinitionSymbol } from "../codeModel"
import { BaseSymbol, isCompositeSymbol } from "@/common/codeModel"
import { editor, MarkerSeverity } from "monaco-editor-core"
import { AutoDisposable } from "@/common/utils/autodisposable"
import { CodeModelFactoryVisitor } from "./codeModelFactoryVisitor"

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

        codeModel.afterUpdate(codeModel)
    }

    updateModel(codeModel: BslCodeModel, changes: editor.IModelContentChange[]): boolean {
        const start = performance.now()
        if (!codeModel.children.length || isReplace(codeModel, changes)) {
            this.reBuildModel(codeModel, changes[0].text)
            return true
        }

        const ranges = this.parser.updateTokens(changes)

        for (const range of ranges) {
            let node: BaseSymbol | undefined = findNode(codeModel.children, range.start, range.end)
            console.log(node, range)
            let rule
            while (node && (rule = getSymbolRule(node)) === undefined) {
                node = node?.parent
            }
            if (node) {
                const newNode = this.parser.parseChanges(rule as string, node.startOffset, node.endOffset + range.diff)
                if (!node.parent) {
                    const index = codeModel.children.indexOf(node)
                    codeModel.children[index] = this.visitor.visit(newNode) as BaseSymbol
                    codeModel.afterUpdate(codeModel.children[index])
                }
            } else {
                return false
            }
        }
        console.log('Increment update changes', changes, performance.now() - start, 'ms')
        return true
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
    if (symbol instanceof MethodCallSymbol) {
        return symbol.parent instanceof AccessSequenceSymbol ? undefined : 'methodCall'
    } else if (symbol instanceof AccessSequenceSymbol) {
        return 'qualifiedName'
    } else if (symbol instanceof ParameterDefinitionSymbol) {
        return 'parameter'
    } else if (symbol instanceof ProcedureDefinitionSymbol) {
        return 'procedure'
    } else if (symbol instanceof FunctionDefinitionSymbol) {
        return 'function'
    } else if (symbol instanceof VariableDefinitionSymbol) {
        return 'varStatement'
    } else if (symbol instanceof BinaryExpressionSymbol) {
        return symbol.parent instanceof BinaryExpressionSymbol ? undefined : 'expression'
    } else if (symbol instanceof TernaryExpressionSymbol) {
        return 'ternaryExpression'
    } else if (symbol instanceof ConstructorSymbol) {
        return 'constructorExpression'
    } else if (symbol instanceof ConstSymbol) {
        return 'literal'
    }
}
function findNode(nodes: (BaseSymbol | undefined)[], start: number, end: number): BaseSymbol | undefined {
    for (const node of nodes) {
        if (node && node.position.startOffset <= start && node.position.endOffset >= end) {
            const sub = isCompositeSymbol(node) ? findNode(node.getChildrenSymbols(), start, end) : undefined
            if (sub) {
                return sub
            } else {
                return node
            }
        }
    }
    return undefined
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
