import { ValueType, RuntimeValue, NumberValue, NullValue } from "./values.ts"
import { NodeType, Stmt, Program, BinaryExpression, NumericLiteral } from "../frontend/ast.ts"
import { InterpretError, CalculationError } from "../frontend/errors.ts";

function EvaluateProgram (program: Program): RuntimeValue {
    let lastEvaluated: RuntimeValue = { type: "null", value: "null" } as NullValue;
    
    for (const statement of program.body) {
        lastEvaluated = Evaluate(statement);
    }
    
    return lastEvaluated;
}

function EvaluateNumericBinaryExpression(left: NumberValue, right: NumberValue, operator: string): NumberValue {
    const leftVal = left.value;
    const rightVal = right.value;
    
    let result: number;

    switch (operator) {
        case "+":
            result = leftVal + rightVal;
            break;
        case "-":
            result = leftVal - rightVal;
            break;
        case "*":
            result = leftVal * rightVal;
            break;
        case "/":
            if (rightVal === 0) {
                throw new CalculationError("Division by zero");
            }
            result = leftVal / rightVal;
            break;
        case "%":
            result = leftVal % rightVal;
            break;
        default:
            throw new CalculationError(`Unsupported operator: ${operator}`);
    }

    return {
        type: "number",
        value: result
    } as NumberValue;
}

function EvaluateBinaryExpression(binop: BinaryExpression): RuntimeValue {
    const left = Evaluate(binop.left);
    const right = Evaluate(binop.right);

    if (left.type === "number" && right.type === "number") {
        return EvaluateNumericBinaryExpression(
            left as NumberValue,
            right as NumberValue,
            binop.operator
        );
    }

    return { type: "null", value: "null" } as NullValue;
}

export function Evaluate(astNode: Stmt): RuntimeValue {
    switch (astNode.kind) {
        case "NumericLiteral":
            return {
                type: "number",
                value: (astNode as NumericLiteral).value
            } as NumberValue;
        case "NullLiteral":
            return { type: "null", value: "null" } as NullValue;
        case "BinaryExpression":
            return EvaluateBinaryExpression(astNode as BinaryExpression);
        case "Program":
            return EvaluateProgram(astNode as Program);
        default:
            throw new InterpretError(
                `The following AST node has not yet been setup for interpretation: ${astNode.kind}`
            );
    }    
}