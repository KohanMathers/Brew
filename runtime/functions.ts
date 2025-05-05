import {
    BoolValue,
    MakeNull,
    MakeNumber,
    NumberValue,
    RuntimeValue,
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
            case "number":
                return (arg as NumberValue).value;
            case "boolean":
                return (arg as BoolValue).value;
            case "null":
                return "null";
            case "object":
                return "{object}";
            case "internal-call":
                return "{function}";
            default:
                return arg;
        }
    });

    console.log(...values);
    return MakeNull();
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
    } else {
        response = `Nat doesn't understand "${input}", so she just smiles and nods as you yap away about it.`;
    }

    console.log(response);
    return MakeNull();
}
