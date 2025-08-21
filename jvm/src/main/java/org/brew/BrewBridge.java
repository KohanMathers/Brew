package org.brew;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.graalvm.polyglot.Context;

public class BrewBridge {

    private static final Context context;

    static {
        try {
            context = Context.newBuilder("js", "regex")
                    .allowAllAccess(true)
                    .option("engine.WarnInterpreterOnly", "false")
                    .build();

            // Read from classpath resource instead of filesystem
            InputStream is = BrewBridge.class.getClassLoader().getResourceAsStream("brew-engine.js");
            if (is == null) {
                throw new RuntimeException("Could not find brew-engine.js in classpath");
            }
            
            String engineCode = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            is.close();
            
            context.eval("js", engineCode);
            
        } catch (IOException e) {
            throw new RuntimeException("Failed to load brew-engine.js", e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize BrewBridge", e);
        }
    }

    public static String compile(String code, String className) {
        try {
            return context.eval("js", "BrewEngine.compile(" + escapeJSString(code) + ", " + escapeJSString(className) + ");").asString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to compile Brew code", e);
        }
    }

    public static String interpret(String code) {
        try {
            return context.eval("js", "BrewEngine.interpret(" + escapeJSString(code) + ");").asString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to interpret Brew code", e);
        }
    }

    public static void repl() {
        try {
            context.eval("js", "BrewEngine.repl();");
        } catch (Exception e) {
            throw new RuntimeException("Failed to start REPL", e);
        }
    }

    /**
     * Properly escape strings for JavaScript evaluation
     */
    private static String escapeJSString(String str) {
        if (str == null) return "null";
        return "\"" + str.replace("\\", "\\\\")
                        .replace("\"", "\\\"")
                        .replace("\n", "\\n")
                        .replace("\r", "\\r")
                        .replace("\t", "\\t") + "\"";
    }

    /**
     * Clean up resources when done
     */
    public static void cleanup() {
        if (context != null) {
            context.close();
        }
    }
}