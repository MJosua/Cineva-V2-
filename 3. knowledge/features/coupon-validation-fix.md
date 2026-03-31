# Coupon Validation & Security

## Overview
Recent fixes addressed "invalid code" errors by standardizing the coupon validation workflow and ensuring transactional integrity.

## Patterns & Rules
- **Promise-Based Queries**: Use `dbHots.promise().query` for all coupon checks to handle async/await properly.
- **Transactions**: All updates to coupon status (e.g., marking as used) MUST be wrapped in a transaction with rollback.
- **Validation Logic**:
  1. Check code existence and expiry.
  2. Verify usage limits.
  3. Validate against specific user/event constraints if applicable.

## Error Handling
Never return generic "invalid code" errors without logging the specific database or constraint failure. Use the `log` utility to capture why a validation failed.
