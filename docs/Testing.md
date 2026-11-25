# Testing

Three layers: automated (Jest, run on every change), API collection (Postman), and a manual checklist on the live site. Fill the **Result** column while testing the deployed app and keep a screenshot for each failed or important case.

## Automated

| Tool | Command | Covers |
| --- | --- | --- |
| Jest + supertest | `cd backend && npm test` | 91 tests: slot calculation, booking status rules, payment rules, auth and role checks over HTTP (401/403/400), a real Socket.IO server (auth handshake, private rooms) |
| Smoke test | `npm run smoke -- https://<api>/api` | 15 read-only checks on the deployed API |
| Postman | import `docs/postman/ServiceLink-Week3.postman_collection.json`, set `baseUrl`, seed DB, run | 99 requests with assertions, all six areas |

Jest uses a fake User model, so it needs no database. Postman and the smoke test need a real running backend with MongoDB.

## Manual test cases

Use the seeded accounts (password `Password123`). Result: Pass / Fail.

### Frontend

| ID | Case | Steps | Expected | Result |
| --- | --- | --- | --- | --- |
| F-01 | Register customer | /register, fill form, submit | Account created, redirected to dashboard | |
| F-02 | Register validation | Submit empty form, short password | Field messages shown, no request accepted | |
| F-03 | Login / logout | Log in, click logout | Dashboard, then back to login | |
| F-04 | Wrong password | Login with a wrong password | Clear error message | |
| F-05 | Route protection | Logged out, open /bookings | Redirect to login | |
| F-06 | Role protection | Customer opens /admin | 403 page | |
| F-07 | Search and filter | Home: search, pick a category | List updates, pagination works | |
| F-08 | Provider page | Open a provider | Services, rating, reviews shown | |
| F-09 | Book a slot | Pick date and slot, add message, request | Success toast, appears in My bookings | |
| F-10 | Payment (transfer) | Confirmed booking: enter transaction id, "I have paid" | Status becomes waiting for confirmation | |
| F-11 | Cancel booking | Cancel a pending booking | Status cancelled | |
| F-12 | Review | Completed booking: leave a review | Rating shown on provider | |
| F-13 | Chat | Message the provider from a booking | Appears for both users instantly | |
| F-14 | Notification bell | Provider receives request while open | Counter, pop-up, list entry | |
| F-15 | Provider tools | Edit profile, add service, set availability | Saved, visible to customers | |
| F-16 | Admin | Approve pending provider, suspend a user | Status changes; suspended user cannot log in | |
| F-17 | Mobile layout | Open on a phone width | No horizontal scroll, menu works | |
| F-18 | Refresh on a deep link | Refresh /bookings when logged in | Page loads (no 404) | |

### Backend

| ID | Case | Expected | Result |
| --- | --- | --- | --- |
| B-01 | GET /api/health | 200, `db: "connected"` | |
| B-02 | Register duplicate email | 409 | |
| B-03 | Protected route without token | 401 | |
| B-04 | Customer calls an admin route | 403 | |
| B-05 | Invalid input (bad date, bad id) | 400 with field errors | |
| B-06 | Unknown route | 404 JSON | |
| B-07 | Book a taken slot | 409 | |
| B-08 | Illegal status change (completed → pending) | Refused | |
| B-09 | Pay a cancelled booking | Refused | |
| B-10 | Read someone else's chat | 403 or 404 | |
| B-11 | Many wrong logins | 429 after the limit | |

### Database

| ID | Case | Expected | Result |
| --- | --- | --- | --- |
| D-01 | Records saved | Users, bookings, messages visible in Atlas | |
| D-02 | Unique email | Second registration rejected | |
| D-03 | Double booking index | Two simultaneous requests for one slot: one succeeds, one gets 409 | |
| D-04 | Passwords | Stored as bcrypt hashes, never plain text | |
| D-05 | Rating update | New review changes provider average and count | |

### Integration (end to end)

| ID | Flow | Expected | Result |
| --- | --- | --- | --- |
| I-01 | Customer books → provider sees request live → confirms → customer sees status live | Notifications on both sides | |
| I-02 | Transfer payment: customer submits id → provider confirms | Payment shows paid; admin total increases | |
| I-03 | Provider registers → admin approves → provider appears in search | Provider visible only after approval | |
| I-04 | Frontend on Vercel talks to backend on Render | No CORS errors in the browser console | |

## Evidence to attach to the submission

- [ ] Output of `npm test` (91 passing)
- [ ] Output of `npm run smoke -- <live api>` (15/15)
- [ ] Postman runner result screenshot
- [ ] Screenshots of the live site: home, booking, payment, chat, notifications, admin
- [ ] Atlas screenshot showing the collections with data
- [ ] This table with the Result column filled

