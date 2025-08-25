/**
 * Java code templates for Brew language compilation
 */
export const JAVA_TEMPLATES = {
    main_class: `
import java.util.HashMap;
import java.util.Objects;

public class {{CLASS_NAME}} {
    {{CLASS_VARIABLES}}
    
    public static void main(String[] args) {
        {{CLASS_NAME}} program = new {{CLASS_NAME}}();
        program.run();
    }
    
    public void run() {
        {{MAIN_BODY}}
    }
    
    {{GENERATED_METHODS}}
}
    `.trim(),

    method: `
    public {{RETURN_TYPE}} {{METHOD_NAME}}({{PARAMETERS}}) {
        {{METHOD_BODY}}
    }
    `.trim(),

    variable: `{{MODIFIER}}{{TYPE}} {{NAME}} = {{VALUE}};`,

    for_loop: `
        for (int i = 0; i < {{ITERATIONS}}; i++) {
            {{LOOP_BODY}}
        }
    `.trim(),

    while_loop: `
        while ({{CONDITION}}) {
            {{LOOP_BODY}}
        }
    `.trim(),

    if_statement: `
        if ({{CONDITION}}) {
            {{IF_BODY}}
        }{{ELSE_CLAUSE}}
    `.trim(),

    ternary_if: `{{CONDITION}} ? {{TRUE_EXPR}} : {{FALSE_EXPR}}`,

    print: `System.out.println({{ARGS}});`,

    array: `{{TYPE}}[] {{NAME}} = new {{TYPE}}[{{SIZE}}];`,

    runtime_class: `
    class Runtime {
        public static Object add(Object a, Object b) {
            if (a instanceof Number && b instanceof Number) {
                if (a instanceof Integer && b instanceof Integer) {
                    return (Integer) a + (Integer) b;
                }
                return ((Number) a).doubleValue() + ((Number) b).doubleValue();
            }
            return String.valueOf(a) + String.valueOf(b);
        }

        public static Object sub(Object a, Object b) {
            if (a instanceof Number && b instanceof Number) {
                if (a instanceof Integer && b instanceof Integer) {
                    return (Integer) a - (Integer) b;
                }
                return ((Number) a).doubleValue() - ((Number) b).doubleValue();
            }
            return "Incompatible types: Cannot subtract strings.";
        }

        public static Object mult(Object a, Object b) {
            if (a instanceof Number && b instanceof Number) {
                if (a instanceof Integer && b instanceof Integer) {
                    return (Integer) a * (Integer) b;
                }
                return ((Number) a).doubleValue() * ((Number) b).doubleValue();
            }
            return "Incompatible types: Cannot multiply strings.";
        }

        public static Object div(Object a, Object b) {
            if (a instanceof Number && b instanceof Number) {
                if (a instanceof Integer && b instanceof Integer) {
                    return (Integer) a / (Integer) b;
                }
                return ((Number) a).doubleValue() / ((Number) b).doubleValue();
            }
            return "Incompatible types: Cannot divide strings.";
        }
    }
`,
} as const;

export type TemplateKey = keyof typeof JAVA_TEMPLATES;
