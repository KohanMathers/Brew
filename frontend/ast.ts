/**
 * All the possible AST node types
 */
export type NodeType =
    | "Program"
    | "VariableDeclaration"
    | "FunctionDeclaration"
    | "AssignmentExpression"
    | "MemberExpression"
    | "CallExpression"
    | "Property"
    | "ObjectLiteral"
    | "NumericLiteral"
    | "StringLiteral"
    | "Identifier"
    | "BinaryExpression"
    | "ComparisonExpression"
    | "ForExpression"
    | "WhileExpression";

/**
 * Base interface for any node in the syntax tree
 */
export interface Stmt {
    kind: NodeType;
}

/**
 * Base interface for expressions
 */
export interface Expression extends Stmt {}

/**
 * The root of the AST, the Program node
 */
export interface Program extends Stmt {
    kind: "Program";
    body: Stmt[];
}

// ===== Declaration Nodes =====

/**
 * Variable declaration node
 */
export interface VariableDeclaration extends Stmt {
    kind: "VariableDeclaration";
    constant: boolean;
    identifier: string;
    value?: Expression;
}

/**
 * Function declaration node
 */
export interface FunctionDeclaration extends Stmt {
    kind: "FunctionDeclaration";
    parameters: string[];
    name: string;
    body: Stmt[];
    async: boolean;
}

// ===== Expression Nodes =====

/**
 * Assignment expression node
 */
export interface AssignmentExpression extends Expression {
    kind: "AssignmentExpression";
    assignee: Expression;
    value: Expression;
}

/**
 * Binary operation expression node
 */
export interface BinaryExpression extends Expression {
    kind: "BinaryExpression";
    left: Expression;
    right: Expression;
    operator: string;
}

/**
 * Comparision operation expression node
 */
export interface ComparisonExpression extends Expression {
    kind: "ComparisonExpression";
    left: Expression;
    right: Expression;
    operator: string;
}

/**
 * Member expression (accessing object properties)
 */
export interface MemberExpression extends Expression {
    kind: "MemberExpression";
    object: Expression;
    property: Expression;
    computed: boolean;
}

/**
 * Function call expression node
 */
export interface CallExpression extends Expression {
    kind: "CallExpression";
    args: Expression[];
    caller: Expression;
}

/**
 * For expression node
 */
export interface ForExpression extends Stmt {
    kind: "ForExpression";
    amount: Expression;
    body: Stmt[];
}

/**
 * While expression node
 */
export interface WhileExpression extends Stmt {
    kind: "WhileExpression";
    condition: Expression;
    body: Stmt[];
}

// ===== Literal Nodes =====

/**
 * Identifier reference node
 */
export interface Identifier extends Expression {
    kind: "Identifier";
    symbol: string;
}

/**
 * Numeric literal value node
 */
export interface NumericLiteral extends Expression {
    kind: "NumericLiteral";
    value: number;
}

/**
 * String literal value node
 */
export interface StringLiteral extends Expression {
    kind: "StringLiteral";
    value: string;
}

/**
 * Property key-value pair for objects
 */
export interface Property extends Expression {
    kind: "Property";
    key: string;
    value?: Expression;
}

/**
 * Object literal node
 */
export interface ObjectLiteral extends Expression {
    kind: "ObjectLiteral";
    properties: Property[];
}
