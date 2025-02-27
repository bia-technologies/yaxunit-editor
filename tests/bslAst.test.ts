import { BslParser, useTreeSitterBsl } from '../src/bsl-tree-sitter/bslAst'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { Queries } from '../src/bsl-tree-sitter/queries'

beforeAll(async () => {
    await useTreeSitterBsl()
})

var parser:BslParser|undefined

afterAll(() => {
    parser?.dispose()
})

describe('common', () => {
    test('parse', ()=>{
        parser = new BslParser('А = 1 + 1;')
    })
})

