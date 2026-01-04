import { IModelContentChange } from '../src/bsl/chevrotain/parser'

/**
 * Создает изменение для вставки текста
 */
export function insert(offset: number, text: string): IModelContentChange {
    return { rangeOffset: offset, rangeLength: 0, text }
}

/**
 * Создает изменение для удаления текста
 */
export function remove(offset: number, length: number): IModelContentChange {
    return { rangeOffset: offset, rangeLength: length, text: '' }
}

/**
 * Создает изменение для замены текста
 */
export function replace(offset: number, length: number, text: string): IModelContentChange {
    return { rangeOffset: offset, rangeLength: length, text }
}


export function image(token:string, startOffset:number ) {
    return { image: token, startOffset: startOffset }
}