# Logging Standardization Guide

## 1. Unified Logger Utility
All logging MUST use the centralized logger located at `core/logger.js`. Do not use `console.log` directly in controllers.

## 2. Global Access
The logger is available globally as `log`. Choose the appropriate module:
- `log.hots`: For HOTS system modules.
- `log.eorder`: For E-Order / OnlineOrder modules.
- `log.event`: For Event system modules.
- `log.shortener`: For the Shortener service.

## 3. Severity Levels
- **`.info(msg)`**: General operational logs (e.g., "Request success", "Data fetched").
- **`.warn(msg)`**: Potential issues or unauthorized attempts (e.g., "401 Unauthorized", "Resource missing").
- **`.error(msg)`**: Critical failures, exceptions, or database errors.
- **`.table(data)`**: Display objects or arrays in a structured format (SSE compatible).

## 4. Migration Rules
When refactoring legacy code:
1. **REMOVE** local timestamp generation:
   ```javascript
   // DELETE THIS
   let date = new Date();
   let timestamp = blue + date.toLocaleDateString('id') + ...
   ```
2. **REPLACE** `console.log` with the module-specific method:
   ```javascript
   // OLD
   console.log(timestamp + "Success");
   
   // NEW
   log.eorder.info("Success");
   ```
3. **STABILIZE** relative imports:
   If a controller is moved into a subfolder (e.g., `controller/OnlineOrder/`), update path-based `require` calls:
   `../config/db` -> `../../config/db`

## 5. Architectural Impact
Standardized logging allows the Admin Dashboard to parse logs via SSE, providing:
- Real-time monitoring.
- Module-based filtering.
- **Visual severity indicators** (Red for Error, Yellow for Warn).

> [!WARNING]
> **Manual Date Variables**: Do not declare `let date = new Date()` in controllers for logging purposes. Use the global `log` utility which handles timestamping automatically. Manual declarations often lead to `ReferenceError: date is not defined` if used inconsistently across scopes.

