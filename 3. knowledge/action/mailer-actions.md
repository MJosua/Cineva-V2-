# Mailer Actions

## New Mailers for Registration Flow

### `hotsRequestUserApprovalMailer(leaderEmail, draftDetails)`
-   **Purpose**: Notifies a Department Leader that a new user has verified their email and is waiting for approval to join the department.
-   **Triggered By**: `authController.verifyByEmail` (after successful token verification).

### `hotsWelcomeMailer(userEmail, firstname)`
-   **Purpose**: Welcomes a new user after their Department Leader has approved their request.
-   **Triggered By**: `authController.approveDraft` (after successful approval).

## Existing Mailers
-   `hotsVerifyEmailMailer`: Sends email verification link.
-   `hotsSubmitMailer`: Confirms ticket submission.
-   `hotsApproveRequest`: Notifies approvers of pending tickets.
