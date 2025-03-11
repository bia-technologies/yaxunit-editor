import { createToken, Lexer } from "chevrotain"

const Identifier = createToken({ name: 'Identifier', pattern: /[\wа-я_][\wа-я_0-9]*/i })

const keyword = (name: string, ...words: string[]) => {
    words.push(name)
    return createToken({ name, pattern: new RegExp(words.join('|'), 'i'), longer_alt: Identifier })
}

const preproc_keyword = (name: string, ...words: string[]) => {
    return createToken({ name, pattern: new RegExp('#' + words.join('|#'), 'i') })
}

const AdditionOperator = createToken({
    name: "AdditionOperator",
    pattern: Lexer.NA,
});

const MultiplicationOperator = createToken({
    name: "MultiplicationOperator",
    pattern: Lexer.NA,
});

const CompareOperator = createToken({
    name: "CompareOperator",
    pattern: Lexer.NA,
});

export const keywords = {
    PreprocIf: preproc_keyword('PreprocIf', 'if', 'если'),
    PreprocElsif: preproc_keyword('PreprocElsif', 'elsif', 'иначеесли'),
    PreprocElse: preproc_keyword('PreprocElse', 'else', 'иначе'),
    PreprocEndif: preproc_keyword('PreprocEndif', 'endif', 'конецесли'),
    PreprocRegion: preproc_keyword('PreprocRegion', 'region', 'область'),
    PreprocEndregion: preproc_keyword('PreprocEndregion', 'endregion', 'конецобласти'),

    If: keyword('If', 'если'),
    Then: keyword('Then', 'тогда'),
    Elsif: keyword('Elsif', 'иначеесли'),
    Else: keyword('Else', 'иначе'),
    Endif: keyword('Endif', 'конецесли'),
    For: keyword('For', 'для'),
    Each: keyword('Each', 'каждого'),
    In: keyword('In', 'из'),
    To: keyword('To', 'по'),
    While: keyword('While', 'пока'),
    Do: keyword('Do', 'цикл'),
    EndDo: keyword('EndDo', 'конеццикла'),
    Goto: keyword('Goto', 'перейти'),
    Return: keyword('Return', 'возврат'),
    Break: keyword('Break', 'прервать'),
    Continue: keyword('Continue', 'продолжить'),

    // Declarations
    Procedure: keyword('Procedure', 'процедура'),
    Function: keyword('Function', 'функция'),
    EndProcedure: keyword('EndProcedure', 'конецпроцедуры'),
    EndFunction: keyword('EndFunction', 'конецфункции'),
    Var: keyword('Var', 'перем'),
    Export: keyword('Export', 'экспорт'),
    Val: keyword('Val', 'знач'),

    // Values
    True: keyword('True', 'истина'),
    False: keyword('False', 'ложь'),
    Undefined: keyword('Undefined', 'неопределено'),

    // Exceptions
    Try: keyword('Try', 'попытка'),
    Except: keyword('Except', 'исключение'),
    Raise: keyword('Raise', 'вызватьисключение'),
    EndTry: keyword('EndTry', 'конецпопытки'),

    // Async/await
    Async: keyword('Async', 'асинх'),
    Await: keyword('Await', 'ждать'),

    // New & Execute
    New: keyword('New', 'новый'),
    Execute: keyword('Execute', 'выполнить'),

    // Handlers
    AddHandler: keyword('AddHandler', 'добавитьобработчик'),
    RemoveHandler: keyword('RemoveHandler', 'удалитьобработчик'),

    // Operators
    Or: keyword('Or', 'или'),
    And: keyword('And', 'и'),
    Not: keyword('Not', 'не'),

    // NULL
    Null: keyword('NULL'),
}

export const tokens = {
    AdditionOperator,
    MultiplicationOperator,
    CompareOperator,
    Comment: createToken({ name: "Comment", pattern: /\/\/[^\r\n]*/, group: Lexer.SKIPPED }),
    WhiteSpace: createToken({ name: "WhiteSpace", pattern: /[ \t\n\r]+/, group: Lexer.SKIPPED }),
    ...keywords,
    LSquare: createToken({ name: 'LSquare', pattern: /\[/ }),
    RSquare: createToken({ name: 'RSquare', pattern: /]/ }),
    LParen: createToken({ name: 'LParen', pattern: '(' }),
    RParen: createToken({ name: 'RParen', pattern: ')' }),
    Dot: createToken({ name: 'Dot', pattern: /\./ }),
    Semicolon: createToken({ name: 'Semicolon', pattern: ';' }),
    Сolon: createToken({ name: 'Сolon', pattern: ':' }),
    Comma: createToken({ name: 'Comma', pattern: ',' }),
    Tilde: createToken({ name: 'Tilde', pattern: '~' }),

    Plus: createToken({ name: 'Plus', pattern: '+', categories: AdditionOperator }),
    Minus: createToken({ name: 'Minus', pattern: '-', categories: AdditionOperator }),
    Mul: createToken({ name: 'Mul', pattern: '*', categories: MultiplicationOperator }),
    Quotient: createToken({ name: 'Quotient', pattern: '/', categories: MultiplicationOperator }),
    Modulo: createToken({ name: 'Modulo', pattern: '%', categories: MultiplicationOperator }),
    
    NotEqual: createToken({ name: 'NotEqual', pattern: '<>', categories: CompareOperator }),
    LessOrEqual: createToken({ name: 'LessOrEqual', pattern: '<=', categories: CompareOperator }),
    GreaterOrEqual: createToken({ name: 'GreaterOrEqual', pattern: '>=', categories: CompareOperator }),
    Assign: createToken({ name: 'Assign', pattern: '=', categories: CompareOperator }),
    Less: createToken({ name: 'Less', pattern: '<', categories: CompareOperator }),
    Greater: createToken({ name: 'Greater', pattern: '>', categories: CompareOperator }),

    Question: createToken({ name: 'Question', pattern: '?' }),
    String: createToken({ name: "String", pattern: /"([^\r\n"]|"")*"/, }),
    MultilineString: createToken({ name: "MultilineString", pattern: /"([^\r\n"]|"")*\n(\s*\|([^\r\n"]|"")*)*"/ }),
    Number: createToken({ name: "Number", pattern: /\d+(\.\d+)?/, }),
    Date: createToken({ name: 'Date', pattern: /'\d{8,14}'/ }),
    Identifier
}

export const allTokens = Object.values(tokens)