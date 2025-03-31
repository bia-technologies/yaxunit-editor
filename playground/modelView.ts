import './style.css'
import {
    AssignmentStatementSymbol,
    BinaryExpressionSymbol,
    BslCodeModel,
    ConstSymbol,
    ConstructorSymbol,
    FunctionDefinitionSymbol,
    IndexAccessSymbol,
    MethodCallSymbol,
    ModuleVariableDefinitionSymbol,
    ParameterDefinitionSymbol,
    ProcedureDefinitionSymbol,
    AccessSequenceSymbol,
    PropertySymbol,
    ReturnStatementSymbol,
    TernaryExpressionSymbol,
    VariableSymbol,
    UnaryExpressionSymbol,
    PreprocessorSymbol,
    ElseBranchSymbol,
    IfBranchSymbol,
    IfStatementSymbol,
    WhileStatementSymbol,
    ForStatementSymbol,
    ForEachStatementSymbol,
    GotoStatementSymbol,
    LabelStatementSymbol,
    AddHandlerStatementSymbol,
    RemoveHandlerStatementSymbol,
    ExecuteStatementSymbol,
    TryStatementSymbol,
    RiseErrorStatementSymbol,
    VariableDefinitionSymbol,
    CodeModelVisitor,
    isAcceptable,
    Acceptable
} from "../src/bsl/codeModel";
import { BaseSymbol } from "../src/common/codeModel";

export class ModelView {
    domId: string
    selector: (symbol: BaseSymbol) => void = () => { }

    constructor(domId: string) {
        this.domId = domId
    }
    render(model: BslCodeModel) {
        const treeContainer = document.getElementById(this.domId);
        if (!treeContainer) {
            return
        }
        treeContainer.innerHTML = "";
        selector = this.selector
        visitor.visitModel(model).forEach((div: any) => treeContainer.appendChild(div))
    }
}

let selector: (symbol: BaseSymbol) => void
const visitor: CodeModelVisitor = {

    visitModel(model: BslCodeModel): HTMLElement[] {
        return acceptItems(model.getChildrenSymbols(), visitor) as HTMLElement[]
    },

    // definitions
    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol) {
        return compositeSymbolContainer(symbol, 'Procedure', symbol.name, symbol.getChildrenSymbols())
    },
    visitFunctionDefinition(symbol: FunctionDefinitionSymbol) {
        return compositeSymbolContainer(symbol, 'Function', symbol.name, symbol.getChildrenSymbols())
    },
    visitParameterDefinition(symbol: ParameterDefinitionSymbol) {
        return baseSymbolContainer(symbol, 'Parameter', `${symbol.name}; byVal: ${symbol.byVal}` + (symbol.default ? `; default: ${symbol.default} (${symbol.defaultValue?.type});` : ''))
    },
    visitModuleVariableDefinition(symbol: ModuleVariableDefinitionSymbol) {
        return baseSymbolContainer(symbol, 'ModuleVariable', symbol.name)
    },

    // #region statements
    visitVariableDefinition(symbol: VariableDefinitionSymbol) {
        return compositeSymbolContainer(symbol, 'VariableDefinition', undefined, symbol.getChildrenSymbols())
    },
    visitAssignmentStatement(symbol: AssignmentStatementSymbol) {
        return compositeSymbolContainer(symbol, 'Assignment', undefined, symbol.getChildrenSymbols())
    },
    visitReturnStatement(symbol: ReturnStatementSymbol) {
        return compositeSymbolContainer(symbol, 'Return', undefined, symbol.getChildrenSymbols())
    },

    visitExecuteStatement(symbol: ExecuteStatementSymbol) {
        return compositeSymbolContainer(symbol, 'Execute', undefined, symbol.getChildrenSymbols())
    },
    visitTryStatement(symbol: TryStatementSymbol) {
        return compositeSymbolContainer(symbol, 'Try', undefined, symbol.getChildrenSymbols())
    },
    visitRiseErrorStatement(symbol: RiseErrorStatementSymbol) {
        return compositeSymbolContainer(symbol, 'RiseError', undefined, symbol.getChildrenSymbols())
    },

    visitIfStatement(symbol: IfStatementSymbol) {
        return compositeSymbolContainer(symbol, 'If', undefined, symbol.getChildrenSymbols())
    },
    visitIfBranch(symbol: IfBranchSymbol) {
        return compositeSymbolContainer(symbol, 'If branch', undefined, symbol.getChildrenSymbols())
    },
    visitElseBranch(symbol: ElseBranchSymbol) {
        return compositeSymbolContainer(symbol, 'Else branch', undefined, symbol.getChildrenSymbols())
    },

    visitWhileStatement(symbol: WhileStatementSymbol) {
        return compositeSymbolContainer(symbol, 'While', undefined, symbol.getChildrenSymbols())
    },
    visitForStatement(symbol: ForStatementSymbol) {
        return compositeSymbolContainer(symbol, 'For', undefined, symbol.getChildrenSymbols())
    },
    visitForEachStatement(symbol: ForEachStatementSymbol) {
        return compositeSymbolContainer(symbol, 'ForEach', undefined, symbol.getChildrenSymbols())
    },

    visitContinueStatement(symbol) {
        return baseSymbolContainer(symbol, 'Continue')
    },
    visitBreakStatement(symbol) {
        return baseSymbolContainer(symbol, 'Break')
    },

    visitGotoStatement(symbol: GotoStatementSymbol) {
        return baseSymbolContainer(symbol, 'Goto', symbol.label)
    },
    visitLabelStatement(symbol: LabelStatementSymbol) {
        return baseSymbolContainer(symbol, 'Label', symbol.label)
    },

    visitAddHandlerStatement(symbol: AddHandlerStatementSymbol) {
        return compositeSymbolContainer(symbol, 'AddHandler', undefined, symbol.getChildrenSymbols())
    },
    visitRemoveHandlerStatement(symbol: RemoveHandlerStatementSymbol) {
        return compositeSymbolContainer(symbol, 'RemoveHandler', undefined, symbol.getChildrenSymbols())
    },
    // #endregion

    // base
    visitVariableSymbol(symbol: VariableSymbol) {
        return baseSymbolContainer(symbol, 'Variable', symbol.name)
    },
    visitPropertySymbol(symbol: PropertySymbol) {
        return baseSymbolContainer(symbol, 'Property', symbol.name)
    },
    visitIndexAccessSymbol(symbol: IndexAccessSymbol) {
        return baseSymbolContainer(symbol, 'Index', `${symbol.index}`)
    },
    visitMethodCallSymbol(symbol: MethodCallSymbol) {
        return compositeSymbolContainer(symbol, 'MethodCall', symbol.name, symbol.arguments ?? [])
    },
    visitAccessSequenceSymbol(symbol: AccessSequenceSymbol) {
        return compositeSymbolContainer(symbol, 'AccessSequence', undefined, symbol.getChildrenSymbols())
    },

    // expression
    visitUnaryExpressionSymbol(symbol: UnaryExpressionSymbol) {
        return compositeSymbolContainer(symbol, 'UnaryExpression', undefined, symbol.getChildrenSymbols())
    },
    visitBinaryExpressionSymbol(symbol: BinaryExpressionSymbol) {
        return compositeSymbolContainer(symbol, 'BinaryExpression', undefined, symbol.getChildrenSymbols())
    },
    visitTernaryExpressionSymbol(symbol: TernaryExpressionSymbol) {
        return compositeSymbolContainer(symbol, 'TernaryExpression', undefined, symbol.getChildrenSymbols())
    },
    visitConstructorSymbol(symbol: ConstructorSymbol) {
        return compositeSymbolContainer(symbol, 'Constructor', symbol.name.toString(), symbol.getChildrenSymbols())
    },
    visitConstSymbol(symbol: ConstSymbol) {
        return baseSymbolContainer(symbol, 'Const', `${symbol.value} (${symbol.type})`)
    },

    // preprocessor
    visitPreprocessorSymbol(symbol: PreprocessorSymbol) {
        return baseSymbolContainer(symbol, 'Preprocessor', symbol.name)
    },

}

function baseSymbolContainer(symbol: BaseSymbol, type: string, value?: string) {
    const div = document.createElement('div')
    div.className = 'node'
    const typeSpan = document.createElement('span')
    typeSpan.className = 'token'
    typeSpan.textContent = `${type}: ${value}`
    div.appendChild(typeSpan);

    if (selector && symbol) {
        typeSpan.addEventListener('click', () => {
            selector(symbol)
        })
    }
    return div
}

function errorContainer(type: string, value?: string) {
    const div = document.createElement('div')
    div.className = 'node'
    const typeSpan = document.createElement('span')
    typeSpan.className = 'error'
    typeSpan.textContent = `${type}: ${value ?? ''}`
    div.appendChild(typeSpan);

    return div
}

function compositeSymbolContainer(symbol: BaseSymbol, type: string, value?: string, symbols?: (BaseSymbol | undefined)[]) {
    const div = document.createElement('div')
    div.className = 'node'
    const typeSpan = document.createElement('span')
    typeSpan.className = 'type'
    typeSpan.textContent = `${type}: ${value ?? ''}`
    div.appendChild(typeSpan);
    if (symbols) {
        const elements = acceptItems(symbols, visitor)
        if (elements) {
            elements.forEach(e => { if (e) div.appendChild(e) })
        }
    }
    if (selector && symbol) {
        typeSpan.addEventListener('click', () => {
            selector(symbol)
        })
    }
    return div
}

function acceptItems(items: (BaseSymbol | undefined)[] | undefined, visitor: CodeModelVisitor) {
    if (!items) return []

    return items
        .map((item: any) => {
            if (!item) {
                return errorContainer('undefined node')
            } else if (isAcceptable(item)) {
                return (<Acceptable>item).accept(visitor)
            } else {
                return errorContainer('unsupported', typeof (item))
            }
        })
}