import { TypesCalculator } from '../../src/bsl/codeModel/calculators'
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

function calculate(content:string){
    const model = utils.buildModel(content)
    const calculator = new TypesCalculator()
    calculator.calculate(model)
    return model
}
describe('collect', () => {
    test('Assignment constant', ()=>{
        const model = calculate('A = 1')
        expect(model.children[0].variable).toMatchObject({
            type: 'Число', value: '1'
        })
    })
    test('Assignment compare', ()=>{
        const model = calculate('A = 1  > 2')
        expect(model.children[0].variable).toMatchObject({
            type: 'Булево', value: false
        })
    })
})