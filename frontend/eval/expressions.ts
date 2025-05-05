import { Evaluate } from "../../runtime/interpreter.ts";
import {
    NumberValue,
    RuntimeValue,
    MakeNull,
    ObjectValue,
    InternalCallValue,
    FunctionValue,
    BoolValue,
    MakeString,
    StringValue,
} from "../../runtime/values.ts";
import {
    AssignmentExpression,
    BinaryExpression,
    CallExpression,
    Identifier,
    ObjectLiteral,
} from "../ast.ts";
import Environment from "../../runtime/environment.ts";
import { AssignmentError, CalculationError, FunctionError } from "../errors.ts";

/**
 * Evaluates a binary expression
 * Handles evaluation of binary operations between two operands.
 * Supports numeric operations like addition, subtraction, multiplication, etc.
 */
export function EvaluateBinaryExpression(
    binop: BinaryExpression,
    env: Environment,
): RuntimeValue {
    const left = Evaluate(binop.left, env);
    const right = Evaluate(binop.right, env);

    // Handle string concatenation
    if (
        binop.operator === "+" &&
        (left.type === "string" || right.type === "string")
    ) {
        // Convert values to strings for concatenation
        const leftStr =
            left.type === "string"
                ? (left as StringValue).value
                : valueToString(left);

        const rightStr =
            right.type === "string"
                ? (right as StringValue).value
                : valueToString(right);

        return MakeString(leftStr + rightStr);
    }

    // Check if both operands are numbers before evaluating the binary operation
    if (left.type === "number" && right.type === "number") {
        return EvaluateNumericBinaryExpression(
            left as NumberValue,
            right as NumberValue,
            binop.operator,
        );
    }

    // Return null for unsupported operand types
    return MakeNull();
}

/**
 * Evaluates a numeric binary expression
 * Handles arithmetic operations on two numeric values.
 * Throws an error for division by zero or unsupported operators.
 */
function EvaluateNumericBinaryExpression(
    left: NumberValue,
    right: NumberValue,
    operator: string,
): NumberValue {
    const leftVal = left.value;
    const rightVal = right.value;

    let result: number;

    // Switch case to evaluate different binary operators
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

    // Return the result as a NumberValue
    return {
        type: "number",
        value: result,
    } as NumberValue;
}

/**
 * Evaluates an identifier expression
 * Looks up the value of a variable by its identifier in the current environment.
 */
export function EvaluateIdentifier(
    ident: Identifier,
    env: Environment,
): RuntimeValue {
    const val = env.lookupVariable(ident.symbol);
    return val;
}

/**
 * Evaluates an object expression
 * Evaluates all properties of an object and stores them in a map.
 * Handles both evaluated properties and variables from the environment.
 */
export function EvaluateObjectExpression(
    obj: ObjectLiteral,
    env: Environment,
): RuntimeValue {
    const object = { type: "object", properties: new Map() } as ObjectValue;
    for (const { key, value } of obj.properties) {
        // Evaluate property value or look it up in the environment
        const runtimeValue =
            value == undefined ? env.lookupVariable(key) : Evaluate(value, env);
        object.properties.set(key, runtimeValue);
    }
    return object;
}

/**
 * Evaluates a function call expression.
 * Resolves and evaluates all arguments.
 * Verifies the function is callable.
 * Invokes the function and returns the result.
 */
export function EvaluateCallExpression(
    expression: CallExpression,
    env: Environment,
): RuntimeValue {
    const args = expression.args.map((arg) => Evaluate(arg, env));
    const func = Evaluate(expression.caller, env);

    if (func.type == "internal-call") {
        const result = (func as InternalCallValue).call(args, env);
        return result;
    }

    if (func.type == "function") {
        const fn = func as FunctionValue;
        const scope = new Environment(fn.declarationEnv);

        for (let i = 0; i < fn.parameters.length; i++) {
            const varname = fn.parameters[i];
            scope.declareVariable(varname, args[i], false);
        }

        let result: RuntimeValue = MakeNull();

        for (const stmt of fn.body) {
            result = Evaluate(stmt, scope);
        }

        return result;
    }

    throw new FunctionError(
        `Cannot call value that is not a function: ${JSON.stringify(func)}`,
    );
}

/**
 * Evaluates an assignment expression
 * Assigns a value to a variable in the environment.
 * Throws an error if the assignment target is not an identifier.
 */
export function EvaluateAssignment(
    node: AssignmentExpression,
    env: Environment,
): RuntimeValue {
    // Ensure the assignee is an identifier
    if (node.assignee.kind != "Identifier") {
        throw new AssignmentError(
            `Invalid assignment target: ${JSON.stringify(node.assignee)}`,
        );
    }

    const varname = (node.assignee as Identifier).symbol;
    return env.assignVariable(varname, Evaluate(node.value, env));
}

/**
 * Helper function to convert runtime values to strings
 */

function valueToString(value: RuntimeValue): string {
    switch (value.type) {
        case "string":
            return (value as StringValue).value;
        case "number":
            return (value as NumberValue).value.toString();
        case "boolean":
            return (value as BoolValue).value.toString();
        case "null":
            return "null";
        case "object":
            return "[object]";
        case "function":
        case "internal-call":
            return "[function]";
        default:
            return "[unknown]";
    }
}
