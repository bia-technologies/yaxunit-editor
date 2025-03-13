export enum BaseTypes {
    number = 'Число',
    unknown = 'Неизвестный',
    date = 'Дата',
    string = 'Строка',
    boolean = 'Булево',
    undefined = 'Неопределено',
    null = 'NULL'
}

export function isBaseType(typeid: string): boolean {
    return typeid === BaseTypes.boolean
        || typeid === BaseTypes.date
        || typeid === BaseTypes.number
        || typeid === BaseTypes.string
        || typeid === BaseTypes.undefined
        || typeid === BaseTypes.null
        || typeid === BaseTypes.unknown
}