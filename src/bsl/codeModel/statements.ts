import { BaseSymbol } from "@/common/codeModel/base";
import { PropertyAccess } from "./baseSymbols";
import { Variable } from "@/common/codeModel";

export class AssignmentStatement extends BaseSymbol {
    variable?: Variable | PropertyAccess
    expression?: BaseSymbol
}

export class ReturnStatement extends BaseSymbol {
    expression?: BaseSymbol
}