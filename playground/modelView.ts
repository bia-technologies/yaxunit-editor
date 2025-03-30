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
    ContinueStatementSymbol,
    BreakStatementSymbol,
    GotoStatementSymbol,
    LabelStatementSymbol,
    AddHandlerStatementSymbol,
    RemoveHandlerStatementSymbol,
    ExecuteStatementSymbol,
    TryStatementSymbol,
    RiseErrorStatementSymbol,
    VariableDefinitionSymbol,
    acceptItems,
    CodeModelVisitor
} from "../src/bsl/codeModel";
import { BaseSymbol, isCompositeSymbol } from "../src/common/codeModel";

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
        visitor.visitModel(model).forEach(div => treeContainer.appendChild(div))
    }
    cstToHtml(symbols: (BaseSymbol | undefined)[], parent: HTMLElement, level = 0) {
        const selector = this.selector
        for (const symbol of symbols) {
            const div = document.createElement('div');
            div.className = 'node';

            parent.appendChild(div)
            let typeSpan
            if (symbol && isCompositeSymbol(symbol)) { // Нетерминал
                typeSpan = document.createElement('span');
                typeSpan.className = 'type';
                typeSpan.textContent = `${symbol.constructor.name}: ${symbol}`;
                div.appendChild(typeSpan);

                this.cstToHtml(symbol.getChildrenSymbols(), div, level + 1)

            } else if (symbol) { // Токен
                typeSpan = document.createElement('span');
                typeSpan.className = 'token';
                typeSpan.textContent = `${symbol.constructor.name}: ${symbol}`;
                div.appendChild(typeSpan);
            } else {
                typeSpan = document.createElement('span');
                typeSpan.className = 'error';
                typeSpan.textContent = `${symbol}`;
                div.appendChild(typeSpan);
            }

        }
    }
}

let selector: (symbol: BaseSymbol) => void
const visitor: CodeModelVisitor = {

    visitModel(model: BslCodeModel): HTMLElement[] {
        return acceptItems(model.getChildrenSymbols(), visitor) as HTMLElement[]
    },

    // definitions
    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol) {
        return compositeSymbolContainer(symbol, 'ProcedureDefinitionSymbol', symbol.name, symbol.getChildrenSymbols())
    },
    visitFunctionDefinition(symbol: FunctionDefinitionSymbol) {
        return compositeSymbolContainer(symbol, 'ProcedureDefinitionSymbol', symbol.name, symbol.getChildrenSymbols())
    },
    visitParameterDefinition(symbol: ParameterDefinitionSymbol) {
        return baseSymbolContainer(symbol, 'ParameterDefinitionSymbol', `${symbol.name}; byVal: ${symbol.byVal}; default: ${symbol.default};`)
    },
    visitModuleVariableDefinition(symbol: ModuleVariableDefinitionSymbol) {
        return baseSymbolContainer(symbol, 'ModuleVariableDefinitionSymbol', symbol.name)
    },

    // #region statements
    visitVariableDefinition(symbol: VariableDefinitionSymbol) {
        return compositeSymbolContainer(symbol, 'VariableDefinitionSymbol', undefined, symbol.getChildrenSymbols())
    },
    visitAssignmentStatement(symbol: AssignmentStatementSymbol) {
        return compositeSymbolContainer(symbol, 'AssignmentStatementSymbol', undefined, symbol.getChildrenSymbols())
    },
    visitReturnStatement(symbol: ReturnStatementSymbol) {
        return compositeSymbolContainer(symbol, 'ReturnStatementSymbol', undefined, symbol.getChildrenSymbols())
    },

    visitExecuteStatement(symbol: ExecuteStatementSymbol) {
        return compositeSymbolContainer(symbol, 'ExecuteStatementSymbol', undefined, symbol.getChildrenSymbols())
    },
    visitTryStatement(symbol: TryStatementSymbol) {
        return compositeSymbolContainer(symbol, 'TryStatementSymbol', undefined, symbol.getChildrenSymbols())
    },
    visitRiseErrorStatement(symbol: RiseErrorStatementSymbol) {
        return compositeSymbolContainer(symbol, 'RiseErrorStatementSymbol', undefined, symbol.getChildrenSymbols())
    },

    visitIfStatement(symbol: IfStatementSymbol) {
        return compositeSymbolContainer(symbol, 'IfStatementSymbol', undefined, symbol.getChildrenSymbols())
    },
    visitIfBranch(symbol: IfBranchSymbol) {
        return compositeSymbolContainer(symbol, 'IfBranchSymbol', undefined, symbol.getChildrenSymbols())
    },
    visitElseBranch(symbol: ElseBranchSymbol) {
        return compositeSymbolContainer(symbol, 'ElseBranchSymbol', undefined, symbol.getChildrenSymbols())
    },

    visitWhileStatement(symbol: WhileStatementSymbol) {
        return compositeSymbolContainer(symbol, 'WhileStatementSymbol', undefined, symbol.getChildrenSymbols())
    },
    visitForStatement(symbol: ForStatementSymbol) {
        return compositeSymbolContainer(symbol, 'ForStatementSymbol', undefined, symbol.getChildrenSymbols())
    },
    visitForEachStatement(symbol: ForEachStatementSymbol) {
        return compositeSymbolContainer(symbol, 'ForEachStatementSymbol', undefined, symbol.getChildrenSymbols())
    },

    visitContinueStatement() {
        return baseSymbolContainer(symbol, 'ContinueStatementSymbol')
    },
    visitBreakStatement() {
        return baseSymbolContainer(symbol, 'BreakStatementSymbol')
    },

    visitGotoStatement(symbol: GotoStatementSymbol) {
        return baseSymbolContainer(symbol, 'GotoStatementSymbol', symbol.label)
    },
    visitLabelStatement(symbol: LabelStatementSymbol) {
        return baseSymbolContainer(symbol, 'LabelStatementSymbol', symbol.label)
    },

    visitAddHandlerStatement(symbol: AddHandlerStatementSymbol) {
        return compositeSymbolContainer(symbol, 'AddHandlerStatementSymbol', undefined, symbol.getChildrenSymbols())
    },
    visitRemoveHandlerStatement(symbol: RemoveHandlerStatementSymbol) {
        return compositeSymbolContainer(symbol, 'RemoveHandlerStatementSymbol', undefined, symbol.getChildrenSymbols())
    },
    // #endregion

    // base
    visitVariableSymbol(symbol: VariableSymbol) {
        return baseSymbolContainer(symbol, 'VariableSymbol', symbol.name)
    },
    visitPropertySymbol(symbol: PropertySymbol) {
        return baseSymbolContainer(symbol, 'PropertySymbol', symbol.name)
    },
    visitIndexAccessSymbol(symbol: IndexAccessSymbol) {
        return baseSymbolContainer(symbol, 'IndexAccessSymbol', symbol.index)
    },
    visitMethodCallSymbol(symbol: MethodCallSymbol) {
        return compositeSymbolContainer(symbol, 'MethodCallSymbol', symbol.name, symbol.arguments ?? [])
    },
    visitAccessSequenceSymbol(symbol: AccessSequenceSymbol) {
        return compositeSymbolContainer(symbol, 'AccessSequenceSymbol', undefined, symbol.getChildrenSymbols())
    },

    // expression
    visitUnaryExpressionSymbol(symbol: UnaryExpressionSymbol) {
        return compositeSymbolContainer(symbol, 'UnaryExpressionSymbol', undefined, symbol.getChildrenSymbols())
    },
    visitBinaryExpressionSymbol(symbol: BinaryExpressionSymbol) {
        return compositeSymbolContainer(symbol, 'BinaryExpressionSymbol', undefined, symbol.getChildrenSymbols())
    },
    visitTernaryExpressionSymbol(symbol: TernaryExpressionSymbol) {
        return compositeSymbolContainer(symbol, 'TernaryExpressionSymbol', undefined, symbol.getChildrenSymbols())
    },
    visitConstructorSymbol(symbol: ConstructorSymbol) {
        return compositeSymbolContainer(symbol, 'ConstructorSymbol', symbol.name.toString(), symbol.getChildrenSymbols())
    },
    visitConstSymbol(symbol: ConstSymbol) {
        return baseSymbolContainer(symbol, 'ConstSymbol', `${symbol.value} (${symbol.type})`)
    },

    // preprocessor
    visitPreprocessorSymbol(symbol: PreprocessorSymbol) {
        return compositeSymbolContainer(symbol, 'VariableDefinitionSymbol', undefined, symbol.getChildrenSymbols())
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

function compositeSymbolContainer(symbol: BaseSymbol, type: string, value?: string, symbols?: BaseSymbol[]) {
    const div = document.createElement('div')
    div.className = 'node'
    const typeSpan = document.createElement('span')
    typeSpan.className = 'type'
    typeSpan.textContent = `${type}: ${value}`
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