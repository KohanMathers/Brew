export type NodeType =
    | "Program"
    | "VariableDeclaration"
    | "AssignmentExpression"
    | "Property"
    | "ObjectLiteral"
    | "NumericLiteral"
    | "Identifier"
    | "BinaryExpression";

export interface Stmt {
    kind: NodeType;
}

export interface Program extends Stmt {
    kind: "Program";
    body: Stmt[];
}

export interface VariableDeclaration extends Stmt {
    kind: "VariableDeclaration";
    constant: boolean;
    identifier: string;
    value?: Expression;
}

export interface Expression extends Stmt {}

export interface AssignmentExpression extends Expression {
    kind: "AssignmentExpression";
    assignee: Expression;
    value: Expression;
}

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

export interface Property extends Expression {
    kind: "Property";
    key: string;
    value?: Expression;
}

export interface ObjectLiteral extends Expression {
    kind: "ObjectLiteral";
    properties: Property[];
}
