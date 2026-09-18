import subprocess
import tempfile
import os

def test_c():
    code = '''#include <stdio.h>
int main() {
    printf("Hello from C!\\n");
    return 0;
}'''
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.c', delete=False) as f:
        f.write(code)
        source = f.name
    
    exe = source.replace('.c', '.exe')
    
    try:
        # Compile
        result = subprocess.run(['gcc', '-o', exe, source], capture_output=True, text=True)
        if result.returncode != 0:
            print(f"C compilation failed: {result.stderr}")
            return False
        
        # Run
        result = subprocess.run([exe], capture_output=True, text=True)
        print(f"C output: {result.stdout.strip()}")
        return result.returncode == 0
    
    finally:
        try:
            os.unlink(source)
            if os.path.exists(exe):
                os.unlink(exe)
        except:
            pass

def test_cpp():
    code = '''#include <iostream>
using namespace std;
int main() {
    cout << "Hello from C++!" << endl;
    return 0;
}'''
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.cpp', delete=False) as f:
        f.write(code)
        source = f.name
    
    exe = source.replace('.cpp', '.exe')
    
    try:
        # Compile
        result = subprocess.run(['g++', '-o', exe, source], capture_output=True, text=True)
        if result.returncode != 0:
            print(f"C++ compilation failed: {result.stderr}")
            return False
        
        # Run
        result = subprocess.run([exe], capture_output=True, text=True)
        print(f"C++ output: {result.stdout.strip()}")
        return result.returncode == 0
    
    finally:
        try:
            os.unlink(source)
            if os.path.exists(exe):
                os.unlink(exe)
        except:
            pass

if __name__ == "__main__":
    print("Testing compilers...")
    
    print("\nTesting C:")
    c_works = test_c()
    
    print("\nTesting C++:")
    cpp_works = test_cpp()
    
    print(f"\nResults:")
    print(f"C: {'✓' if c_works else '✗'}")
    print(f"C++: {'✓' if cpp_works else '✗'}")