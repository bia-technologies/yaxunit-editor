export enum Operators {
    equal = '=',
    notEqual = '<>',
    great = '>',
    less = '<',
    greatOrEqual = '>=',
    lessOrEqual = '<=',
    and = 'И',
    or = 'Или',
    not = 'Не',
    plus = '+',
    minus = '-',
    multiply = '*',
    divide = '/',
    mod = '%'
}

const compareOperators: string[] = [
    Operators.equal,
    Operators.not,
    Operators.great,
    Operators.greatOrEqual,
    Operators.less,
    Operators.lessOrEqual
]

export function isCompareOperator(operator: string) { // TODO поддержка различного формата написания (регистр, язык)
    return compareOperators.includes(operator)
}