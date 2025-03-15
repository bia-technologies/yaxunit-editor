import { BslParser } from "../../src/bsl/tree-sitter"
import { TreeSitterCodeModelFactory } from '../../src/bsl/tree-sitter/codeModelFactory'

var parser: BslParser | undefined

function cleanAfterAll() {
    parser?.dispose()
}

function buildModel(content: string) {
    return TreeSitterCodeModelFactory.buildModel(parser = new BslParser(content))
}

export default {
    buildModel,
    cleanAfterAll
}
