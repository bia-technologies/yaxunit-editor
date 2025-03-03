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

export function isCompareOperator(operator: string) {
    return operator in [
        Operators.equal,
        Operators.not,
        Operators.great,
        Operators.greatOrEqual,
        Operators.less,
        Operators.lessOrEqual
    ]
}