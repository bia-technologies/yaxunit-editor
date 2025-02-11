import { Method } from '@/bsl/Symbols'
import { Error } from './report'

export enum TestStatus {
    pending = 'Ожидание',
    execution = 'Исполнение',
    passed = 'Успешно',
    failed = 'Ошибка',
    broken = 'Сломан',
    skipped = 'Пропущен',
    notImplemented = 'НеРеализован',
}

export class TestDefinition {
    status: TestStatus = TestStatus.pending
    present: string
    method: string
    duration: number = 0
    lineNumber: number
    errors?:Error[]

    constructor(method: Method) {
        this.method = method.name
        this.lineNumber = method.startLine
        this.present = this.method
    }

    updateStatus(status: TestStatus, duration: number | undefined) {
        this.status = status
        this.duration = duration || this.duration
    }
}