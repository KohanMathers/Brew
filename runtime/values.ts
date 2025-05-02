export type ValueType = "null" | "number";

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

export function MakeNumber(n = 0) {
    return { type: "number", value: n } as NumberValue;
}

export function MakeNull() {
    return { type: "null", value: null } as NullValue;
}
