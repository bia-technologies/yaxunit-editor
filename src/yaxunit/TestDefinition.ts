import { IEvent, Emitter } from 'monaco-editor'
import { Method } from '../bsl/Symbols'

export enum TestStatus {
    pending = 'Ожидание',
    execution = 'Исполнение',
    passed = 'Успешно',
    failed = 'Ошибка',
    broken = 'Сломан',
    skipped = 'Пропущен',
    notImplemented = 'НеРеализован',
}

export interface TestResult {
    status: TestStatus,
    present: string,
    method: string,
    duration: number,
    message: string,
    trace: string
}

export class TestDefinition {
    status: TestStatus = TestStatus.pending
    present: string
    method: string
    duration: number = 0
    lineNumber: number
    message: string | undefined
    trace: string | undefined

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

export class TestsModel {
    private readonly tests: TestDefinition[] = []
    emitter: Emitter<TestsModel> = new Emitter()
    getTests() {
        return this.tests
    }
    updateTests(methods: Method[]) {
        this.tests.length = 0
        methods.forEach(m => {
            this.tests.push(new TestDefinition(m))
        })
        this.emitter.fire(this)
    }

    updateTestsStatus(result: TestResult[]) {
        result.forEach(i=>this.updateTest(i))
        this.emitter.fire(this)
    }

    private updateTest(result:TestResult){
        const test = this.tests.find(t=>t.method === result.method)
        if(!test){
            return
        }

        test.status = result.status
        test.duration = result.duration
        test.message = result.message
        test.trace = result.trace
    }

    onDidChangeContent: IEvent<TestsModel> = (listener) => {
        return this.emitter.event(listener)
    }
}