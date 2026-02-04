# Proposal: ContainerTracking Error State Improvements

## Current Problem
When tracking data is not found or the SeaRates API fails, the ContainerTracking page shows **nothing** - no card, no message. The user is left confused about what happened.

### Current Behavior:
| Scenario | Current UI |
|----------|------------|
| Loading | ✅ Shows spinner |
| Data found | ✅ Shows tracking card |
| **Data not found (404)** | ❌ Shows nothing (blank) |
| **API error (500, network)** | ❌ Shows nothing (blank) |
| **SeaRates subscription expired** | ❌ Shows nothing (blank) |

---

## Proposed Solution

Add an `errorState` object to track different error conditions and show appropriate informative cards.

### New Error States:
```javascript
const [errorState, setErrorState] = useState({
    hasError: false,
    errorType: null, // 'not_found_local', 'not_found_searates', 'api_error', 'network_error'
    message: ''
});
```

### New UI Cards:

#### 1. "Not Found in Local Database"
When backend returns 404 with message "No matching record found in DB"
```
🔍 Tracking Not Found
The tracking number "XXXX" was not found in our database.
Try checking the number or contact support.
```

#### 2. "SeaRates Not Responding / Subscription Issue"
When backend returns 404 with message containing "SeaRates" or "subscription"
```
⚠️ External Tracking Unavailable
SeaRates tracking service is currently unavailable.
This may be due to subscription limits or service maintenance.
Data shown may be outdated.
```

#### 3. "Server Error"
When backend returns 500
```
❌ Server Error
Something went wrong while fetching tracking data.
Please try again later.
```

#### 4. "Network Error"
When axios fails due to network issues
```
🌐 Connection Error
Could not connect to the server.
Please check your internet connection.
```

---

## Implementation Changes

### 1. Add Error State (Line ~92)
```javascript
const [errorState, setErrorState] = useState({
    hasError: false,
    errorType: null,
    message: ''
});
```

### 2. Update `unifiedFetchSeaRatesData` to throw with context
```javascript
} catch (err) {
    const errorInfo = {
        type: err.response?.status === 404 ? 'not_found' : 'api_error',
        message: err.response?.data?.message || err.message,
        status: err.response?.status
    };
    throw errorInfo;
}
```

### 3. Update `handleDataFetch` to set error state
```javascript
} catch (err) {
    console.error("❌ handleDataFetch error:", err);
    
    let errorType = 'api_error';
    let message = 'An error occurred while fetching tracking data.';
    
    if (err.type === 'not_found') {
        if (err.message?.includes('SeaRates') || err.message?.includes('subscription')) {
            errorType = 'not_found_searates';
            message = 'SeaRates tracking service is currently unavailable.';
        } else {
            errorType = 'not_found_local';
            message = `Tracking number "${dataNumber}" was not found.`;
        }
    } else if (!err.response) {
        errorType = 'network_error';
        message = 'Could not connect to the server.';
    }
    
    setErrorState({ hasError: true, errorType, message });
    setLoading(false);
}
```

### 4. Add Error Card UI (after loading spinner section)
New JSX block to show appropriate error card based on `errorState.errorType`.

---

## Visual Design
The error cards should match the existing card style (white background, shadow) with:
- Icon appropriate to error type (🔍, ⚠️, ❌, 🌐)
- Clear heading
- Descriptive message
- Optional "Try Again" button

---

## Questions for You
1. Should the error card auto-dismiss after some time, or stay until user searches again?
2. Do you want a "Contact Support" link in the error cards?
3. Any specific styling preferences (colors, icons)?

---

**Awaiting your approval to proceed with implementation.**
