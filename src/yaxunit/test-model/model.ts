import { IEvent, Emitter, IPosition } from 'monaco-editor'

import { TestDefinition, TestStatus } from './types'
import { Method } from '@/common/codeModel'
import { Report, TestCaseResult, TestSuiteResult } from './report'

export const ROOT_METHOD = 'ИсполняемыеСценарии'

export class TestsModel {
    private tests: TestDefinition[] = []
    private errors: string[] = []
    emitter: Emitter<TestsModel> = new Emitter()
    lastReport?: Report

    getTests() {
        return this.tests
    }

    getErrors() {
        return this.errors
    }

    updateTests(methods: Method[], getPosition:(offset:number)=>IPosition) {
        let changed = false
        methods.forEach(m => {
            const test = this.findTest(m.name)
            const methodLine = getPosition(m.startOffset).lineNumber
            if (test) {
                if (test.lineNumber !== methodLine) {
                    test.lineNumber = methodLine
                    changed = true
                }
            } else {
                this.tests.push(new TestDefinition(m, methodLine))
                changed = true
            }
        })
        const forDeleting: TestDefinition[] = []
        this.tests.forEach(t => {
            if (!methods.find(m => m.name === t.method)) {
                forDeleting.push(t)
            }
        })

        if (forDeleting.length) {
            this.tests = this.tests.filter(t => forDeleting.indexOf(t) == -1)
            changed = true
        }
        if (changed) {
            this.emitter.fire(this)
        }
    }

    onRunTest(methodName: string) {
        if (methodName === ROOT_METHOD) {
            this.tests.forEach(t => t.status = TestStatus.execution)
        } else {
            var m = this.findTest(methodName);
            if (m) {
                m.status = TestStatus.execution;
            }
        }
        this.emitter.fire(this)
    }

    loadReport(result: Report) {
        this.lastReport = result

        this.tests.forEach(this.cleanTest)
        result.forEach(s => this.loadSuite(s))
        this.emitter.fire(this)
    }

    private loadSuite(suite: TestSuiteResult): void {
        suite.testcase.forEach(t => this.loadTestCase(suite, t))
    }

    private loadTestCase(suite: TestSuiteResult, test: TestCaseResult): void {
        var method = this.findTest(test.name)
        if (!method) {
            return
        }

        if (test.error && test.error.length) {
            method.status = TestStatus.broken
        } else if (test.failure && test.failure.length) {
            method.status = TestStatus.failed
        } else if (test.skipped && test.skipped.length) {
            method.status = TestStatus.skipped
        } else {
            method.status = TestStatus.passed
        }

        if (method.status !== TestStatus.passed) {
            var errors = method.errors ? method.errors : method.errors = []
            if (test.error) {
                test.error.forEach(e => { errors.push(e); e.context = suite.context })
            }
            if (test.failure) {
                test.failure.forEach(e => { errors.push(e); e.context = suite.context })
            }
            if (test.skipped) {
                test.skipped.forEach(e => { errors.push(e); e.context = suite.context })
            }
        }
        method.duration += test.time * 1000
    }

    private cleanTest(test: TestDefinition): void {
        test.duration = 0
        test.status = TestStatus.pending
        test.errors = []
    }

    private findTest(methodName: string): TestDefinition | undefined {
        return this.tests.find(t => t.method === methodName)
    }

    onDidChangeContent: IEvent<TestsModel> = (listener) => {
        return this.emitter.event(listener)
    }
}