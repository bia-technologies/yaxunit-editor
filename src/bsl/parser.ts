import Parser from 'onec-syntaxparser'
import { Module } from './Symbols'

export function parse(source: string): Module {
    const result = new Parser().parse(source)
    return {
        vars: Object.entries(result.context.ModuleVars).map(([k, v])=>{
            return {
                name: k,
                isExport: v.isExport
            }
        }),
        methods: result.getMethodsTable().find().map(m => {
            return {
                name: m.name,
                startLine: m.line + 1,
                startColumn: 0,
                endLine: m.endline + 1,
                endColumn: 0,
                isExport: m.isexport,
                isProc: m.isproc,
                params: m._method.Params.map((p:any)=>{return {
                    name: p.name,
                    default: p.default,
                    byVal: p.byval
                }}),
                vars: m._method.DeclaredVars.map((v:any)=>{return {
                    name: v
                }}),
                autoVars: m._method.AutomaticVars.map((v:any)=>{return {
                    name: v
                }})
            }
        })
    }
}