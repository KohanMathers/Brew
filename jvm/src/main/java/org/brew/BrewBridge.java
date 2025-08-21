package org.brew;

import org.graalvm.polyglot.*;
import java.nio.file.*;
import java.io.IOException;

public class BrewBridge {

    private static final Context context = Context.create("js");

    static {
        try {
            String engineCode = Files.readString(Path.of("src/main/resources/brew-engine.js"));
            context.eval("js", engineCode);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static String compile(String code, String className) {
        return context.eval("js", "BrewEngine.compile(" + code + ", " + className + ");").asString();
    }

    public static String interpret(String code) {
        return context.eval("js", "BrewEngine.interpret(" + code + ");").asString();
    }

    public static void repl() {
        context.eval("js", "BrewEngine.repl();");
    }
}
