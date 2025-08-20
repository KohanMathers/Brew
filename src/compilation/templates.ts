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
} as const;

export type TemplateKey = keyof typeof JAVA_TEMPLATES;
