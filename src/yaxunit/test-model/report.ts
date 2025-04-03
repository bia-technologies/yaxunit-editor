export type Report = TestSuiteResult[]

export interface TestSuiteResult extends BaseItem {
    context: string,
    package?: string,
    testcase: TestCaseResult[]
}

export interface TestCaseResult extends BaseItem{
    classname: string,
    failure?: Failure[],
    skipped?: ReportErrorInfo[]
}

interface BaseItem {
    name: string,
    error?: ReportErrorInfo[],
    time: number,
}

export interface ReportErrorInfo {
    context?:string,
    message: string,
    trace?: string,
    type?: string
}
export interface Failure extends ReportErrorInfo {
    actual: string,
    expected: string
}