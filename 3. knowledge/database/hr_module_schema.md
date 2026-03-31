# HR Module - User Table Schema Knowledge

## User Table Columns (hots.user)
Key HR-related columns:
- `jobtitle_id` - FK to m_company_job_title.jobtitle_id
- `superior_id` - FK to user.user_id (self-reference)
- `department_id` - FK to m_company_department.department_id
- `nik` - Employee ID (NIK)
- `email` - User email
- `phone` - Phone number

## Job Title Table (m_company_job_title)
Columns:
- `jobtitle_id` (PK)
- `job_title` (name)
- `department_id`
- `description`
- `creation_date`
- `finished_date` (soft delete)
- `is_active`

## API Endpoints
| Endpoint | Controller | Purpose |
|----------|------------|---------|
| GET /hots_settings/get/user | getAllUser | List all users with joins |
| PUT /hots_settings/update/user/:id | updateUser | Update user (includes jobtitle_id, superior_id) |
| GET /hots_settings/get/jobtitle | getAllJobTitle | List job titles |
| GET /hots_settings/get/team | getTeams | List teams |

## Controller File Location
The ACTIVE controller is: `controller/hots_controller/settings/controllers/settingsController.js`
NOT: `controller/hots_controller/hotsSettingsController.js` (legacy file)
