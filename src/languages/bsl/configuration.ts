import { languages } from 'monaco-editor-core'
import LanguageConfiguration = languages.LanguageConfiguration
import IMonarchLanguage = languages.IMonarchLanguage
import { TokenType } from "./tokenTypes"

export const conf: LanguageConfiguration = {
  comments: {
    lineComment: "//"
  },
  autoClosingPairs: [
    { open: "\"", close: "\"", notIn: ["string"] },
    { open: "'", close: "'", notIn: ["string"] },
    { open: "<", close: ">", notIn: ["string"] },
    { open: "$", close: "$" },
  ],
  surroundingPairs: [
    { open: "\"", close: "\"" },
    { open: "'", close: "'" },
    { open: "<", close: ">" },
  ]
};

export const language: IMonarchLanguage = <IMonarchLanguage>{
  ignoreCase: true,

  keywords: [
    'КонецПроцедуры', 'EndProcedure', 'КонецФункции', 'EndFunction',
    'Прервать', 'Break', 'Продолжить', 'Continue', 'Возврат', 'Return',
    'Если', 'If', 'Иначе', 'Else', 'ИначеЕсли', 'ElsIf', 'Тогда', 'Then',
    'КонецЕсли', 'EndIf', 'Попытка', 'Try', 'Исключение', 'Except',
    'КонецПопытки', 'EndTry', 'Raise', 'ВызватьИсключение', 'Пока',
    'While', 'Для', 'For', 'Каждого', 'Each', 'Из', 'In', 'По', 'To', 'Цикл',
    'Do', 'КонецЦикла', 'EndDo', 'НЕ', 'NOT', 'И', 'AND', 'ИЛИ', 'OR', 'Новый',
    'New', 'Процедура', 'Procedure', 'Функция', 'Function', 'Перем', 'Var',
    'Экспорт', 'Export', 'Знач', 'Val', 'Неопределено', 'Выполнить',
    'Истина', 'Ложь', 'True', 'False', 'Undefined'
  ],

  brackets: [
    { open: '[', close: ']', token: TokenType.DelimiterSquare },
    { open: '(', close: ')', token: TokenType.DelimiterParenthesis },
  ],

  operators: ['=', '<=', '>=', '<>', '<', '>', '+', '-', '*', '/', '%'],
  symbols: /[=><!~?:&+\-*\/\^%]+/,

  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {

    root: [
      [/[a-zA-Z\u0410-\u044F_][a-zA-Z\u0410-\u044F_0-9]*/, { cases: { '@keywords': TokenType.MetaTag, '@default': 'identifier' } }],
      // whitespace
      { include: '@whitespace' },
      // delimiters and operators
      [/}/, {
        cases: {
          '$S2==interpolatedstring': { token: TokenType.StringQuote, next: '@pop' },
          '$S2==litinterpstring': { token: TokenType.StringQuote, next: '@pop' },
          '@default': '@brackets'
        }
      }],
      [/^\s*#.*$/, 'key'],
      [/^\s*&.*$/, 'key'],
      [/[()\[\]]/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': TokenType.Operator,
          '@default': ''
        }
      }],
      // numbers
      [/[0-9_]*\.[0-9_]+([eE][\-+]?\d+)?[fFdD]?/, TokenType.NumberFloat],
      [/[0-9_]+/, TokenType.Number],
      // delimiter: after number because of .\d floats
      [/[;,.]/, TokenType.Delimiter],
      // strings
      [/"([^"\\]|\\.)*$/, TokenType.StringInvalid],
      [/["|]/, { token: TokenType.StringQuote, next: '@string' }],
      [/\$\@"/, { token: TokenType.StringQuote, next: '@litinterpstring' }],
      [/\@"/, { token: TokenType.StringQuote, next: '@litstring' }],
      [/\$"/, { token: TokenType.StringQuote, next: '@interpolatedstring' }],
      // characters
      [/'[^\\']'/, TokenType.String],
      [/(')(@escapes)(')/, [TokenType.String, TokenType.StringEscape, TokenType.String]],
      [/'/, TokenType.StringInvalid]
    ],
    comment: [
      [/\/\/.*$/, 'comment'],
    ],
    string: [
      [/[^\\"]+/, TokenType.String],
      [/@escapes/, TokenType.StringEscape],
      [/\\./, TokenType.StringEscapeInvalid],
      [/"/, { token: TokenType.StringQuote, next: '@pop' }],
      [/\|.*"/, { token: TokenType.StringQuote, next: '@pop' }],
    ],
    litstring: [
      [/[^"]+/, TokenType.String],
      [/""/, TokenType.StringEscape],
      [/"/, { token: TokenType.StringQuote, next: '@pop' }]
    ],
    litinterpstring: [
      [/[^"{]+/, TokenType.String],
      [/""/, TokenType.StringEscape],
      [/{{/, TokenType.StringEscape],
      [/}}/, TokenType.StringEscape],
      [/{/, { token: TokenType.StringQuote, next: 'root.litinterpstring' }],
      [/"/, { token: TokenType.StringQuote, next: '@pop' }]
    ],
    interpolatedstring: [
      [/[^\\"{]+/, TokenType.String],
      [/@escapes/, TokenType.StringEscape],
      [/\\./, TokenType.StringEscapeInvalid],
      [/{{/, TokenType.StringEscape],
      [/}}/, TokenType.StringEscape],
      [/{/, { token: TokenType.StringQuote, next: 'root.interpolatedstring' }],
      [/"/, { token: TokenType.StringQuote, next: '@pop' }]
    ],
    whitespace: [
      [/\/\/.*$/, 'comment'],
    ],
  },
};
