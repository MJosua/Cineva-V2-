# Modular Engine Architecture (HOTS)

The HOTS system uses a **Modular Engine** pattern, where services, workflows, and triggers are defined via JSON in the database.

## 1. Service Definition (`m_service`)

The `m_service` table is the entry point for and dynamic form.

*   **`service_id`**: Primary numeric identifier.
*   **`form_json`**: Defines the frontend layout and form fields.
    *   **Structure**: Uses the `items` array format for modern services.
    *   **Variables**: Supports placeholders like `${user}`, `${user_department}`, `${today}`.
*   **`approval_level`**: 
    *   `0`: No approval needed (direct submission).
    *   `1+`: References automated approval steps.
*   **`nav_link`**: Corresponds to the frontend route (e.g., `/it-support`).

## 2. Workflows (`m_service_workflow`)

Workflows define who approves the service submission.

*   **`workflow_id`**: Linked from `m_service`.
*   **`definition` (JSON)**:
    *   **Steps**: Array of approval stages.
    *   **Resolvers**: 
        *   `team`: Resolves to a `team_id` in `m_company_team`.
        *   `superior`: Resolves to the creator's direct manager from their user profile.

## 3. Triggers (`m_service_triggers`)

Triggers automate actions based on ticket events.

*   **`trigger_name` (Common Events)**:
    *   `on_submit`: Fired immediately after the form is submitted.
    *   `workflow_complete`: Fired when all approvals are done.
*   **`trigger_config` (Actions)**:
    *   `create_assignment`: assigns the ticket to a team/user for manual work/preview.
        *   **Note**: `assigned_by` usually falls back to `context.actor.user_id`. Avoid using `:creator_id` literal as it may NOT be resolved in this specific action.
    - `send_email`: Sends notifications.
    - `execute_function`: executes a script in `script/trigger-functions/`.

## 4. Transactional Data (`t_ticket` & `t_ticket_detail`)

*   **`t_ticket`**: Header table storing the ticket status, creator, and current workflow step.
*   **`t_ticket_detail`**: EAV storage for form data.
    *   `cstm_col`: Field's internal name.
    *   `lbl_col`: Field's display label.
    *   `value`: stored string value.

## 5. Active Work (`t_ticket_assignment`)

When a trigger or workflow requires human action (non-approval), it creates an entry in `t_ticket_assignment`.
- **IT Team** is typically `assigned_id: 2` (assigned_type: 'team').
- Status values: `active`, `completed`.
