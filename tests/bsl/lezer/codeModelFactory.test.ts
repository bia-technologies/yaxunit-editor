import { describe, it, expect, beforeEach } from 'vitest'
import { LezerCodeModelFactory } from '../../../src/bsl/lezer/codeModelFactory'
import { BslCodeModel, ProcedureDefinitionSymbol, FunctionDefinitionSymbol, VariableDefinitionSymbol } from '../../../src/bsl/codeModel'

describe('LezerCodeModelFactory', () => {
    let factory: LezerCodeModelFactory

    beforeEach(() => {
        factory = new LezerCodeModelFactory()
    })

    it('should create empty model for empty code', () => {
        const model = factory.buildModel('')
        
        expect(model).toBeInstanceOf(BslCodeModel)
        expect(model.children).toHaveLength(0)
    })

    it('should parse simple procedure', () => {
        const code = `
Процедура ТестПроцедура()
    // пустая процедура
КонецПроцедуры
`
        const model = factory.buildModel(code)
        
        expect(model.children).toHaveLength(1)
        expect(model.children[0]).toBeInstanceOf(ProcedureDefinitionSymbol)
        
        const proc = model.children[0] as ProcedureDefinitionSymbol
        expect(proc.name).toBe('ТестПроцедура')
        expect(proc.isExport).toBe(false)
    })

    it('should parse exported procedure with parameters', () => {
        const code = `
Процедура ТестПроцедура(Знач Параметр1, Параметр2) Экспорт
    // процедура с параметрами
КонецПроцедуры
`
        const model = factory.buildModel(code)
        
        expect(model.children).toHaveLength(1)
        const proc = model.children[0] as ProcedureDefinitionSymbol
        expect(proc.name).toBe('ТестПроцедура')
        expect(proc.isExport).toBe(true)
        expect(proc.params).toHaveLength(2)
        expect(proc.params[0].name).toBe('Параметр1')
        expect(proc.params[0].byVal).toBe(true)
        expect(proc.params[1].name).toBe('Параметр2')
        expect(proc.params[1].byVal).toBe(false)
    })

    it('should parse simple function', () => {
        const code = `
Функция ТестФункция()
    Возврат "результат";
КонецФункции
`
        const model = factory.buildModel(code)
        
        expect(model.children).toHaveLength(1)
        expect(model.children[0]).toBeInstanceOf(FunctionDefinitionSymbol)
        
        const func = model.children[0] as FunctionDefinitionSymbol
        expect(func.name).toBe('ТестФункция')
        expect(func.isExport).toBe(false)
    })

    it('should parse variable declarations', () => {
        const code = `
Перем Переменная1, Переменная2;

Процедура Тест()
КонецПроцедуры
`
        const model = factory.buildModel(code)
        
        expect(model.children).toHaveLength(2)
        expect(model.children[0]).toBeInstanceOf(VariableDefinitionSymbol)
        
        const varDef = model.children[0] as VariableDefinitionSymbol
        expect(varDef.vars).toHaveLength(2)
        expect(varDef.vars[0].name).toBe('Переменная1')
        expect(varDef.vars[1].name).toBe('Переменная2')
    })

    it('should parse complex module with multiple elements', () => {
        const code = `
Перем МодульнаяПеременная;

Процедура Процедура1() Экспорт
    Перем ЛокальнаяПеременная;
    ЛокальнаяПеременная = 1;
КонецПроцедуры

Функция Функция1(Параметр)
    Если Параметр > 0 Тогда
        Возврат Параметр * 2;
    КонецЕсли;
    Возврат 0;
КонецФункции
`
        const model = factory.buildModel(code)
        
        expect(model.children.length).toBeGreaterThan(0)
        
        // Проверим что есть процедура и функция
        const procedures = model.children.filter(c => c instanceof ProcedureDefinitionSymbol)
        const functions = model.children.filter(c => c instanceof FunctionDefinitionSymbol)
        const variables = model.children.filter(c => c instanceof VariableDefinitionSymbol)
        
        expect(procedures).toHaveLength(1)
        expect(functions).toHaveLength(1)
        expect(variables).toHaveLength(1)
        
        const proc = procedures[0] as ProcedureDefinitionSymbol
        expect(proc.name).toBe('Процедура1')
        expect(proc.isExport).toBe(true)
        
        const func = functions[0] as FunctionDefinitionSymbol
        expect(func.name).toBe('Функция1')
        expect(func.params).toHaveLength(1)
        expect(func.params[0].name).toBe('Параметр')
    })

    it('should handle parsing errors gracefully', () => {
        const invalidCode = `
Процедура НеЗакрытаяПроцедура(
    // синтаксическая ошибка
`
        const model = factory.buildModel(invalidCode)
        
        expect(model).toBeInstanceOf(BslCodeModel)
        expect(factory.errors.length).toBeGreaterThan(0)
    })

    it('should rebuild model correctly', () => {
        const code1 = `
Процедура Тест1()
КонецПроцедуры
`
        const code2 = `
Функция Тест2()
    Возврат 1;
КонецФункции
`
        const model = factory.buildModel(code1)
        expect(model.children).toHaveLength(1)
        expect(model.children[0]).toBeInstanceOf(ProcedureDefinitionSymbol)
        
        factory.reBuildModel(model, code2)
        expect(model.children).toHaveLength(1)
        expect(model.children[0]).toBeInstanceOf(FunctionDefinitionSymbol)
    })

    it('should preserve symbol positions', () => {
        const code = `
Процедура Тест()
КонецПроцедуры
`
        const model = factory.buildModel(code)
        
        expect(model.children).toHaveLength(1)
        const symbol = model.children[0]
        expect(symbol.position).toBeDefined()
        expect(symbol.position.startOffset).toBeGreaterThanOrEqual(0)
        expect(symbol.position.endOffset).toBeGreaterThan(symbol.position.startOffset)
    })
})
