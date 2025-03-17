import { BslCodeModel } from "../model";

export interface ModelCalculator {
    calculate(model: BslCodeModel): void;
}