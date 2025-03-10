import { Lexer } from "chevrotain";
import { allTokens } from "./tokens";

export const BSLLexer = new Lexer(allTokens, { ensureOptimizations: true });

