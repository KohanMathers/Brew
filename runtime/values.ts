/**
 * Possible runtime value types
 */
export type ValueType = "null" | "number" | "boolean" | "object";

/**
 * Base interface for all runtime values
 */
export interface RuntimeValue {
    type: ValueType;
}

/**
 * Null value type in the language
 */
export interface NullValue extends RuntimeValue {
    type: "null";
    value: null;
}

/**
 * Number value type in the language
 */
export interface NumberValue extends RuntimeValue {
    type: "number";
    value: number;
}

/**
 * Boolean value type in the language
 */
export interface BoolValue extends RuntimeValue {
    type: "boolean";
    value: boolean;
}

/**
 * Object value type in the language
 */
export interface ObjectValue extends RuntimeValue {
    type: "object";
    properties: Map<string, RuntimeValue>;
}

/**
 * Creates a number value
 */
export function MakeNumber(n = 0) {
    return { type: "number", value: n } as NumberValue;
}

/**
 * Creates a null value
 */
export function MakeNull() {
    return { type: "null", value: null } as NullValue;
}

/**
 * Creates a boolean value
 */
export function MakeBool(b = true) {
    return { type: "boolean", value: b } as BoolValue;
}
