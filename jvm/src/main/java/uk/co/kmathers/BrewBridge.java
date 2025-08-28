package uk.co.kmathers;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.concurrent.Callable;
import java.util.concurrent.Future;
import java.util.concurrent.FutureTask;
import java.util.jar.Attributes;
import java.util.jar.JarEntry;
import java.util.jar.JarOutputStream;
import java.util.jar.Manifest;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Value;

/**
 * The {@code BrewBridge} class provides a Java interface to the Brew language runtime.
 * It uses GraalVM's JavaScript engine to load and execute Brew engine code.
 * <p>
 * This class offers methods to compile Brew code to Java bytecode, interpret code directly,
 * and start an interactive REPL session.
 * </p>
 */
public class BrewBridge {

    /**
     * Utility class for Brew JVM runtime.
     * All methods are static; instantiation is not allowed.
     */
    private BrewBridge() {
        throw new UnsupportedOperationException("This class cannot be instantiated");
    }

    /** The GraalVM polyglot context used to evaluate Brew code. */
    private static final Context context;

    static {
        try {
            // Initialize the polyglot context with JavaScript and regex support
            context = Context.newBuilder("js", "regex")
                    .allowAllAccess(true)
                    .option("engine.WarnInterpreterOnly", "false")
                    .build();

            // Load the Brew engine code from the classpath
            String engineCode;
            try (InputStream is = BrewBridge.class.getClassLoader().getResourceAsStream("brew-engine.js")) {
                if (is == null) throw new RuntimeException("Could not find brew-engine.js in classpath");
                engineCode = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
            context.eval("js", engineCode);
        } catch (IOException e) {
            throw new RuntimeException("Failed to load brew-engine.js", e);
        } catch (RuntimeException e) {
            throw new RuntimeException("Failed to initialize BrewBridge", e);
        }
    }

    /**
     * Compiles Brew code into Java bytecode.
     * Dynamically handles different return types from BrewEngine.
     *
     * @param code      The Brew source code to compile.
     * @param className The name of the generated Java class.
     * @return The compiled Java bytecode as a String.
     * @throws RuntimeException if the compilation fails.
     */
    public static Future<String> compile(String code, String className) {
        Callable<String> task = () -> {
            Value result = context.eval("js",
                    "BrewEngine.compile(" + escapeJSString(code) + ", " + escapeJSString(className) + ")"
            );
            
            return handleJavaScriptResult(result);
        };
        FutureTask<String> futureTask = new FutureTask<>(task);
        new Thread(futureTask).start();
        return futureTask;
    }

    /**
     * Interprets Brew code immediately without compilation.
     * Dynamically handles different return types from BrewEngine.
     *
     * @param code The Brew code to interpret.
     * @return The result of code execution as a String.
     * @throws RuntimeException if the interpretation fails.
     */
    public static Future<String> interpret(String code) {
        Callable<String> task = () -> {
            Value result = context.eval("js",
                    "BrewEngine.interpret(" + escapeJSString(code) + ")"
            );
            
            return handleJavaScriptResult(result);
        };
        FutureTask<String> futureTask = new FutureTask<>(task);
        new Thread(futureTask).start();
        return futureTask;
    }

    /**
     * Handles different types of JavaScript return values
     * @param value The JavaScript value to process
     * @return The final string result
     * @throws RuntimeException if processing fails
     */
    private static String handleJavaScriptResult(Value value) throws RuntimeException {
        if (value.isNull()) {
            throw new RuntimeException("BrewEngine method returned null");
        }

        System.out.println("Promise detected, attempting to resolve...");
        
        context.getBindings("js").putMember("_tempResult", value);
        
        Value isUndefined = context.eval("js", "_tempResult === undefined");
        if (isUndefined.asBoolean()) {
            throw new RuntimeException("BrewEngine method returned undefined - the method may have failed or doesn't return a value");
        }
        
        Value isPromise = context.eval("js", 
            "_tempResult != null && typeof _tempResult === 'object' && typeof _tempResult.then === 'function'");
            
        if (isPromise.asBoolean()) {
            System.out.println("Promise detected, attempting to resolve...");

            Value resolved = context.eval("js", "(async () => await _tempResult)()");
            
            context.eval("js", "delete globalThis._tempResult");

            if (resolved.isString()) {
                return resolved.asString();
            } else {
                return resolved.toString();
            }
        } else if (value.isString()) {
            context.eval("js", "delete globalThis._tempResult");
            return value.asString();
        } else {
            Value typeInfo = context.eval("js", "'Type: ' + typeof _tempResult + ', Value: ' + String(_tempResult)");
            String typeStr = typeInfo.asString();
            
            context.eval("js", "delete globalThis._tempResult");
            
            if (value.hasMembers()) {
                try {
                    context.getBindings("js").putMember("_tempResult", value);
                    Value stringified = context.eval("js", "JSON.stringify(_tempResult)");
                    context.eval("js", "delete globalThis._tempResult");
                    return stringified.asString();
                } catch (Exception e) {
                    context.eval("js", "delete globalThis._tempResult");
                    throw new RuntimeException("BrewEngine returned complex object: " + typeStr + " - " + e.getMessage());
                }
            }
            
            return value.toString();
        }
    }

    /**
     * Starts an interactive REPL session for Brew.
     *
     * @throws RuntimeException if the REPL fails to start.
     */
    public static void repl() {
        try {
            context.eval("js", "BrewEngine.repl();"); // REPL should remain blocking
        } catch (Exception e) {
            throw new RuntimeException("Failed to start REPL", e);
        }
    }

    /**
     * Compiles given code and builds jar from it.
     * @param code The code to compile.
     * @param classname The classname to compile / build to.
     * @param outputPath The path to output the jar file to.
     * @return A Future representing the asynchronous compilation and JAR creation. The Future completes when the JAR has been built.
     */
    public static Future<Void> compileToJar(String code, String classname, Path outputPath) {
        Callable<Void> task = () -> {
            String compiled = compile(code, classname).get();
            byte[] classBytes = compiled.getBytes(StandardCharsets.UTF_8);
            buildJar(classname, classBytes, outputPath).get();
            return null;
        };
        FutureTask<Void> future = new FutureTask<>(task);
        new Thread(future).start();
        return future;
    }

    /**
     * Builds a jar from the bytecode passed in.
     * @param classname The name of the class to build the jar to.
     * @param classBytes The bytecode to build into the jar.
     * @param outputPath The path to output the jar file to.
     */
    public static Future<Void> buildJar(String classname, byte[] classBytes, Path outputPath) {
        Callable<Void> task = () -> {
            try {
                Manifest manifest = new Manifest();
                manifest.getMainAttributes().put(Attributes.Name.MANIFEST_VERSION, "1.0");
                manifest.getMainAttributes().put(Attributes.Name.MAIN_CLASS, classname);

                try (JarOutputStream jos = new JarOutputStream(new FileOutputStream(outputPath.toFile()), manifest)) {
                    String entryName = classname.replace('.', '/') + ".class";
                    JarEntry entry = new JarEntry(entryName);
                    jos.putNextEntry(entry);
                    jos.write(classBytes);
                    jos.closeEntry();
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to build JAR", e);
            }
            return null;
        };
        FutureTask<Void> future = new FutureTask<>(task);
        new Thread(future).start();
        return future;
    }

    /**
     * Properly escapes Java strings for safe JavaScript evaluation.
     *
     * @param str The string to escape.
     * @return A JavaScript-safe string literal.
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
     * Cleans up resources associated with the polyglot context.
     * Should be called when the runtime is no longer needed.
     */
    public static void cleanup() {
        if (context != null) context.close();
    }
}