import { Stmt } from "../frontend/ast.ts";
import Environment from "./environment.ts";

/**
 * Possible runtime value types
 */
export type ValueType =
    | "null"
    | "number"
    | "string"
    | "boolean"
    | "object"
    | "internal-call"
    | "function"
    | "array";

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
 * String value type in the language
 */
export interface StringValue extends RuntimeValue {
    type: "string";
    value: string;
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

export interface ArrayValue extends RuntimeValue {
    type: "array";
    elements: RuntimeValue[];
}

/**
 * Internal calls in the language (e.g. print())
 */

export type FunctionCall = (
    args: RuntimeValue[],
    env: Environment,
) => RuntimeValue;
export interface InternalCallValue extends RuntimeValue {
    type: "internal-call";
    call: FunctionCall;
}

/**
 * User defined functions
 */

export interface FunctionValue extends RuntimeValue {
    type: "function";
    name: string;
    parameters: string[];
    declarationEnv: Environment;
    body: Stmt[];
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

/**
 * Creates an internal call
 */
export function MakeInternalCall(call: FunctionCall) {
    return { type: "internal-call", call } as InternalCallValue;
}

/**
 * Creates a string value
 */
export function MakeString(s = "") {
    return { type: "string", value: s } as StringValue;
}

/**
 * Creates an array value
 */
export function MakeArray(elements: RuntimeValue[] = []) {
    return { type: "array", elements } as ArrayValue;
}
