import { IDisposable } from "monaco-editor-core";
import { Query } from "web-tree-sitter";
import { createQuery } from "./bslAst";

export class Queries implements IDisposable {
    methodDefinitions?: Query
    assignments?: Query
    varDefinitions?: Query
    private createdQueries: Query[] = []

    methodDefinitionsQuery() {
        if (!this.methodDefinitions) {
            this.methodDefinitions = this.createQuery(
                `[(function_definition name: (identifier) @name parameters: (parameters) @parameters (EXPORT_KEYWORD) @export) (function_definition name: (identifier) @name parameters: (parameters) @parameters)] @function
[(procedure_definition name: (identifier) @name parameters: (parameters) @parameters (EXPORT_KEYWORD) @export) (procedure_definition name: (identifier) @name parameters: (parameters) @parameters )] @procedure`)
        }
        return this.methodDefinitions
    }
    varDefinitionsQuery() {
        if (!this.varDefinitions) {
            this.varDefinitions = this.createQuery(
                '(var_definition var_name: (identifier) @name) @var')
        }
        return this.varDefinitions
    }

    methodVarsQuery() {
        if (!this.assignments) {
            this.assignments = this.createQuery(
                `(assignment_statement left: (identifier) @name right: (expression)@expression)
(var_statement var_name: (identifier) @name)
(parameter name: (identifier) @name)`)
        }
        return this.assignments
    }

    createQuery(queryText: string) {
        const query = createQuery(queryText)
        this.createdQueries.push(query)
        return query
    }

    dispose(): void {
        this.createdQueries.forEach(q => q.delete())
    }
}