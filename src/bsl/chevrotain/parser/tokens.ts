import { createToken, Lexer, TokenType } from "chevrotain"

const CORE_KEYWORDS = [
    // Control flow
    ['если', 'if'],
    ['тогда', 'then'],
    ['иначеесли', 'elsif'],
    ['иначе', 'else'],
    ['конецесли', 'endif'],
    ['для', 'for'],
    ['каждого', 'each'],
    ['из', 'in'],
    ['по', 'to'],
    ['пока', 'while'],
    ['цикл', 'do'],
    ['конеццикла', 'enddo'],
    ['перейти', 'goto'],
    ['возврат', 'return'],
    ['прервать', 'break'],
    ['продолжить', 'continue'],

    // Declarations
    ['процедура', 'procedure'],
    ['функция', 'function'],
    ['конецпроцедуры', 'endprocedure'],
    ['конецфункции', 'endfunction'],
    ['перем', 'var'],
    ['экспорт', 'export'],
    ['знач', 'val'],

    // Values
    ['истина', 'true'],
    ['ложь', 'false'],
    ['неопределено', 'undefined'],

    // Exceptions
    ['попытка', 'try'],
    ['исключение', 'except'],
    ['вызватьисключение', 'raise'],
    ['конецпопытки', 'endtry'],

    // Async/await
    ['асинх', 'async'],
    ['ждать', 'await'],

    // New
    ['новый', 'new'],

    // Handlers
    ['добавитьобработчик', 'addhandler'],
    ['удалитьобработчик', 'removehandler'],

    // Operators
    ['и', 'and'],
    ['или', 'or'],
    ['не', 'not'],
];

const PREPROC_KEYWORDS = [
    ['если', 'if'],
    ['иначеесли', 'elsif'],
    ['иначе', 'else'],
    ['конецесли', 'endif'],
    ['область', 'region'],
    ['конецобласти', 'endregion'],
];

const keyword = (name: string, ...words: string[]) => createToken({ name, pattern: new RegExp(words.join('|'), 'i') });

/**
 * Формирует правила для ключевых слов
 */
function buildKeywords() {
    const kw: { [key: string]: TokenType } = {}
    for (const [rus, eng] of CORE_KEYWORDS) {
        const name = eng.toUpperCase()
        kw[name] = keyword(name, rus, eng);
    }

    for (const [rus, eng] of PREPROC_KEYWORDS) {
        const name = `PREPROC_${eng.toUpperCase()}`
        kw[name] = keyword(name, '#' + rus, '#' + eng);
    }

    kw['NULL'] = keyword('NULL', 'null');
    return kw;
}

export const keywords = buildKeywords()

export const tokens = {
    LSquare: createToken({ name: 'LSquare', pattern: /\[/ }),
    RSquare: createToken({ name: 'RSquare', pattern: /]/ }),
    LParen: createToken({ name: 'LParen', pattern: '(' }),
    RParen: createToken({ name: 'RParen', pattern: ')' }),
    Dot: createToken({ name: 'Dot', pattern: /\./ }),
    Semicolon: createToken({ name: 'Semicolon', pattern: ';' }),
    Comma: createToken({ name: 'Comma', pattern: ',' }),

    Assign: createToken({ name: 'Assign', pattern: '=' }),
    Plus: createToken({ name: 'Plus', pattern: '+' }),
    Minus: createToken({ name: 'Minus', pattern: '-' }),
    Mul: createToken({ name: 'Mul', pattern: '*' }),
    Quotient: createToken({ name: 'Quotient', pattern: '/' }),
    Modulo: createToken({ name: 'Modulo', pattern: '%' }),
    Less: createToken({ name: 'Less', pattern: '<' }),
    LessOrEqual: createToken({ name: 'LessOrEqual', pattern: '<=' }),
    NotEqual: createToken({ name: 'NotEqual', pattern: '<>' }),
    Greater: createToken({ name: 'Greater', pattern: '>' }),
    GreaterOrEqual: createToken({ name: 'GreaterOrEqual', pattern: '>=' }),
    Question: createToken({ name: 'Question', pattern: '?' }),
    WhiteSpace: createToken({ name: "WhiteSpace", pattern: /[ \t\n\r]+/, group: Lexer.SKIPPED }),
    String: createToken({ name: "String", pattern: /"([^\r\n"]|"")*"/, }),
    MultilineString: createToken({ name: "MultilineString", pattern: /"([^\r\n"]|"")*\n(\s*\|([^\r\n"]|"")*)*"/ }),
    Number: createToken({ name: "Number", pattern: /\d+(\.\d+)?/, }),
    Date: createToken({ name: 'Date', pattern: /'\d{8,14}'/ }),

    Identifier: createToken({ name: 'identifier', pattern: /[\wа-я_][\wа-я_0-9]*/i }),
}

export const operators = [
    tokens.Plus,
    tokens.Minus,
    tokens.Mul,
    tokens.Quotient,
    tokens.Modulo,
    tokens.Less,
    tokens.LessOrEqual,
    tokens.Greater,
    tokens.GreaterOrEqual,
    tokens.NotEqual,
    tokens.Assign,
]

export const allTokens = [...Object.values(keywords), ...Object.values(tokens),]