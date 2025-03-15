import { BaseSymbol } from "@/common/codeModel";
import { BSLParser } from "./parser";
import { CstChildrenDictionary, CstElement, CstNode, CstNodeLocation, IToken } from "chevrotain";

const parser = new BSLParser()
const BaseVisitor = parser.getBaseCstVisitorConstructorWithDefaults<CstNodeLocation | undefined, BaseSymbol>()

export class BslVisitor extends BaseVisitor {
    constructor() {
        super()
        this.validateVisitor()
    }

    visitAll(nodes: CstElement[]): BaseSymbol[] {
        return (nodes as CstNode[]).filter(isNode).map(n => this.visit(n))
    }

    visit(cstNode: CstNode | CstNode[]): BaseSymbol {
        return super.visit(cstNode, (cstNode as CstNode)?.location)
    }

    visitFirst(cstNode: CstElement[]): BaseSymbol | undefined {
        return cstNode ? this.visit(cstNode[0] as CstNode) : undefined
    }

    static firstToken(ctx: CstChildrenDictionary) {
        return (Object.values(ctx)[0][0] as IToken)
    }

    static firstNode(ctx: CstChildrenDictionary) {
        return (Object.values(ctx)[0][0] as CstNode)
    }
}

function isNode(value: any): value is CstNode {
    return (value as CstNode).children !== undefined
}