# OBE Blueprint

Build the frontend structure and UI only (no real backend logic yet — use mock/dummy data and local state) for an Outcome Based Education (OBE) Software platform, inspired by vmedulife's OBE product. This is a structural MVP to validate navigation, layout, and visual design before backend/database work begins.

Scope for this MVP — strictly limited to:

Login page with hardcoded demo credentials (Super Admin + Faculty)
Main application shell: header, footer, sidebar/top navigation
Dashboard homepage — chart/visual-based (not tables), matching the attached reference screenshot
ONE functional module: Settings → Institution Profile
Role-based view difference between Super Admin and Faculty (nav items differ; both land on the same dashboard shell)

Explicitly OUT of scope for this MVP:

No CO/PO mapping, no attainment engine, no rubrics, no exam module, no reports — these are placeholder nav links only (can show "Coming Soon" state or be disabled/greyed out)
No real authentication/backend — use local mock auth
No database — use static/mock JSON data for charts and settings
1. LOGIN PAGE
Clean, centered login card on a branded background (split-screen layout: left side branding/illustration, right side login form — common SaaS pattern, adjust if screenshot shows otherwise)
Fields: Email/Username, Password, "Remember me" checkbox, "Forgot Password?" link (non-functional, just UI)
Institution logo placeholder at top
Role selector or auto-detect — either a toggle/tab for "Super Admin" / "Faculty" login, or single form that routes based on the demo email used
Demo credential hints displayed on the login page itself (small helper text or a "Demo Access" card), e.g.:
Demo Accounts:
Super Admin → superadmin@obe-demo.com / Admin@123
Faculty     → faculty@obe-demo.com / Faculty@123
On submit, validate against these two hardcoded mock accounts only (client-side check), then route:
Super Admin → /dashboard with full nav
Faculty → /dashboard with restricted nav
Show a toast/error for any other credential combo ("Invalid credentials — use demo accounts above")

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://orbit-obe-canvas.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6741dcb4-c550-45c8-885a-82ec2061ae11).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
