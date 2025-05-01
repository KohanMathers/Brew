import { ValueType, RuntimeValue } from "./values.ts"
import { NodeType, Stmt } from "../frontend/ast.ts"

export function Evaluate (astNode:Stmt): RuntimeValue {
    switch (astNode.kind) {
        case "NumericLiteral":
            return { value: ((astNode as NumericLiteral.value)), type: "number" } as NumberValue;

        default:
            return { value: "null", type: "null" } as NullValue;
    }    
}