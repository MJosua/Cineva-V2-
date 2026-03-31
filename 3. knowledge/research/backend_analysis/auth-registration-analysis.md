# HOTS Authentication & Registration Flow (Final)

## Files
- Frontend: `fontend/HOTS/src/pages/login/Registerpage.tsx`
- Backend: `controller/hots_controller/auth/controllers/authController.js`
- Mailer: `service/mailer/hots/hots_mailer.js`
- Routes: `routers/hots/hotsAuth.js`

## Flow Summary
1. **Register** (`POST /hots_auth/register`)
   - Validates email domain `@icbp.indofood.co.id`
   - Stores hashed password in `user_draft`
   - Sends verification email to user

2. **Verify Email** (`GET /hots_auth/verify/:token`)
   - Creates user with `department_id = NULL`
   - Notifies Leader via `hotsRequestUserApprovalMailer`

3. **Approve** (`POST /hots_auth/approve-draft/:draft_id`)
   - Updates user's `department_id` and `superior_id`
   - Sends welcome email via `hotsWelcomeMailer`

## Database Tables
- `user_draft` - Stores pending registrations
- `user` - Active users
- `m_company_department` - Department master with `department_head`

## Note
Does NOT use Core Engine - uses direct `dbHots` queries.
