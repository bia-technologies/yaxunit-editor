import { BaseSymbol, NamedSymbol } from "@/common/codeModel/base";
import { Node } from "web-tree-sitter";

export class Variable extends NamedSymbol { }
export class Property extends NamedSymbol { constructor(node: Node) { super(node, node.text) } }
export class IndexAccess extends NamedSymbol { }
export class MethodCall extends NamedSymbol { 
    arguments?: BaseSymbol[]
}
export type Access = (MethodCall | Property | IndexAccess)[]

export class PropertyAccess extends BaseSymbol {
    access: Access = []
}
