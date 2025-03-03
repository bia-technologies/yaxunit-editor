import { BslParser } from "../../src/bsl/tree-sitter"
import { provider } from '../../src/bsl/codeModel/bslCodeModelProvider'

var parser: BslParser | undefined

function cleanAfterAll() {
    parser?.dispose()
}

function buildModel(content: string) {
    return provider.buildModel(parser = new BslParser(content))
}

export default {
    buildModel,
    cleanAfterAll
}
