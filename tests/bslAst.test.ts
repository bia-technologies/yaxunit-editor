import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { useTreeSitterBsl, BslParser } from '../src/bsl/tree-sitter'

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

