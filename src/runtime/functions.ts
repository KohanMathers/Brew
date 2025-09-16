import Environment from "./environment.ts";
import { Evaluate } from "./interpreter.ts";
import {
    ArrayValue,
    BoolValue,
    FunctionValue,
    InternalCallValue,
    MakeNull,
    MakeNumber,
    MakeString,
    NumberValue,
    RuntimeValue,
    StringValue,
} from "./values.ts";

/**
 * Return the current unix timestamp as a number
 */
export function TimeFunction() {
    let DateNow = Date.now();
    return MakeNumber(Math.floor(DateNow / 1000))
}

/**
 * Prints the values of the specified args
 */
export function PrintFunction(args: RuntimeValue[]): RuntimeValue {
    const values = args.map(valueToString);
    console.log(...values);
    return MakeNull();
}

/**
 * Evaluates a condition and executes appropriate branch
 * First argument is the condition to check
 * Second argument is the function/value to use if condition is true
 * Third (optional) argument is the function/value to use if condition is false
 */
export function IfFunction(
    args: RuntimeValue[],
    env: Environment,
): RuntimeValue {
    // Make sure we have at least a condition and a "then" branch
    if (args.length < 2) {
        console.log(
            "Error: 'if' requires at least 2 arguments (condition, then)",
        );
        return MakeNull();
    }

    const condition = args[0];

    // Evaluate the condition - truthy values are anything except false, null, and 0
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
        // Objects and functions are always truthy
        conditionResult = true;
    }

    // Get the appropriate branch but don't evaluate yet
    const branchToExecute = conditionResult
        ? args.length >= 2
            ? args[1]
            : MakeNull()
        : args.length >= 3
          ? args[2]
          : MakeNull();

    // Execute only the selected branch
    if (branchToExecute.type === "function") {
        const fn = branchToExecute as FunctionValue;
        const scope = new Environment(fn.declarationEnv);

        let result: RuntimeValue = MakeNull();
        for (const stmt of fn.body) {
            result = Evaluate(stmt, scope);
        }
        return result;
    } else if (branchToExecute.type === "internal-call") {
        return (branchToExecute as InternalCallValue).call([], env);
    } else {
        // Otherwise just return the value
        return branchToExecute;
    }
}

/**
 * An esoteric easter egg function in reference to a friend of mine
 */
export function NatFunction(args: RuntimeValue[]): RuntimeValue {
    if (args.length > 1) {
        console.log("Nat only accepts one argument at a time.");
        return MakeNull();
    }

    if (args.length === 0) {
        console.log("Nat needs an input to respond to.");
        return MakeNull();
    }

    const arg = args[0];
    let input: string;

    switch (arg.type) {
        case "string":
            input = (arg as StringValue).value;
            break;
        case "number":
            input = String((arg as NumberValue).value);
            break;
        case "boolean":
            input = String((arg as BoolValue).value);
            break;
        case "null":
            input = "null";
            break;
        case "object":
            input = "{object}";
            break;
        case "internal-call":
            input = "{function}";
            break;
        default:
            input = "unknown";
    }

    let response: string;
    if (input.toLowerCase().includes("save")) {
        response = "Saving...Saved";
    } else if (input.toLowerCase().includes("7")) {
        response = `Nat says that "${input}" does not exist.`;
    } else if (
        input.toLowerCase().includes("4") ||
        input.toLowerCase().includes("2")
    ) {
        response = `Nat says that "${input}" does exist.`;
    } else {
        response = `Nat doesn't understand "${input}", so she just smiles and nods as you yap away about it.`;
    }

    return MakeString(response);
}

export function IntFunction(args: RuntimeValue[]): RuntimeValue {
    if (args.length !== 1) {
        console.log("int() only accepts one argument.");
        return MakeNull();
    }

    const arg = args[0];

    if (arg.type === "number") {
        return arg;
    } else if (arg.type === "string") {
        const str = (arg as StringValue).value;
        const num = parseInt(str, 10);
        return MakeNumber(num);
    } else {
        console.log("int() only accepts numbers or strings.");
        return MakeNull();
    }
}

export function FloatFunction(args: RuntimeValue[]): RuntimeValue {
    if (args.length !== 1) {
        console.log("float() only accepts one argument.");
        return MakeNull();
    }

    const arg = args[0];

    if (arg.type === "number") {
        return arg;
    } else if (arg.type === "string") {
        const str = (arg as StringValue).value;
        const num = parseFloat(str);
        return MakeNumber(num);
    } else {
        console.log("float() only accepts numbers or strings.");
        return MakeNull();
    }
}

export function StringFunction(args: RuntimeValue[]): RuntimeValue {
    if (args.length !== 1) {
        console.log("String only accepts one argument.");
        return MakeNull();
    }

    const arg = args[0];

    if (arg.type === "string") {
        return arg;
    } else if (arg.type === "number") {
        const str = String((arg as NumberValue).value);
        return MakeString(str);
    } else if (arg.type === "boolean") {
        const str = String((arg as BoolValue).value);
        return MakeString(str);
    } else {
        console.log("String only accepts strings or numbers.");
        return MakeNull();
    }
}

export function AbsFunction(args: RuntimeValue[]): RuntimeValue {
    if (args.length != 1) {
        console.log("abs() only accepts one argument.");
        return MakeNull();
    }

    const arg = args[0];

    if (arg.type === "number") {
        const num = (arg as NumberValue).value;
        return MakeNumber(Math.abs(num));
    } else {
        console.log("abs() only accepts numbers.");
        return MakeNull();
    }
}

export function RoundFunction(args: RuntimeValue[]): RuntimeValue {
    if (args.length != 1) {
        console.log("round() only accepts one argument.");
        return MakeNull();
    }

    const arg = args[0];

    if (arg.type === "number") {
        const num = (arg as NumberValue).value;
        return MakeNumber(Math.round(num));
    } else {
        console.log("round() only accepts numbers.");
        return MakeNull();
    }
}

export function FloorFunction(args: RuntimeValue[]): RuntimeValue {
    if (args.length != 1) {
        console.log("floor() only accepts one argument.");
        return MakeNull();
    }

    const arg = args[0];

    if (arg.type === "number") {
        const num = (arg as NumberValue).value;
        return MakeNumber(Math.floor(num));
    } else {
        console.log("floor() only accepts numbers.");
        return MakeNull();
    }
}

export function CeilFunction(args: RuntimeValue[]): RuntimeValue {
    if (args.length != 1) {
        console.log("ceil() only accepts one argument.");
        return MakeNull();
    }

    const arg = args[0];

    if (arg.type === "number") {
        const num = (arg as NumberValue).value;
        return MakeNumber(Math.ceil(num));
    } else {
        console.log("ceil() only accepts numbers.");
        return MakeNull();
    }
}

// Helper function to convert any RuntimeValue to string
function valueToString(value: RuntimeValue): string {
    switch (value.type) {
        case "string":
            return (value as StringValue).value;
        case "number":
            return String((value as NumberValue).value);
        case "boolean":
            return String((value as BoolValue).value);
        case "null":
            return "null";
        case "object":
            return "{object}";
        case "array": {
            const arrayValue = value as ArrayValue;
            const elements = arrayValue.elements.map(valueToString);
            return `[${elements.join(", ")}]`;
        }
        default:
            return String(value);
    }
}
