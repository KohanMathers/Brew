import { Program, VariableDeclaration } from "../ast.ts";
import Environment from "../../runtime/environment.ts";
import { Evaluate } from "../../runtime/interpreter.ts";
import { MakeNull, RuntimeValue } from "../../runtime/values.ts";

export function EvaluateProgram(
    program: Program,
    env: Environment,
): RuntimeValue {
    let lastEvaluated: RuntimeValue = MakeNull();

    for (const statement of program.body) {
        lastEvaluated = Evaluate(statement, env);
    }

    return lastEvaluated;
}

export function EvaluateVariableDeclaration(
    arg0: VariableDeclaration,
    env: Environment,
): RuntimeValue {
    throw new Error("Function not implemented.");
}
