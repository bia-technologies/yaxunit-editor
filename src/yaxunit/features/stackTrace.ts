export function parseTrace(traceMessage: string): TraceInfo[] {
    const pattern = /^{(.*)\((\d+)\)}:([^\n]*)$/gmi
    let match
    let startPosition = 0
    const errors = []
    while (match = pattern.exec(traceMessage)) {
        errors.push({
            module: match[1],
            line: parseInt(match[2]),
            message: traceMessage.substring(startPosition, pattern.lastIndex),
            shortMessage: match[3]
        })
        startPosition = pattern.lastIndex
    }

    return errors
}

export interface TraceInfo {
    module: string,
    line: number,
    message: string,
    shortMessage: string
}