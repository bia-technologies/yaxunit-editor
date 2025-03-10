declare module 'onec-syntaxparser' {
    export class Parser {
        constructor()
        parse(source: string):OspModule
    }
    
    interface OspModule {
        context: {
            ModuleVars:{[index:string]:any}
        }
        getMethod(methodName: string)
        getMethodsTable():Table
        getMethodByLineNumber(lineNo: number)
        getActiveLineMethod()
    }
    
    interface Table{
        find(): OspMethod[]
    }
    
    interface InnerParam {
        name:string
        byval:boolean
        default:string
    }
    
    interface InnerMethod{
        name:string
        isproc:boolean
        line:number
        endline:number
        context:string
        isexport:number,
        _method
    }
    export interface OspMethod{
        name:string
        isproc:boolean
        line:number
        endline:number
        context:string
        isexport:boolean,
        _method
    }
    export default Parser;
}
