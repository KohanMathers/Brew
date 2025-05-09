import Environment from "./environment.ts";
import { Evaluate } from "./interpreter.ts";
import {
    BoolValue,
    FunctionValue,
    InternalCallValue,
    MakeNull,
    MakeNumber,
    NumberValue,
    RuntimeValue,
    StringValue,
} from "./values.ts";

/**
 * Return the current unix timestamp as a number
 */
export function TimeFunction() {
    return MakeNumber(Date.now());
}

/**
 * Prints the values of the specified args
 */
export function PrintFunction(args: RuntimeValue[]): RuntimeValue {
    const values = args.map((arg) => {
        switch (arg.type) {
            case "string":
                return (arg as StringValue).value;
            case "number":
                return (arg as NumberValue).value;
            case "boolean":
                return (arg as BoolValue).value;
            case "null":
                return "null";
            case "object":
                return "{object}";
            case "internal-call":
            case "function":
                return "{function}";
            default:
                return arg;
        }
    });

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
 * An esoteric easter egg function in reference to my girlfriend
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

    console.log(response);
    return MakeNull();
}
