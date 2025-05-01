import { ValueType, RuntimeValue } from "./values.ts"
import { NodeType, Stmt } from "../frontend/ast.ts"
import { InterpretError } from "../frontend/errors.ts";

export function Evaluate (astNode:Stmt): RuntimeValue {
    switch (astNode.kind) {
        case "NumericLiteral":
            return { value: ((astNode as NumericLiteral.value)), type: "number" } as NumberValue;
        case "NullLiteral":
            return { value: "null", type: "null" } as NullValue;

        default:
            throw new InterpretError(
                `The following AST node has not yet been setup for interpretation: ${astNode.kind}`
            );
    }    
}