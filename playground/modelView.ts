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
        visitor.visitModel(model).forEach(div => treeContainer.appendChild(div))
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
        return baseSymbolContainer(symbol, 'Parameter', `${symbol.name}; byVal: ${symbol.byVal}; default: ${symbol.default};`)
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

    visitContinueStatement(symbol) {
        return baseSymbolContainer(symbol, 'ContinueStatementSymbol')
    },
    visitBreakStatement(symbol) {
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
        return baseSymbolContainer(symbol, 'IndexAccessSymbol', `${symbol.index}`)
    },
    visitMethodCallSymbol(symbol: MethodCallSymbol) {
        return compositeSymbolContainer(symbol, 'MethodCallSymbol', symbol.name, symbol.arguments ?? [])
    },
    visitAccessSequenceSymbol(symbol: AccessSequenceSymbol) {
        return compositeSymbolContainer(symbol, 'AccessSequence', undefined, symbol.getChildrenSymbols())
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

/**
 * Creates an HTML container representing a symbol.
 *
 * The container is a div element with a span displaying the provided type and optional value.
 * When a global selector is defined and the symbol is available, clicking the span triggers
 * the selector callback with the symbol.
 *
 * @param symbol - The symbol to represent.
 * @param type - A descriptive label for the symbol.
 * @param value - An optional value to display with the type.
 * @returns A div element containing the symbol's representation.
 */
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

/**
 * Creates a container element for error messages.
 *
 * This function generates a <div> element with the class "node" and appends a child
 * <span> element with the class "error". The span displays the provided error type and,
 * if supplied, an additional error detail.
 *
 * @param type - The error category or identifier.
 * @param value - An optional message providing extra error context.
 * @returns The HTML element representing the error container.
 */
function errorContainer(type: string, value?: string) {
    const div = document.createElement('div')
    div.className = 'node'
    const typeSpan = document.createElement('span')
    typeSpan.className = 'error'
    typeSpan.textContent = `${type}: ${value ?? ''}`
    div.appendChild(typeSpan);

    return div
}

/**
 * Creates a composite container element for a given symbol.
 *
 * This function returns a div element that visually represents a symbol by combining a type label
 * and an optional value. If provided, an array of child symbols is processed and rendered inside the container.
 * Additionally, if a global selector function exists, the type label becomes clickable to trigger the selector with the symbol.
 *
 * @param symbol - The base symbol to render.
 * @param type - The label representing the symbol's type.
 * @param value - An optional string value to display alongside the type.
 * @param symbols - An optional array of child symbols that will be visited and appended to the container.
 * @returns A div element with class "node" representing the composite symbol.
 */
function compositeSymbolContainer(symbol: BaseSymbol, type: string, value?: string, symbols?: BaseSymbol[]) {
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

/**
 * Processes an array of symbols using the visitor pattern, converting each symbol into its corresponding HTML container.
 *
 * Each symbol in the array is evaluated:
 * - If the symbol is undefined, an error container for an "undefined node" is returned.
 * - If the symbol is acceptable, its `accept` method is invoked with the provided visitor.
 * - For any other case, an error container indicating "unsupported" along with the item's type is returned.
 *
 * @param items - An optional array of symbols to process; if undefined, an empty array is returned.
 * @param visitor - A visitor used to render acceptable symbols.
 * @returns An array of HTML elements generated either by processing the symbol via its `accept` method or by creating an error container.
 */
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