import { describe, it, expect, beforeEach } from 'vitest'
import { LezerCodeModelFactoryVisitor } from '@/bsl/lezer/codeModelFactoryVisitor'
import { parser } from 'lezer-bsl'
import { 
    ProcedureDefinitionSymbol, 
    FunctionDefinitionSymbol, 
    VariableDefinitionSymbol,
    AssignmentStatementSymbol,
    ReturnStatementSymbol,
    IfStatementSymbol
} from '@/bsl/codeModel'

describe('LezerCodeModelFactoryVisitor', () => {
    let visitor: LezerCodeModelFactoryVisitor

    beforeEach(() => {
        visitor = new LezerCodeModelFactoryVisitor()
    })

    it('should visit procedure definition', () => {
        const code = `Процедура Тест() КонецПроцедуры`
        const tree = parser.parse(code)
        const symbols = visitor.visit(tree.topNode, code)
        
        expect(symbols).toHaveLength(1)
        expect(symbols[0]).toBeInstanceOf(ProcedureDefinitionSymbol)
        
        const proc = symbols[0] as ProcedureDefinitionSymbol
        expect(proc.name).toBe('Тест')
    })

    it('should visit function definition', () => {
        const code = `Функция Тест() Возврат 1; КонецФункции`
        const tree = parser.parse(code)
        const symbols = visitor.visit(tree.topNode, code)
        
        expect(symbols).toHaveLength(1)
        expect(symbols[0]).toBeInstanceOf(FunctionDefinitionSymbol)
        
        const func = symbols[0] as FunctionDefinitionSymbol
        expect(func.name).toBe('Тест')
    })

    it('should visit variable declaration', () => {
        const code = `Перем Переменная1, Переменная2;`
        const tree = parser.parse(code)
        const symbols = visitor.visit(tree.topNode, code)
        
        expect(symbols).toHaveLength(1)
        expect(symbols[0]).toBeInstanceOf(VariableDefinitionSymbol)
        
        const varDef = symbols[0] as VariableDefinitionSymbol
        expect(varDef.vars).toHaveLength(2)
    })

    it('should visit exported procedure with parameters', () => {
        const code = `Процедура Тест(Знач Параметр1, Параметр2) Экспорт КонецПроцедуры`
        const tree = parser.parse(code)
        const symbols = visitor.visit(tree.topNode, code)
        
        expect(symbols).toHaveLength(1)
        const proc = symbols[0] as ProcedureDefinitionSymbol
        expect(proc.name).toBe('Тест')
        expect(proc.isExport).toBe(true)
        expect(proc.params).toHaveLength(2)
        expect(proc.params[0].byVal).toBe(true)
        expect(proc.params[1].byVal).toBe(false)
    })

    it('should visit statements inside procedure', () => {
        const code = `
Процедура Тест()
    Переменная = 1;
    Возврат;
КонецПроцедуры`
        const tree = parser.parse(code)
        const symbols = visitor.visit(tree.topNode, code)
        
        expect(symbols).toHaveLength(1)
        const proc = symbols[0] as ProcedureDefinitionSymbol
        expect(proc.children.length).toBeGreaterThan(0)
    })

    it('should handle complex control structures', () => {
        const code = `
Процедура Тест()
    Если Условие Тогда
        Переменная = 1;
    КонецЕсли;
КонецПроцедуры`
        const tree = parser.parse(code)
        const symbols = visitor.visit(tree.topNode, code)
        
        expect(symbols).toHaveLength(1)
        const proc = symbols[0] as ProcedureDefinitionSymbol
        expect(proc.children.some(c => c instanceof IfStatementSymbol)).toBe(true)
    })

    it('should preserve correct positions', () => {
        const code = `Процедура Тест() КонецПроцедуры`
        const tree = parser.parse(code)
        const symbols = visitor.visit(tree.topNode, code)
        
        expect(symbols).toHaveLength(1)
        const symbol = symbols[0]
        expect(symbol.position.startOffset).toBe(0)
        expect(symbol.position.endOffset).toBe(code.length)
    })

    it('should handle empty module', () => {
        const code = ``
        const tree = parser.parse(code)
        const symbols = visitor.visit(tree.topNode, code)
        
        expect(symbols).toHaveLength(0)
    })

    it('should handle multiple top-level elements', () => {
        const code = `
Перем Переменная;

Процедура Процедура1()
КонецПроцедуры

Функция Функция1()
    Возврат 1;
КонецФункции`
        const tree = parser.parse(code)
        const symbols = visitor.visit(tree.topNode, code)
        
        expect(symbols.length).toBeGreaterThanOrEqual(3)
        
        const hasVariable = symbols.some(s => s instanceof VariableDefinitionSymbol)
        const hasProcedure = symbols.some(s => s instanceof ProcedureDefinitionSymbol)
        const hasFunction = symbols.some(s => s instanceof FunctionDefinitionSymbol)
        
        expect(hasVariable).toBe(true)
        expect(hasProcedure).toBe(true)
        expect(hasFunction).toBe(true)
    })
})
