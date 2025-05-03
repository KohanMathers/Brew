import {
    ValueType as _ValueType,
    RuntimeValue,
    NumberValue,
} from "./values.ts";

import {
    NodeType as _NodeType,
    Stmt,
    Program,
    BinaryExpression,
    NumericLiteral,
    Identifier,
    VariableDeclaration,
    AssignmentExpression,
} from "../frontend/ast.ts";

import { InterpretError } from "../frontend/errors.ts";
import Environment from "./environment.ts";

import {
    EvaluateProgram,
    EvaluateVariableDeclaration,
} from "../frontend/eval/statements.ts";

import {
    EvaluateAssignment,
    EvaluateBinaryExpression,
    EvaluateIdentifier,
} from "../frontend/eval/expressions.ts";

export function Evaluate(astNode: Stmt, env: Environment): RuntimeValue {
    switch (astNode.kind) {
        case "NumericLiteral":
            return {
                type: "number",
                value: (astNode as NumericLiteral).value,
            } as NumberValue;
        case "Identifier":
            return EvaluateIdentifier(astNode as Identifier, env);
        case "AssignmentExpression":
            return EvaluateAssignment(astNode as AssignmentExpression, env);
        case "BinaryExpression":
            return EvaluateBinaryExpression(astNode as BinaryExpression, env);
        case "Program":
            return EvaluateProgram(astNode as Program, env);
        case "VariableDeclaration":
            return EvaluateVariableDeclaration(
                astNode as VariableDeclaration,
                env,
            );
        default:
            throw new InterpretError(
                `The following AST node has not yet been setup for interpretation: ${astNode.kind}`,
            );
    }
}
