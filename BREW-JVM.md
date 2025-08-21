# Brew JVM v1.0.0

**Brew JVM** is the Java runtime bridge for the [Brew programming language](https://github.com/your-repo).
It embeds the Brew engine (written in TypeScript/JavaScript) into the JVM using [GraalVM](https://www.graalvm.org/) and exposes a clean Java API for interpreting, compiling, and running Brew code.

Brew JVM was **designed for Bukkit/Spigot plugin scripting**, but it works equally well in any Java project where lightweight scripting or Java code generation is useful.

---

## Features

* Interpret `.brew` code directly at runtime
* Compile Brew into Java source (`.java` strings)
* Start a Brew REPL inside JVM
* Load engine code automatically from classpath (`brew-engine.js`)
* Lightweight API (`BrewBridge`) for simple integration
* Works in **Minecraft plugins** as well as **general Java applications**

---

## Installation

### As a JAR

Download `brew-jvm-x.y.z.jar` from the **Releases** tab and place it in your project’s `libs/` folder, then add it to your build.

#### Gradle (with Shadow plugin)

```kts
dependencies {
    implementation(files("libs/brew-jvm-2.2.1.jar"))
}

shadowJar {
    archiveFileName.set("MyApp.jar")
}
```

#### Maven

```xml
<dependency>
    <groupId>org.brew</groupId>
    <artifactId>brew-jvm</artifactId>
    <version>2.2.1</version>
    <scope>system</scope>
    <systemPath>${project.basedir}/libs/brew-jvm-2.2.1.jar</systemPath>
</dependency>
```

---

## Usage

### General Java Example

```java
import org.brew.BrewBridge;

public class Example {
    public static void main(String[] args) {
        // Interpret Brew code
        String result = BrewBridge.interpret("print('Hello from Brew!');");
        System.out.println("Brew output: " + result);

        // Compile Brew into Java source
        String javaCode = BrewBridge.compile("let x = 42; print(x);", "MyProgram");
        System.out.println("Generated Java code:\n" + javaCode);

        // Launch a REPL
        BrewBridge.repl();

        // Clean up when done
        BrewBridge.cleanup();
    }
}
```

---

## API Reference

### `interpret(String code)`

Runs Brew code directly.

```java
String output = BrewBridge.interpret("print('Hello');");
```

---

### `compile(String code, String className)`

Translates Brew code into a Java class. Returns Java source as a `String`.

```java
String javaCode = BrewBridge.compile("let a = 1; print(a);", "Program");
```

---

### `repl()`

Starts an interactive Brew REPL inside the JVM process.

```java
BrewBridge.repl();
```

---

### `cleanup()`

Closes the GraalVM context and frees resources. Call this on application shutdown.

```java
BrewBridge.cleanup();
```

---

## Bukkit / Spigot Integration

A simple example of running Brew inside a Minecraft plugin:

```java
import org.bukkit.plugin.java.JavaPlugin;
import org.brew.BrewBridge;

public class BrewPlugin extends JavaPlugin {

    @Override
    public void onEnable() {
        getLogger().info("Brew JVM initialized inside Bukkit!");

        // Run a Brew script
        BrewBridge.interpret("print('Hello from Brew inside Minecraft!');");
    }

    @Override
    public void onDisable() {
        BrewBridge.cleanup();
    }
}
```

---

## Notes & Requirements

* Requires **GraalVM** or a JVM with Graal polyglot engine available. This can be provided either by running on GraalVM itself, or by shading the GraalVM JavaScript/Polyglot dependencies into your plugin/application jar (the Brew JVM distribution already includes these when built with shading).
* The Brew runtime (`brew-engine.js`) is **bundled inside the jar** and auto-loaded.
* Output from Brew’s `print()` maps back into the JVM and can be logged or redirected.
* The JVM version aims to match Brew’s Deno implementation but may differ slightly in edge cases.

---

## License

[GNU GPL v3](LICENSE)
Brew JVM is part of the **Brew language project**.