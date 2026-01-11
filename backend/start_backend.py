#!/usr/bin/env python3
"""Wrapper script to start the backend with proper environment setup."""

import os
import sys
import subprocess
from pathlib import Path

# Get the backend directory (where this script is located)
backend_dir = Path(__file__).parent.absolute()
main_py = backend_dir / "main.py"

if not main_py.exists():
    print(f"ERROR: main.py not found at {main_py}")
    print(f"Current directory: {os.getcwd()}")
    sys.exit(1)

# Change to backend directory
os.chdir(backend_dir)

print(f"Starting backend from: {os.getcwd()}")
print("Using command: uvicorn main:app --reload")
print(f"Python: {sys.executable}")

# Verify we can import main before starting uvicorn
try:
    import importlib.util

    spec = importlib.util.spec_from_file_location("main", main_py)
    if spec is None or spec.loader is None:
        raise ImportError("Could not load main module spec")
    print("✓ Verified main.py can be imported")
except Exception as e:
    print(f"✗ ERROR: Cannot import main module: {e}")
    print("  This suggests a Python path or module structure issue.")
    sys.exit(1)

# Start uvicorn
try:
    subprocess.run(
        [sys.executable, "-m", "uvicorn", "main:app", "--reload"], check=True
    )
except KeyboardInterrupt:
    print("\nShutting down...")
except subprocess.CalledProcessError as e:
    print(f"Error starting server: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Unexpected error: {e}")
    sys.exit(1)
