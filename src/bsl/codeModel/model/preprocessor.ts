import { BaseSymbol } from "@/common/codeModel"
import { CodeModelVisitor } from "../visitor"

export class PreprocessorSymbol extends BaseSymbol {
    name?: string

    accept(visitor: CodeModelVisitor): void {
        visitor.visitPreprocessorSymbol(this)
    }
}