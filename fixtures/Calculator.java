public class Calculator {
    public int add(int a, int b) {
        if (a == 0 || b == 0) {
            return 0;
        }
        return a + b;
    }
    
    public int multiply(int x, int y) {
        if (x == 0 || y == 0) {
            return 0;
        }
        return x * y;
    }
}