import { IEvent, Emitter } from 'monaco-editor-core'
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

export interface RunResult {
    tests: TestResult[]
    errors?: string[]
}

export interface TestResult {
    status: TestStatus,
    method: string,
    duration: number,
    message?: string
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
    private errors: string[] = []
    emitter: Emitter<TestsModel> = new Emitter()
    getTests() {
        return this.tests
    }
    getErrors() {
        return this.errors
    }
    updateTests(methods: Method[]) {
        let changed = false
        methods.forEach(m => {
            const test = this.findTest(m.name)
            if (test) {
                test.lineNumber = m.startLine
            } else {
                this.tests.push(new TestDefinition(m))
                changed = true
            }
        })
        if (changed) {
            this.emitter.fire(this)
        }
    }

    updateTestsStatus(result: RunResult) {
        result.tests.forEach(i => this.updateTest(i))
        if(result.errors){
            this.errors = result.errors
        }
        this.emitter.fire(this)
    }

    private updateTest(result: TestResult) {
        const test = this.findTest(result.method)
        if (!test) {
            return
        }

        test.status = result.status
        test.duration = result.duration
        test.message = result.message
    }

    private findTest(methodName: string): TestDefinition | undefined {
        return this.tests.find(t => t.method === methodName)
    }
    onDidChangeContent: IEvent<TestsModel> = (listener) => {
        return this.emitter.event(listener)
    }
}