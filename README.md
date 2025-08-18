# Brew v2.0

**Important: Brew now includes an experimental compiler that translates `.brew` scripts into Java code.**

**v1.x interpreter is still supported for development and REPL mode.**

Brew is a lightweight, interpreted programming language with JavaScript-like syntax. This implementation includes a complete lexer, parser, and interpreter written in TypeScript and running on Deno.

## Features

- JavaScript-inspired syntax
- Variables and constants
- Primitive types: numbers, strings, booleans, null
- Object literals
- Functions and function calls
- Binary operations
- Expression evaluation
- Proper scoping and environments
- REPL mode for interactive use
- **Experimental Java Compiler** for `.brew` scripts

## Getting Started

### Prerequisites

- [Deno](https://deno.land/) runtime

### Running Brew

Brew can run in three modes:

1. **REPL Mode** – Interactive shell for testing expressions  
2. **Script Mode** – Run `.brew` files from disk  
3. **Compile Mode** – Compile `.brew` files into Java code  

---

#### Script Mode (recommended)

Run any `.brew` script by passing the filename as an argument:

```bash
deno run --allow-read main.ts run your-script.brew
```

> Note: Only `.brew` files are supported.

---

#### Compile Mode

Compile a `.brew` script into Java code:

```bash
deno run --allow-read --allow-write main.ts compile your-script.brew [ClassName]
```

- `your-script.brew`: The `.brew` file to compile.
- `[ClassName]`: (Optional) The name of the generated Java class. Defaults to `Program`.

The compiled Java file will be saved in the `compiled/` directory.

---

#### REPL Mode

To launch the REPL, run without any arguments:

```bash
deno run --allow-read main.ts
```

You’ll enter an interactive prompt:
```
Brew Repl v2.0
> print("hello")
hello
```

Type `exit` to quit the REPL.

## Language Guide

### Syntax Requirements

Brew requires semicolons (`;`) at the end of every statement. This includes:

- Variable declarations: `let x = 10;`
- Expression statements: `x + 5;`
- Function calls: `print("Hello");`
- Assignment statements: `x = 20;`

Function declarations with braces do not require semicolons:
```
function add(a, b) {
    a + b; // Note: The return expression requires a semicolon
}
```

### Variables and Assignment

```
// Variable declaration
let x = 10;
let name = "Brew";

// Constants (cannot be reassigned)
const PI = 3.14159;

// Assignment
x = 20;
```

### Data Types

```
// Numbers
let num = 42;

// Strings
let greeting = "Hello, world!";

// Booleans
let isActive = true;

// Null
let empty = null;

// Objects
let person = {
    name: "John",
    age: 30,
    isStudent: false
};
```

### Functions

```
// Function declaration
function add(a, b) {
    a + b;
}

// Function call
add(5, 3);
```

### Operators

Brew supports standard arithmetic operators:

- Addition: `+`
- Subtraction: `-`
- Multiplication: `*`
- Division: `/`
- Modulo: `%`

It also supports standard comparison operators:

- Equal to: `==`
- Not equal to: `!=`
- Greater than `>`
- Less than `<`
- Greater or equal to `>=`
- Less than or equal to `<=`

### Comments
- Single line comments are supported provided they begin with `//`. e.g. `// This is a single line comment`
- Multi-line comments are also supported provided they are wrapped in a `/*` and `*/`. e.g.
```
/* This is
    a multi-line
    comment */
```

### Built-in Functions

- `print(...)` - Output values to console
- `time()` - Get current timestamp
- `if(condition){true} else {optional false}`  - Execute the specified function based on the condition given
- `for(amount) {args}` - Execute the specified args the given amount of times
- `while(condition) {args}` - Execute the specified args while the given condition is true
- `int(...)` - Convert the inputted value to an integer
- `float(...)` - Convert the inputted value to a float
- `str(...)` - Convert the inputted value to a string
- `nat(...)` - Easter egg function

## Project Structure

- `ast.ts` - Abstract Syntax Tree node definitions
- `lexer.ts` - Tokenizes source code
- `parser.ts` - Converts tokens to AST
- `interpreter.ts` - Evaluates AST nodes
- `environment.ts` - Manages variable scopes
- `values.ts` - Runtime value types
- `functions.ts` - Built-in function implementations
- `errors.ts` - Custom error classes
- `expressions.ts` - Expression evaluation
- `statements.ts` - Statement evaluation
- `compiler.ts` - Compiles `.brew` scripts to Java
- `templates.ts` - Java code templates for compilation
- `main.ts` - Entry point

## Error Handling

Brew includes robust error handling with detailed error messages for:

- Parse errors
- Runtime interpretation errors
- Variable declaration/assignment errors
- Function call errors
- And more

## Examples

### Basic Example

```
// Declare variables
let x = 10;
let y = 5;

// Perform calculations
let sum = x + y;
let product = x * y;

// Output results
print("Sum:", sum);
print("Product:", product);
```

### Function Example

```
function factorial(n) {
    let result = 1;
    
    if (n <= 1) {
        result;
    } else {
        result = n * factorial(n - 1);
    }
    
    result;
}

let num = 5;
print("Factorial of", num, "is", factorial(num));
```

### Object Example

```
let person = {
    name: "Alice",
    age: 28,
    greet: function() {
        print("Hello, my name is", this.name);
    }
};

person.greet();
print("Age:", person.age);
```

### If/else Example
```
if(1+1 == 2) {
    print("True");
} else {
    print("False");
}
```

### For Loop Example
```
for(3) {
    print("This is looping 3 times.")
}
```

### While Loop Example
```
let t = 0;

while(t < 10) {
    t = t + 1;
    print("This is looping 10 times.");
}
```

## Contributing

Contributions are welcome! Some potential areas for enhancement:

- More comprehensive standard library
- Type checking

## Need support? Have a suggestion?

Join my Discord! [https://discord.gg/FZuVXszuuM](https://discord.gg/FZuVXszuuM)

## License

[GNU GPL v3](LICENSE)

## Acknowledgements

- Brew is a fun personal language implementation project
- Special thanks to all modern language implementation resources that inspired this work