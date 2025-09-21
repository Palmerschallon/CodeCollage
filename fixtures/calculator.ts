interface MathOperations {
  add(a: number, b: number): number;
  multiply(a: number, b: number): number;
}

class Calculator implements MathOperations {
  add(a: number, b: number): number {
    if (a === null || b === null) {
      return 0;
    }
    return a + b;
  }
  
  multiply(a: number, b: number): number {
    if (a === null || b === null) {
      return 0;
    }
    return a * b;
  }
}