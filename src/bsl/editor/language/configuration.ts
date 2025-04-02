import { languages } from 'monaco-editor'
import LanguageConfiguration = languages.LanguageConfiguration
import IMonarchLanguage = languages.IMonarchLanguage
import { keywords_all, keywords } from './keywords'
import { TokenType } from './tokenTypes'

const increaseIndent = [keywords.Function, keywords.Procedure, keywords.If, keywords.Else, keywords.ElsIf, keywords.While, keywords.For, keywords.Try, keywords.Except]
const decreaseIndent = [keywords.EndFunction, keywords.EndProcedure, keywords.EndIf, keywords.EndDo, keywords.EndTry]

export const conf: LanguageConfiguration = {
  comments: {
    lineComment: "//"
  },
  brackets: [
    ['(', ')'],
    ['[', ']'],
    [keywords.If.ru, keywords.EndIf.ru],
    [keywords.If.en, keywords.EndIf.en],

    [keywords.For.ru, keywords.EndDo.ru],
    [keywords.For.en, keywords.EndDo.en],

    [keywords.While.ru, keywords.EndDo.ru],
    [keywords.While.en, keywords.EndDo.en],

    [keywords.Try.ru, keywords.EndTry.ru],
    [keywords.Try.en, keywords.EndTry.en],

    [keywords.Function.ru, keywords.EndFunction.ru],
    [keywords.Function.en, keywords.EndFunction.en],

    [keywords.Procedure.ru, keywords.EndProcedure.ru],
    [keywords.Procedure.en, keywords.EndProcedure.en],

    ['#область', '#конецобласти'],
    ['#region', '#endregion'],
    ['#если', '#конецесли'],
    ['#if', '#endif'],
  ],
  autoClosingPairs: [
    { open: "(", close: ")" },
    { open: "[", close: "]" },
    { open: "\"", close: "\"", notIn: ["string", "comment"] },
    { open: "'", close: "'" },

  ],
  surroundingPairs: [
    { open: "(", close: ")" },
    { open: "[", close: "]" },
    { open: "\"", close: "\"" },
    { open: "'", close: "'" },
  ],
  folding: {
    offSide: false,
    markers: {
      start: /^\s*#Область.+/,
      end: /^\s*#КонецОбласти/
    }
  },
  colorizedBracketPairs: [
    ['(', ')'],
    ['[', ']']
  ],
  indentationRules: {
    increaseIndentPattern: new RegExp('\s*(' + [...increaseIndent.map(k => k.ru), ...increaseIndent.map(k => k.en)].join('|') + ')\\s.*$', 'i'),
    decreaseIndentPattern: new RegExp('\s*(' + [...decreaseIndent.map(k => k.ru), ...decreaseIndent.map(k => k.en)].join('|') + ').*$', 'i'),
  },
};

export const language: IMonarchLanguage = <IMonarchLanguage>{
  ignoreCase: true,
  keywords: keywords_all,

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
