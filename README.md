# PaperBag v1.0

PaperBag is a lightweight, interpreted programming language with JavaScript-like syntax. This implementation includes a complete lexer, parser, and interpreter written in TypeScript and running on Deno.

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

## Getting Started

### Prerequisites

- [Deno](https://deno.land/) runtime

### Running PaperBag

The language can run in two modes:

1. **REPL Mode** - Interactive shell for testing expressions
2. **Script Mode** - Run code from a file

To switch between modes, modify the `main.ts` file:

```typescript
// For REPL mode
Repl();

// For script mode
Run("./your-script.txt");
```

Then run the interpreter:

```
deno run --allow-read main.ts
```

## Language Guide

### Syntax Requirements

PaperBag requires semicolons (`;`) at the end of every statement. This includes:

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
let name = "PaperBag";

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

PaperBag supports standard arithmetic operators:

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

### Built-in Functions

- `print(...)` - Output values to console
- `time()` - Get current timestamp
- `if(condition, true, optional false)`  - Execute the specified function based on the condition given
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
- `main.ts` - Entry point

## Error Handling

PaperBag includes robust error handling with detailed error messages for:

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
if((1+1) == 2, print("True"), print("Optionally, false"));
```

## Contributing

Contributions are welcome! Some potential areas for enhancement:

- Loops (for, while)
- More comprehensive standard library
- Type checking

## License

[GNU GPL v3](LICENSE)

## Acknowledgements

- PaperBag is a fun personal language implementation project
- Special thanks to all modern language implementation resources that inspired this work
- 