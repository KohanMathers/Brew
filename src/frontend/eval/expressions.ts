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
    ArrayValue,
    MakeArray,
    ReturnValue,
} from "../../runtime/values.ts";
import {
    AssignmentExpression,
    BinaryExpression,
    CallExpression,
    ComparisonExpression,
    Identifier,
    ObjectLiteral,
    IfStatement,
    ForExpression,
    WhileExpression,
    ArrayLiteral,
    MemberExpression,
} from "../ast.ts";
import Environment from "../../runtime/environment.ts";
import {
    AssignmentError,
    CalculationError,
    ComparisonError,
    FunctionError,
    InterpretError,
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
 * Evaluates an if statement
 * Evaluates the condition and executes the 'then' or 'else' branches based on the condition result.
 */

export function EvaluateIfStatement(
    ifStmt: IfStatement,
    env: Environment,
): RuntimeValue {
    const condition = Evaluate(ifStmt.condition, env);

    // Evaluate the condition - truthy values are anything that is not null, false, or 0
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
        // Objects and functions are considered truthy
        conditionResult = true;
    }

    let result: RuntimeValue = MakeNull();

    if (conditionResult) {
        // Execute the 'then' branch
        for (const stmt of ifStmt.thenBranch) {
            result = Evaluate(stmt, env);
            if (result.type === "return") {
                return result;
            }
        }
    } else if (ifStmt.elseBranch) {
        // Execute the 'else' branch if provided
        for (const stmt of ifStmt.elseBranch) {
            if (result.type === "return") {
                return result;
            }
            result = Evaluate(stmt, env);
        }
    }

    return result;
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
            if (result.type === "return") {
                return (result as ReturnValue).value;
            }
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
    if (node.assignee.kind === "Identifier") {
        const varname = (node.assignee as Identifier).symbol;
        return env.assignVariable(varname, Evaluate(node.value, env));
    }

    if (node.assignee.kind === "MemberExpression") {
        const memberExpr = node.assignee as MemberExpression;
        const object = Evaluate(memberExpr.object, env);
        const newValue = Evaluate(node.value, env);

        if (object.type === "array" && memberExpr.computed) {
            const arrayValue = object as ArrayValue;
            const indexValue = Evaluate(memberExpr.property, env);

            if (indexValue.type !== "number") {
                throw new AssignmentError(
                    `Array index must be a number, got: ${indexValue.type}`,
                );
            }

            const index = (indexValue as NumberValue).value;

            if (index < 0 || index !== Math.floor(index)) {
                throw new AssignmentError(`Invalid array index: ${index}`);
            }

            while (arrayValue.elements.length <= index) {
                arrayValue.elements.push(MakeNull());
            }

            arrayValue.elements[index] = newValue;
            return newValue;
        }

        // Handle object property assignments
        if (object.type === "object") {
            const objValue = object as ObjectValue;

            let propertyKey: string;

            if (memberExpr.computed) {
                // For obj[key] syntax
                const keyValue = Evaluate(memberExpr.property, env);
                if (keyValue.type === "string") {
                    propertyKey = (keyValue as StringValue).value;
                } else if (keyValue.type === "number") {
                    propertyKey = (keyValue as NumberValue).value.toString();
                } else {
                    throw new AssignmentError(
                        `Property key must be string or number, got: ${keyValue.type}`,
                    );
                }
            } else {
                // For obj.key syntax
                if (memberExpr.property.kind !== "Identifier") {
                    throw new AssignmentError(
                        "Non-computed property access requires identifier",
                    );
                }
                propertyKey = (memberExpr.property as Identifier).symbol;
            }

            objValue.properties.set(propertyKey, newValue);
            return newValue;
        }

        // If we get here, it's an unsupported assignment target type
        throw new AssignmentError(
            `Cannot assign to ${object.type} using member expression`,
        );
    }

    throw new AssignmentError(
        `Invalid assignment target: ${JSON.stringify(node.assignee)}`,
    );
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

/**
 * Evaluates a for expression
 * Handles execution of a for loop with a specified number of iterations.
 */
export function EvaluateForExpression(
    forExpr: ForExpression,
    env: Environment,
): RuntimeValue {
    const amountValue = Evaluate(forExpr.amount, env);

    if (amountValue.type !== "number") {
        throw new FunctionError(
            `Expected a number for 'for' loop amount, but got ${amountValue.type}.`,
        );
    }

    const iterations = (amountValue as NumberValue).value;
    let result: RuntimeValue = MakeNull();

    for (let i = 0; i < iterations; i++) {
        for (const stmt of forExpr.body) {
            result = Evaluate(stmt, env);
            if (result.type === "return") {
                return result;
            }
        }
    }

    return result;
}

/**
 * Evaluates a while expression
 * Handles execution of a while loop with a specified condition.
 */
export function EvaluateWhileExpression(
    whileExpr: WhileExpression,
    env: Environment,
): RuntimeValue {
    let result: RuntimeValue = MakeNull();

    while (true) {
        const conditionValue = Evaluate(whileExpr.condition, env);

        if (conditionValue.type !== "boolean") {
            throw new FunctionError(
                `Expected a boolean for 'while' loop condition, but got a ${conditionValue.type}.`,
            );
        }

        if (!(conditionValue as BoolValue).value) {
            break;
        }

        for (const stmt of whileExpr.body) {
            result = Evaluate(stmt, env);
        }
    }

    return result;
}

/**
 * Evaluates an array expression
 * Evaluates all elements of an array and returns a runtime value representing the array.
 */
export function EvaluateArrayExpression(
    arrayExpr: ArrayLiteral,
    env: Environment,
): ArrayValue {
    const elements = arrayExpr.elements.map((elem) => Evaluate(elem, env));
    return MakeArray(elements);
}

/**
 * Evaluates a member expression for reading values
 * Handles both obj.property and obj[key] syntax for objects and arrays
 */
export function EvaluateMemberExpression(
    expr: MemberExpression,
    env: Environment,
): RuntimeValue {
    const object = Evaluate(expr.object, env);

    if (object.type === "array") {
        const arrayValue = object as ArrayValue;

        if (!expr.computed) {
            throw new InterpretError(
                "Cannot use dot notation on arrays. Use bracket notation instead.",
            );
        }

        const indexValue = Evaluate(expr.property, env);

        if (indexValue.type !== "number") {
            throw new InterpretError(
                `Array index must be a number, got: ${indexValue.type}`,
            );
        }

        const index = (indexValue as NumberValue).value;

        if (index < 0 || index !== Math.floor(index)) {
            throw new InterpretError(`Invalid array index: ${index}`);
        }

        // Return null for out-of-bounds access
        if (index >= arrayValue.elements.length) {
            return MakeNull();
        }

        return arrayValue.elements[index];
    }

    if (object.type === "object") {
        const objValue = object as ObjectValue;
        let propertyKey: string;

        if (expr.computed) {
            // For obj[key] syntax
            const keyValue = Evaluate(expr.property, env);
            if (keyValue.type === "string") {
                propertyKey = (keyValue as StringValue).value;
            } else if (keyValue.type === "number") {
                propertyKey = (keyValue as NumberValue).value.toString();
            } else {
                throw new InterpretError(
                    `Property key must be string or number, got: ${keyValue.type}`,
                );
            }
        } else {
            // For obj.key syntax
            if (expr.property.kind !== "Identifier") {
                throw new InterpretError(
                    "Non-computed property access requires identifier",
                );
            }
            propertyKey = (expr.property as Identifier).symbol;
        }

        // Get the property value, return null if it doesn't exist
        const value = objValue.properties.get(propertyKey);
        return value !== undefined ? value : MakeNull();
    }

    throw new InterpretError(`Cannot access property of ${object.type}`);
}
