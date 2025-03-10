import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { parseJson } from '../../src/bsl/chevrotain/parser'

describe('common', () => {
    test('parse', ()=>{
        const result = parseJson('1 + 1;')
    })
})

