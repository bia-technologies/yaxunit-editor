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

const string = createToken({ name: "string", pattern: /"([^\r\n"]|"")*"/, })

export const tokens = {
    LSquare: createToken({ name: "LSquare", pattern: /\[/ }),
    RSquare: createToken({ name: "RSquare", pattern: /]/ }),
    LPAREN: createToken({ name: 'LPAREN', pattern: '(' }),
    RPAREN: createToken({ name: 'RPAREN', pattern: ')' }),
    COLON: createToken({ name: 'COLON', pattern: ':' }),
    DOT: createToken({ name: 'DOT', pattern: /\./ }),
    SEMICOLON: createToken({ name: 'SEMICOLON', pattern: ';' }),
    COMMA: createToken({ name: 'COMMA', pattern: ',' }),

    ASSIGN: createToken({ name: 'ASSIGN', pattern: '=' }),
    PLUS: createToken({ name: 'PLUS', pattern: '+' }),
    MINUS: createToken({ name: 'MINUS', pattern: '-' }),
    MUL: createToken({ name: 'MUL', pattern: '*' }),
    QUOTIENT: createToken({ name: 'QUOTIENT', pattern: '/' }),
    MODULO: createToken({ name: 'MODULO', pattern: '%' }),
    LESS_OR_EQUAL: createToken({ name: 'LESS_OR_EQUAL', pattern: '<=' }),
    NOT_EQUAL: createToken({ name: 'NOT_EQUAL', pattern: '<>' }),
    LESS: createToken({ name: 'LESS', pattern: '<' }),
    GREATER_OR_EQUAL: createToken({ name: 'GREATER_OR_EQUAL', pattern: '>=' }),
    GREATER: createToken({ name: 'GREATER', pattern: '>' }),
    QUESTION: createToken({ name: 'QUESTION', pattern: '?' }),
    BAR: createToken({ name: 'BAR', pattern: '|' }),
    whiteSpace: createToken({ name: "whiteSpace", pattern: /[ \t\n\r]+/, group: Lexer.SKIPPED }),
    string,
    multilineString: createToken({ name: "multilineString", pattern: /"([^\r\n"]|"")*\n(\s*\|([^\r\n"]|"")*)*"/ }),
    // string_start: createToken({ name: "string_start", pattern: /"([^\r\n"]|"")*\n/ }),
    // string_tail: createToken({ name: "string_tail", pattern: /\|([^\r\n"]|"")*"/ }),
    // string_part: createToken({ name: "string_part", pattern: /\|([^\r\n"]|"")*\n/ }),
    number: createToken({ name: "number", pattern: /\d+(\.\d+)?/, }),
    date: createToken({ name: 'date', pattern: /'\d{8,14}'/ }),

    identifier: createToken({ name: 'identifier', pattern: /[\wа-я_][\wа-я_0-9]*/i }),
}

export const operators = [
    tokens.PLUS,
    tokens.MINUS,
    tokens.MUL,
    tokens.QUOTIENT,
    tokens.MODULO,
    tokens.LESS,
    tokens.LESS_OR_EQUAL,
    tokens.GREATER,
    tokens.GREATER_OR_EQUAL,
    tokens.NOT_EQUAL,
    tokens.ASSIGN,
]

export const allTokens = [...Object.values(keywords), ...Object.values(tokens),]