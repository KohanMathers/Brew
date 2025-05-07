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
    MakeBool,
} from "../../runtime/values.ts";
import {
    AssignmentExpression,
    BinaryExpression,
    CallExpression,
    ComparisonExpression,
    Identifier,
    ObjectLiteral,
} from "../ast.ts";
import Environment from "../../runtime/environment.ts";
import {
    AssignmentError,
    CalculationError,
    ComparisonError,
    FunctionError,
} from "../errors.ts";

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

    if (
        binop.operator === "+" &&
        (left.type === "string" || right.type === "string")
    ) {
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
 * Evaluates a comparison expression
 * Handles evaluation of comparison operations between two operands.
 * Supports numeric comparisons
 */
export function EvaluateComparisonExpression(
    compop: ComparisonExpression,
    env: Environment,
): RuntimeValue {
    const left = Evaluate(compop.left, env);
    const right = Evaluate(compop.right, env);

    if (left.type === "string" && right.type === "string") {
        const leftStr = (left as StringValue).value;
        const rightStr = (right as StringValue).value;

        return EvaluateStringComparisonExpression(
            leftStr,
            rightStr,
            compop.operator,
        );
    }

    if (left.type === "number" && right.type === "number") {
        return EvaluateNumericComparisonExpression(
            left as NumberValue,
            right as NumberValue,
            compop.operator,
        );
    }

    if (compop.operator === "==" || compop.operator === "!=") {
        const isEqual =
            left.type === right.type &&
            valueToString(left) === valueToString(right);

        return MakeBool(compop.operator === "==" ? isEqual : !isEqual);
    }

    return MakeNull();
}

/**
 * Evaluates a string comparison expression
 */
function EvaluateStringComparisonExpression(
    leftStr: string,
    rightStr: string,
    operator: string,
): BoolValue {
    let result: boolean;

    switch (operator) {
        case "==":
            result = leftStr === rightStr;
            break;
        case "!=":
            result = leftStr !== rightStr;
            break;
        case ">=":
            result = leftStr >= rightStr;
            break;
        case "<=":
            result = leftStr <= rightStr;
            break;
        case ">":
            result = leftStr > rightStr;
            break;
        case "<":
            result = leftStr < rightStr;
            break;
        default:
            throw new ComparisonError(
                `Unsupported operator for strings: ${operator}`,
            );
    }

    return MakeBool(result);
}

/**
 * Evaluates a numeric comparison expression
 * Handles comparison operations on two numeric values.
 */
function EvaluateNumericComparisonExpression(
    left: NumberValue,
    right: NumberValue,
    operator: string,
): BoolValue {
    const leftVal = left.value;
    const rightVal = right.value;

    let result: boolean;

    switch (operator) {
        case "==":
            result = leftVal === rightVal;
            break;
        case "!=":
            result = leftVal !== rightVal;
            break;
        case ">=":
            result = leftVal >= rightVal;
            break;
        case "<=":
            result = leftVal <= rightVal;
            break;
        case ">":
            result = leftVal > rightVal;
            break;
        case "<":
            result = leftVal < rightVal;
            break;
        default:
            throw new ComparisonError(`Unsupported operator: ${operator}`);
    }

    return MakeBool(result);
}

/**
 * Special handling for the if function to prevent eager evaluation
 * @param callExpr The call expression for the if statement
 * @param env The current environment
 */
function EvaluateIfExpression(
    callExpr: CallExpression,
    env: Environment,
): RuntimeValue {
    if (callExpr.args.length < 2) {
        throw new FunctionError(
            "'if' requires at least 2 arguments (condition, then)",
        );
    }

    const condition = Evaluate(callExpr.args[0], env);

    let conditionResult = false;
    if (condition.type === "boolean") {
        conditionResult = (condition as BoolValue).value;
    } else if (condition.type === "number") {
        conditionResult = (condition as NumberValue).value !== 0;
    } else if (condition.type === "string") {
        conditionResult = (condition as StringValue).value !== "";
    } else if (condition.type === "null") {
        conditionResult = false;
    } else {
        conditionResult = true;
    }

    if (conditionResult) {
        // Execute the 'then' branch
        return Evaluate(callExpr.args[1], env);
    } else if (callExpr.args.length >= 3) {
        // Execute the 'else' branch if provided
        return Evaluate(callExpr.args[2], env);
    }

    return MakeNull();
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
 * Checks for if function
 * Resolves and evaluates all arguments.
 * Verifies the function is callable.
 * Invokes the function and returns the result.
 */
export function EvaluateCallExpression(
    expression: CallExpression,
    env: Environment,
): RuntimeValue {
    if (
        expression.caller.kind === "Identifier" &&
        (expression.caller as Identifier).symbol === "if"
    ) {
        return EvaluateIfExpression(expression, env);
    }

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
