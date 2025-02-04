export interface Report {
    testsuite:TestSuiteResult[]
}

export interface TestSuiteResult extends BaseItem {
    context: string,
    package: string,
    timestamp: number,
    testcase: TestCaseResult[]
}

export interface TestCaseResult extends BaseItem{
    failure?: Failure[],
    skipped?: Error[]
}

interface BaseItem {
    classname: string,
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