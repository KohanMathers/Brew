export type ValueType = "null" | "number" | "boolean" | "object";

export interface RuntimeValue {
    type: ValueType;
}

export interface NullValue extends RuntimeValue {
    type: "null";
    value: null;
}

export interface NumberValue extends RuntimeValue {
    type: "number";
    value: number;
}

export interface BoolValue extends RuntimeValue {
    type: "boolean";
    value: boolean;
}

export interface ObjectValue extends RuntimeValue {
    type: "object";
    properties: Map<string, RuntimeValue>;
}

export function MakeNumber(n = 0) {
    return { type: "number", value: n } as NumberValue;
}

export function MakeNull() {
    return { type: "null", value: null } as NullValue;
}

export function MakeBool(b = true) {
    return { type: "boolean", value: b } as BoolValue;
}
