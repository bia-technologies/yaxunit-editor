import { BslVisitor, SyntaxNode, getChildText, hasChild, terms } from "lezer-bsl"
import { BaseSymbol, SymbolPosition } from "@/common/codeModel"
import {
    ProcedureDefinitionSymbol,
    FunctionDefinitionSymbol,
    ParameterDefinitionSymbol,
    VariableDefinitionSymbol,
    VariableSymbol
} from "../../codeModel"

/**
 * Быстрый visitor - собирает только декларации верхнего уровня без тел методов
 */
export class FastLezerVisitor extends BslVisitor<BaseSymbol> {
    module(node: SyntaxNode, _source: string): BaseSymbol[] {
        this.source = _source
        const results: BaseSymbol[] = []
        
        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (child.type.id === terms.ModuleBlock) continue
            const symbol = this.visit(child)
            if (symbol) results.push(symbol)
        }
        
        return results
    }

    protected override visitProcedureDef(node: SyntaxNode): ProcedureDefinitionSymbol {
        const name = getChildText(node, terms.Name, this.source) || "UnknownProcedure"
        const symbol = new ProcedureDefinitionSymbol(this.nodePosition(node), name)
        
        symbol.isExport = hasChild(node, terms._export)
        symbol.params = this.getParameters(node)
        symbol.children = []
        
        return symbol
    }

    protected override visitFunctionDef(node: SyntaxNode): FunctionDefinitionSymbol {
        const name = getChildText(node, terms.Name, this.source) || "UnknownFunction"
        const symbol = new FunctionDefinitionSymbol(this.nodePosition(node), name)
        
        symbol.isExport = hasChild(node, terms._export)
        symbol.params = this.getParameters(node)
        symbol.children = []
        
        return symbol
    }

    protected override visitVarDecl(node: SyntaxNode): BaseSymbol {
        const symbol = new VariableDefinitionSymbol(this.nodePosition(node))
        symbol.vars = node.getChildren(terms.VarSpec)
            .map(_ => this.visit(_))
            .filter(_ => _ !== undefined) as VariableSymbol[]
        
        return symbol
    }

    protected override visitVarSpec(node: SyntaxNode): BaseSymbol {
        const name = getChildText(node, terms.VariableName, this.source) || "UnknownVar"
        return new VariableSymbol(this.nodePosition(node), name)
    }

    protected override visitParam(node: SyntaxNode): ParameterDefinitionSymbol {
        const name = getChildText(node, terms.Name, this.source)
        const symbol = new ParameterDefinitionSymbol(this.nodePosition(node), name)
        symbol.byVal = hasChild(node, terms.val)
        return symbol
    }

    private nodePosition(node: SyntaxNode): SymbolPosition {
        return {
            startOffset: node.from,
            endOffset: node.to
        }
    }

    private getParameters(node: SyntaxNode): ParameterDefinitionSymbol[] {
        const paramList = node.getChild(terms.ParamList)
        if (!paramList) return []

        return paramList.getChildren(terms.Param)
            .map(_ => this.visit(_))
            .filter(_ => _ !== undefined) as ParameterDefinitionSymbol[]
    }
}
