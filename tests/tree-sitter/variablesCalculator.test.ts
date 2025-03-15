import { VariablesCalculator } from '../../src/bsl/codeModel/calculators'
import { BslParser, useTreeSitterBsl } from '../../src/bsl/tree-sitter'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import utils from './utils'

beforeAll(async () => {
    await useTreeSitterBsl()
})

var parser: BslParser | undefined

afterAll(() => {
    parser?.dispose()
})

describe('collect', () => {
    test('module variables', ()=>{
        const model = utils.buildModel('Перем А1, А2; Перем А3;А4 = 5;А1 = А9;А2 = А3;')
        const calculator = new VariablesCalculator()
        const vars = calculator.calculate(model)
        expect(vars).length(4)
    })
})