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
