# Reactflow Import Patterns

## Issues
In recent updates, importing `KeyCode` directly from `reactflow` resulted in `SyntaxError: The requested module does not provide an export named 'KeyCode'`.

## Solution
Use standard string values for key codes (e.g., `'Delete'`, `'Backspace'`) or check the specific version documentation for the correct export path (e.g., `reactflow/dist/esm/...`) if constants are strictly required. For most cases, strings are safer and more portable across Vite/Reactflow versions.
