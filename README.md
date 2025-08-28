# Brew v2.5.0

**Important: Brew now includes an experimental compiler that translates `.brew` scripts into Java code.**

**v1.x interpreter is still supported for development and REPL mode.**

**New: Brew now works within the JVM! See [BREW-JVM.md](BREW-JVM.md) for Java integration details.**

Brew is a lightweight, interpreted programming language with JavaScript-like syntax. This implementation includes a complete lexer, parser, and interpreter written in TypeScript and running on Deno.

## Features

* JavaScript-inspired syntax
* Variables and constants with proper scoping
* Primitive types: numbers, strings, booleans, null
* Object literals with property access
* Arrays with indexing support
* User-defined functions with parameters and return values
* Built-in mathematical and utility functions
* Binary and comparison operations
* Control flow: if/else statements, for loops, while loops
* Proper error handling with detailed error messages
* REPL mode for interactive development
* **Experimental Java Compiler** for `.brew` scripts
* **JVM Integration** - Run Brew code directly within Java applications (see [BREW-JVM.md](BREW-JVM.md))

## Platform Support

Brew runs on multiple platforms:

- **Native**: TypeScript/Deno runtime (this implementation)
- **JVM**: Java integration via GraalVM bridge - perfect for Bukkit/Spigot plugins and general Java applications

For JVM usage, including Minecraft plugin development, see **[BREW-JVM.md](BREW-JVM.md)** for installation, API reference, and examples.

## Getting Started

### Prerequisites

* [Deno](https://deno.land/) runtime

### Recommended Scripts for Building to JS File

For easier distribution and deployment, you can build Brew to a JavaScript file using these npm scripts:

```json
{
    "scripts": {
        "build": "node build.mjs",
        "build:ts": "deno run --allow-read --allow-write --allow-run build.ts",
        "dev": "deno run --allow-read --allow-write --allow-run src/main.ts",
        "start": "node dist/main.js",
        "clean": "rm -rf dist temp-build tsconfig.build.json",
        "onefile": "npx esbuild dist/main.js --bundle --platform=node --outfile=brew-compiler.js"
    }
}
```

Usage:
- `npm run build` - Build the project using the build script
- `npm run build:ts` - Build using TypeScript with Deno
- `npm run dev` - Run in development mode with Deno
- `npm run start` - Start the built JavaScript version
- `npm run clean` - Clean build artifacts
- `npm run onefile` - Bundle everything into a single JavaScript file

### Running Brew

Brew can run in three modes:

1. **REPL Mode** – Interactive shell for testing expressions
2. **Script Mode** – Run `.brew` files from disk
3. **Compile Mode** – Compile `.brew` files into Java code

---

#### Script Mode (recommended)

Run any `.brew` script by passing the filename as an argument:

```bash
deno run --allow-read src/main.ts run your-script.brew
```

> Note: Only `.brew` files are supported.

---

#### Compile Mode

Compile a `.brew` script into Java code:

```bash
deno run --allow-read --allow-write src/main.ts compile your-script.brew [ClassName]
```

* `your-script.brew`: The `.brew` file to compile.
* `[ClassName]`: (Optional) The name of the generated Java class. Defaults to `Program`.

The compiled Java file will be saved in the `compiled/` directory.

---

#### REPL Mode

To launch the REPL, run without any arguments:

```bash
deno run --allow-read src/main.ts
```

You'll enter an interactive prompt:

```
Brew Repl v2.5.0
> print("hello");
hello
> print(brewver);
Brew v2.5.0
```

Type `exit` to quit the REPL.

## Language Guide

### Syntax Requirements

**Brew requires semicolons (`;`) at the end of every statement.** This includes:

* Variable declarations: `let x = 10;`
* Expression statements: `x + 5;`
* Function calls: `print("Hello");`
* Assignment statements: `x = 20;`
* Return statements: `return value;`

Function and control flow declarations with braces do not require semicolons:

```javascript
function add(a, b) {
    return a + b; // Note: return statements DO require semicolons
}

if (x > 0) {
    print("positive");
}
```

### Variables and Assignment

```javascript
// Variable declaration
let x = 10;
let name = "Brew";

// Constants (cannot be reassigned)
const PI = 3.14159;

// Assignment (only for non-const variables)
x = 20;

// Uninitialized variables default to null
let uninitialized;
```

### Data Types

```javascript
// Numbers (integers and floats)
let integer = 42;
let decimal = 3.14159;
let negative = -10;

// Strings (single or double quotes)
let greeting = "Hello, world!";
let message = 'Single quotes work too';

// Booleans
let isActive = true;
let isComplete = false;

// Null/undefined (both map to null)
let empty = null;
let nothing = undefined;

// Objects
let person = {
    name: "John",
    age: 30,
    isStudent: false
};

// Arrays
let numbers = [1, 2, 3, 4, 5];
let mixed = [1, "hello", true, null];
```

### Arrays

Brew supports arrays as ordered lists of values with zero-based indexing:

```javascript
// Array declaration and initialization
let numbers = [1, 2, 3, 4, 5];
let fruits = ["apple", "banana", "cherry"];
let mixed = [1, "two", true, null];

// Accessing elements
let firstNumber = numbers[0]; // 1
let secondFruit = fruits[1];  // "banana"

// Modifying elements
numbers[0] = 10;              // Change first element to 10
fruits[2] = "orange";         // Change "cherry" to "orange"

// Nested arrays
let matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];
print(matrix[0][1]); // 2 (first row, second column)
```

### Functions

```javascript
// Function declaration
function add(a, b) {
    return a + b;
}

// Function with multiple statements
function greet(name) {
    let message = "Hello, " + name;
    print(message);
    return message;
}

// Function call
let result = add(5, 3);
greet("Alice");

// Functions can access outer scope
let globalVar = 10;
function useGlobal() {
    return globalVar + 5;
}
```

### Control Flow

#### If/Else Statements

```javascript
let x = 10;

if (x > 0) {
    print("Positive number");
} else {
    print("Non-positive number");
}

// Nested if statements
if (x > 0) {
    if (x < 100) {
        print("Small positive number");
    } else {
        print("Large positive number");
    }
}
```

#### For Loops

For loops in Brew execute a block of code a specified number of times:

```javascript
// Execute 5 times
for (5) {
    print("This prints 5 times");
}

// Using variables
let count = 3;
for (count) {
    print("Loop iteration");
}
```

#### While Loops

While loops execute as long as a condition is true:

```javascript
let i = 0;
while (i < 5) {
    print("i is", i);
    i = i + 1;
}

// Boolean conditions
let running = true;
while (running) {
    print("Still running");
    running = false; // Exit condition
}
```

### Operators

#### Arithmetic Operators
* Addition: `+`
* Subtraction: `-`
* Multiplication: `*`
* Division: `/`
* Modulo: `%`

#### Comparison Operators
* Equal to: `==`
* Not equal to: `!=`
* Greater than: `>`
* Less than: `<`
* Greater or equal to: `>=`
* Less than or equal to: `<=`

#### String Concatenation
The `+` operator performs string concatenation when one operand is a string:

```javascript
let name = "John";
let age = 25;
let message = "Name: " + name + ", Age: " + age;
print(message); // "Name: John, Age: 25"
```

### Built-in Functions

#### Output Functions
* `print(...)` - Output values to console (accepts multiple arguments)

#### Utility Functions
* `time()` - Get current Unix timestamp in milliseconds
* `brewver` - Global constant containing the Brew version string

#### Type Conversion Functions
* `int(value)` - Convert value to integer
* `float(value)` - Convert value to floating-point number
* `str(value)` - Convert value to string

#### Mathematical Functions
* `abs(number)` - Return absolute value
* `round(number)` - Round to nearest integer
* `floor(number)` - Round down to nearest integer
* `ceil(number)` - Round up to nearest integer

#### Special Functions
* `nat(input)` - Easter egg function (responds based on input content)

### Comments

```javascript
// Single line comments start with //

/* Multi-line comments
   can span multiple lines
   like this */

let x = 5; // Comments can also be at the end of lines
```

### Truthiness

Brew uses the following truthiness rules:

**Falsy values:**
* `false`
* `null`
* `0` (number)
* `""` (empty string)

**Truthy values:**
* `true`
* Any non-zero number
* Any non-empty string
* Objects and arrays
* Functions

## Error Handling

Brew includes comprehensive error handling with specific error types:

* **ParseError** - Syntax errors during parsing
* **InterpretError** - Runtime interpretation errors
* **DeclarationError** - Variable declaration conflicts
* **ResolutionError** - Undefined variable access
* **AssignmentError** - Invalid assignments (e.g., to constants)
* **CalculationError** - Mathematical operation errors (e.g., division by zero)
* **ComparisonError** - Invalid comparison operations
* **FunctionError** - Function call and execution errors

## Project Structure

```
src/
├── main.ts                    # Entry point and CLI interface
├── compat.ts                  # Compatibility utilities
├── frontend/
│   ├── ast.ts                 # Abstract Syntax Tree definitions
│   ├── lexer.ts               # Tokenization of source code
│   ├── parser.ts              # Token-to-AST conversion
│   ├── errors.ts              # Custom error classes
│   └── eval/
│       ├── expressions.ts     # Expression evaluation logic
│       └── statements.ts      # Statement evaluation logic
├── runtime/
│   ├── interpreter.ts         # Main evaluation dispatcher
│   ├── environment.ts         # Variable scope management
│   ├── values.ts              # Runtime value types and constructors
│   └── functions.ts           # Built-in function implementations
└── compiler/
    ├── compiler.ts            # Java code generation
    └── templates.ts           # Java code templates
```

## Examples

### Basic Arithmetic and Variables

```javascript
// Variable declarations
let x = 10;
let y = 5;
const PI = 3.14159;

// Arithmetic operations
let sum = x + y;
let difference = x - y;
let product = x * y;
let quotient = x / y;
let remainder = x % y;

// Output results
print("Sum:", sum);           // Sum: 15
print("Product:", product);   // Product: 50
```

### Working with Strings

```javascript
let firstName = "John";
let lastName = "Doe";
let fullName = firstName + " " + lastName;

print("Full name:", fullName); // Full name: John Doe

// String comparisons
if (firstName == "John") {
    print("Hello, John!");
}
```

### Functions and Recursion

```javascript
function factorial(n) {
    if (n <= 1) {
        return 1;
    } else {
        return n * factorial(n - 1);
    }
}

function fibonacci(n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

print("Factorial of 5:", factorial(5));     // 120
print("Fibonacci of 8:", fibonacci(8));     // 21
```

### Objects and Properties

```javascript
let car = {
    brand: "Toyota",
    model: "Camry",
    year: 2020,
    isElectric: false
};

print("Car brand:", car.brand);           // Car brand: Toyota
print("Car year:", car.year);             // Car year: 2020

// Modifying properties
car.year = 2021;
print("Updated year:", car.year);         // Updated year: 2021
```

### Arrays and Iteration

```javascript
let numbers = [10, 20, 30, 40, 50];

// Access elements
print("First number:", numbers[0]);       // First number: 10
print("Last number:", numbers[4]);        // Last number: 50

// Modify elements
numbers[0] = 100;
print("Modified first:", numbers[0]);     // Modified first: 100

// Iterate using for loop
print("All numbers:");
for (5) {
    print("Number at index:", numbers[0]); // This is simplified - actual indexing would need more complex logic
}
```

### Control Flow Examples

```javascript
// If/else with different conditions
let score = 85;

if (score >= 90) {
    print("Grade: A");
} else {
    if (score >= 80) {
        print("Grade: B");
    } else {
        print("Grade: C or below");
    }
}

// For loop example
print("Counting to 3:");
for (3) {
    print("Iteration!");
}

// While loop example
let counter = 0;
while (counter < 3) {
    print("Counter is:", counter);
    counter = counter + 1;
}
```

### Mathematical Functions

```javascript
let x = -15.7;

print("Original:", x);                    // Original: -15.7
print("Absolute:", abs(x));               // Absolute: 15.7
print("Rounded:", round(x));              // Rounded: -16
print("Floor:", floor(x));                // Floor: -16
print("Ceiling:", ceil(x));               // Ceiling: -15

// Type conversions
let numStr = "42";
let floatStr = "3.14";

print("String to int:", int(numStr));     // String to int: 42
print("String to float:", float(floatStr)); // String to float: 3.14
print("Number to string:", str(123));     // Number to string: 123
```

### Complete Program Example

```javascript
// A simple program demonstrating multiple features
const PROGRAMNAME = "Calculator Demo";

function calculate(operation, a, b) {
    if (operation == "add") {
        return a + b;
    } else {
        if (operation == "subtract") {
            return a - b;
        } else {
            if (operation == "multiply") {
                return a * b;
            } else {
                if (operation == "divide") {
                    if (b == 0) {
                        print("Error: Division by zero!");
                        return null;
                    }
                    return a / b;
                } else {
                    print("Unknown operation:", operation);
                    return null;
                }
            }
        }
    }
}

// Program execution
print("=== " + PROGRAMNAME + " ===");
print("Version:", brewver);

let x = 10;
let y = 3;

print("Numbers:", x, "and", y);
print("Addition:", calculate("add", x, y));
print("Subtraction:", calculate("subtract", x, y));
print("Multiplication:", calculate("multiply", x, y));
print("Division:", calculate("divide", x, y));

// Test mathematical functions
print("Absolute of -5:", abs(-5));
print("Square root approximation:", floor(2.236)); // No sqrt function, so approximating
```

## Language Reference

### Global Constants and Functions

The following are available in the global scope:

**Constants:**
* `null` - Null value
* `undefined` - Alias for null
* `true` - Boolean true
* `false` - Boolean false
* `brewver` - String containing current Brew version

**Built-in Functions:**
* `print(...)` - Print values to console
* `time()` - Current Unix timestamp
* `int(value)` - Convert to integer
* `float(value)` - Convert to float
* `str(value)` - Convert to string
* `abs(number)` - Absolute value
* `round(number)` - Round to nearest integer
* `floor(number)` - Round down
* `ceil(number)` - Round up
* `nat(input)` - Easter egg function

### Variable Scoping

Brew uses lexical scoping with environment chains:

```javascript
let global = "I'm global";

function outer() {
    let outerVar = "I'm in outer";
    
    function inner() {
        let innerVar = "I'm in inner";
        print(global);    // Can access global
        print(outerVar);  // Can access outer scope
        print(innerVar);  // Can access local scope
    }
    
    inner();
}

outer();
```

### Return Statements

Functions can use explicit return statements:

```javascript
function max(a, b) {
    if (a > b) {
        return a;
    } else {
        return b;
    }
}

// Functions without explicit return will return the last expression
function implicitReturn(x) {
    x * 2; // This becomes the return value
}
```

### Error Examples

```javascript
// Declaration error
const x = 5;
const x = 10; // Error: Cannot declare variable x: Already declared.

// Assignment error
const y = 5;
y = 10; // Error: Cannot assign to variable 'y': Is constant.

// Resolution error
print(undefinedVar); // Error: Cannot resolve 'undefinedVar': Does not exist.

// Division by zero
print(10 / 0); // Error: Division by zero

// Type errors
while ("not a boolean") { // Error: Expected a boolean for 'while' loop condition
    print("This won't work");
}
```

## Java Compilation

The experimental Java compiler translates Brew code into equivalent Java programs:

```bash
# Compile hello.brew to Hello.java
deno run --allow-read --allow-write src/main.ts compile hello.brew Hello
```

**Compilation Features:**
* Variable declarations become Java variables
* Functions become Java methods
* Built-in functions map to Java equivalents
* Control flow structures are preserved
* Objects become HashMaps
* Arrays become ArrayLists

**Limitations:**
* Some dynamic features may not translate perfectly
* Type inference is basic
* Generated code may not be optimally efficient

## JVM Integration

**Brew now runs natively within the JVM!** This makes it perfect for:

- **Minecraft plugin scripting** (Bukkit/Spigot/Paper)
- **Java application scripting**
- **Runtime code generation**
- **Configuration scripting**

For complete JVM integration documentation, including installation instructions, API reference, and examples, see **[BREW-JVM.md](BREW-JVM.md)**.

## Contributing

Contributions are welcome! Some potential areas for enhancement:

* Enhanced standard library
* Better error messages with line numbers
* Type checking system
* More comprehensive Java compilation
* Additional control flow constructs
* File I/O operations
* Module system

## Need support? Have a suggestion?

Join my Discord! [https://discord.gg/FZuVXszuuM](https://discord.gg/FZuVXszuuM)

## License

[GNU GPL v3](LICENSE)

## Acknowledgements

* Brew is a fun personal language implementation project
* Special thanks to all modern language implementation resources that inspired this work
* tylerlaceby on YouTube for his [custom language tutorial](https://www.youtube.com/watch?v=8VB5TY1sIRo&ab_channel=tylerlaceby)
* Built with Deno and TypeScript for modern JavaScript runtime capabilities