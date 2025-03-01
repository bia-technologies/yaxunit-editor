import { BslParser } from "../tree-sitter";
import { BslCodeModel } from "./bslCodeModel";
import * as factory from './factory'

export interface BslCodeModelProvider {
    buildModel(parser: BslParser): BslCodeModel
    updateModel(): void
}
export const provider: BslCodeModelProvider = {
    buildModel(parser: BslParser): BslCodeModel {
        const start = performance.now()
        const model = new BslCodeModel()

        for (const node of parser.getRootNode().children) {
            if (!node) {
                continue
            }
            const symbol = factory.createSymbol(node)
            if (Array.isArray(symbol)) {
                model.children.push(...symbol)
            } else if (symbol) {
                model.children.push(symbol)
            }
        }
        console.debug('Build code model', performance.now() - start, 'ms')
        return model
    },

    updateModel(): void {

    }
}