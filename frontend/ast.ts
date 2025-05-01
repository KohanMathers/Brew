export type NodeType = 
    | "Program" 
    | "NumericLiteral"
    | "NullLiteral"
    | "Identifier" 
    | "BinaryExpression";

export interface Stmt {
    kind: NodeType;
}

export interface Program extends Stmt {
    kind: "Program";
    body: Stmt[];
}

export interface Expression extends Stmt {}

export interface BinaryExpression extends Expression {
    kind: "BinaryExpression";
    left: Expression;
    right: Expression;
    operator: string;
}

export interface Identifier extends Expression {
    kind: "Identifier";
    symbol: string;
}

export interface NumericLiteral extends Expression {
    kind: "NumericLiteral";
    value: number;
}

export interface NullLiteral extends Expression {
    kind: "NullLiteral";
    value: "null";
}