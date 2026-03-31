# Debug Router UI Guide

## Overview
A new Debug UI has been implemented to allow developers to easily test backend functions with dummy data directly from the browser. This UI provides a user-friendly interface to select debug functions, input arguments (JSON or text), and view the execution results.

**Access URL:** `/debugRouter/`

## Features
- **Function Discovery**: Automatically lists all registered debug functions.
- **Dynamic Forms**: Generates input forms based on the function's input definition.
- **JSON Support**: Supports complex JSON inputs for object/array arguments.
- **Immediate Feedback**: Displays results or errors in a formatted JSON block.

## How to Add New Debug Functions

To add a new function to the debug dashboard, edit `controller/debug_controller.js` and add an entry to the `debugFunctions` object.

### Structure
```javascript
debugFunctions: {
    "your_function_key": {
        name: "Human Readable Name",
        description: "What this function does...",
        inputs: [
            { name: "arg1", type: "text", label: "Argument 1" },
            { name: "arg2", type: "number", label: "Count" },
            { name: "config", type: "json", label: "Configuration Object" }
        ],
        handler: async (data, context) => {
            // Your logic here
            // 'data' contains the input values
            // 'context' contains helpers like { dbQuery }
            
            return { success: true, received: data };
        }
    }
}
```

### Example: specialized DB Query
```javascript
"check_user": {
    name: "Check User Status",
    description: "Get user status by email",
    inputs: [
        { name: "email", type: "text", label: "User Email" }
    ],
    handler: async (data, { dbQuery }) => {
        const users = await dbQuery("SELECT * FROM user WHERE email = ?", [data.email]);
        return users[0] || { message: "User not found" };
    }
}
```

## Security Considerations
Currently, the Debug UI is openly accessible on the `/debugRouter/` path.
- **Production Warning**: Ensure this route is protected or disabled in production environments if it exposes sensitive data.
- **Authentication**: Usage of `req.dataToken` is not automatically handled by the UI. Functions requiring specific authentication context should either accept headers manually or be wrapped in logic that mocks the auth context.

## Files Modified
- `controller/debug_controller.js`: Added registry, UI handler, and runner logic.
- `routers/debug.js`: Added routes for UI and execution.
