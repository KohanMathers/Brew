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
                if (is == null) {
                    throw new RuntimeException("Could not find brew-engine.js in classpath");
                }
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
     *
     * @param code      The Brew source code to compile.
     * @param className The name of the generated Java class.
     * @return The compiled Java bytecode as a String.
     * @throws RuntimeException if the compilation fails.
     */
    public static Future<String> compile(String code, String className) {
        try {
            Callable<String> task = () -> context.eval("js", "BrewEngine.compile(" + escapeJSString(code) + ", " + escapeJSString(className) + ");").asString();
            FutureTask<String> futureTask = new FutureTask<>(task);
            new Thread(futureTask).start();
            return futureTask;
        } catch (Exception e) {
            throw new RuntimeException("Failed to compile Brew code", e);
        }
    }

    /**
     * Interprets Brew code immediately without compilation.
     *
     * @param code The Brew code to interpret.
     * @return The result of code execution as a String.
     * @throws RuntimeException if the interpretation fails.
     */
    public static Future<String> interpret(String code) {
        try {
            Callable<String> task = () -> context.eval("js", "BrewEngine.interpret(" + escapeJSString(code) + ");").asString();
            FutureTask<String> futureTask = new FutureTask<>(task);
            new Thread(futureTask).start();
            return futureTask;
        } catch (Exception e) {
            throw new RuntimeException("Failed to interpret Brew code", e);
        }
    }

    /**
     * Starts an interactive REPL session for Brew.
     *
     * @throws RuntimeException if the REPL fails to start.
     */
    public static void repl() {
        try {
            context.eval("js", "BrewEngine.repl();");
        } catch (Exception e) {
            throw new RuntimeException("Failed to start REPL", e);
        }
    }

    /**
     * Builds a jar from the bytecode passed in
     * @param classname The name of the class to build the jar to.
     * @param classBytes The bytecode to build into the jar.
     * @param outputPath The path to output the jar file to (relative).
     */
    public static void buildJar(String classname, byte[] classBytes, Path outputPath) {
        try{
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
        if (context != null) {
            context.close();
        }
    }
}
