export type Report = TestSuiteResult[]

export interface TestSuiteResult extends BaseItem {
    context: string,
    package?: string,
    testcase: TestCaseResult[]
}

export interface TestCaseResult extends BaseItem{
    classname: string,
    failure?: Failure[],
    skipped?: Error[]
}

interface BaseItem {
    name: string,
    error?: Error[],
    time: number,
}

export interface Error {
    context?:string,
    message: string,
    trace?: string,
    type?: string
}
export interface Failure extends Error {
    actual: string,
    expected: string
}