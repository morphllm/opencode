// This calculator was enhanced by Morph
// Basic calculator function
function add(a, b) {
  return a + b
}

function multiply(x, y) {
  return x * y
}

function subtract(a, b) {
  return a - b
}

function divide(a, b) {
  if (b === 0) {
    throw new Error("Cannot divide by zero")
  }
  return a / b
}

console.log("Calculator ready")

// Example usage
console.log("Add: 5 + 3 =", add(5, 3))
console.log("Subtract: 10 - 4 =", subtract(10, 4))
console.log("Multiply: 6 * 7 =", multiply(6, 7))
console.log("Divide: 15 / 3 =", divide(15, 3))
