import { RuntimeValue } from "./values.ts";

export default class Environment {
    private parent?: Environment;
    private variables: Map<string, RuntimeValue>;

    constructor(parentEnv?: Environment) {
        this.parent = parentEnv;
        this.variables = new Map();
    }

    public declareVariable(varname: string, value: RuntimeValue): RuntimeValue {
        if (this.variables.has(varname)) {
            throw `Cannot declare variable ${varname}: Already declared`;
        }

        this.variables.set(varname, value);
        return value;
    }

    public assignVariable(varname: string, value: RuntimeValue): RuntimeValue {}

    public resolve(varname: string): Environment {
        if (this.variables.has(varname)) return this;
    }
}
