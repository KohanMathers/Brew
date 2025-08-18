import { RuntimeValue, NumberValue, StringValue } from "./values.ts";

import {
    Stmt,
    Program,
    BinaryExpression,
    NumericLiteral,
    Identifier,
    VariableDeclaration,
    AssignmentExpression,
    ObjectLiteral,
    CallExpression,
    FunctionDeclaration,
    StringLiteral,
    ComparisonExpression,
    ForExpression,
    WhileExpression,
    IfStatement,
} from "../frontend/ast.ts";

import { InterpretError } from "../frontend/errors.ts";
import Environment from "./environment.ts";

import {
    EvaluateFunctionDeclaration,
    EvaluateProgram,
    EvaluateVariableDeclaration,
} from "../frontend/eval/statements.ts";

import {
    EvaluateAssignment,
    EvaluateBinaryExpression,
    EvaluateComparisonExpression,
    EvaluateCallExpression,
    EvaluateIdentifier,
    EvaluateObjectExpression,
    EvaluateForExpression,
    EvaluateWhileExpression,
    EvaluateIfStatement,
} from "../frontend/eval/expressions.ts";

/**
 * Evaluates the AST node in the given env
 */
export function Evaluate(astNode: Stmt, env: Environment): RuntimeValue {
    switch (astNode.kind) {
        case "NumericLiteral":
            return {
                type: "number",
                value: (astNode as NumericLiteral).value,
            } as NumberValue;

        case "StringLiteral":
            return {
                type: "string",
                value: (astNode as StringLiteral).value,
            } as StringValue;

        case "Identifier":
            return EvaluateIdentifier(astNode as Identifier, env);

        case "ObjectLiteral":
            return EvaluateObjectExpression(astNode as ObjectLiteral, env);

        case "CallExpression":
            return EvaluateCallExpression(astNode as CallExpression, env);

        case "AssignmentExpression":
            return EvaluateAssignment(astNode as AssignmentExpression, env);

        case "BinaryExpression":
            return EvaluateBinaryExpression(astNode as BinaryExpression, env);

        case "ComparisonExpression":
            return EvaluateComparisonExpression(
                astNode as ComparisonExpression,
                env,
            );

        case "Program":
            return EvaluateProgram(astNode as Program, env);

        case "VariableDeclaration":
            return EvaluateVariableDeclaration(
                astNode as VariableDeclaration,
                env,
            );

        case "FunctionDeclaration":
            return EvaluateFunctionDeclaration(
                astNode as FunctionDeclaration,
                env,
            );

        case "IfStatement":
            return EvaluateIfStatement(astNode as IfStatement, env);

        case "ForExpression":
            return EvaluateForExpression(astNode as ForExpression, env);

        case "WhileExpression":
            return EvaluateWhileExpression(astNode as WhileExpression, env);

        default:
            throw new InterpretError(
                `The following AST node has not yet been setup for interpretation: ${astNode.kind}`,
            );
    }
}
