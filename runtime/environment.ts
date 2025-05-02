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
            throw `Cannot declare variable ${varname}: Already declared.`;
        }

        this.variables.set(varname, value);
        return value;
    }

    public assignVariable(varname: string, value: RuntimeValue): RuntimeValue {
        const env = this.resolve(varname);
        env.variables.set(varname, value) as RuntimeValue;
        return value;
    }

    public lookupVariable(varname: string): RuntimeValue {
        const env = this.resolve(varname);
        return env.variables.get(varname);
    }

    public resolve(varname: string): Environment {
        if (this.variables.has(varname)) return this;

        if (this.parent == undefined)
            throw `Cannot resolve '${varname}': Does not exist.`;

        return this.parent.resolve(varname);
    }
}
