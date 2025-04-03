import { Method } from '@/common/codeModel'
import { ReportErrorInfo } from './report'

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
    errors?: ReportErrorInfo[]

    constructor(method: Method, lineNumber: number) {
        this.method = method.name
        this.lineNumber = lineNumber
        this.present = this.method
    }

    updateStatus(status: TestStatus, duration: number | undefined) {
        this.status = status
        this.duration = duration || this.duration
    }
}