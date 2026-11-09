# ServiceLink API List

Base path: `/api`. This is the planned design (32 endpoints). Data is JSON.

## Conventions

**Success response**

```json
{ "success": true, "message": "OK", "data": {}, "meta": { "page": 1, "limit": 10, "total": 25, "pages": 3 } }
```

`meta` appears only on paginated lists.

**Error response**

```json
{ "success": false, "message": "Validation failed", "errors": [ { "field": "email", "message": "Email is already registered" } ] }
```

**Status codes:** 200 OK, 201 Created, 400 invalid input or malformed id, 401 missing or invalid token, 403 not allowed for this role or not the owner, 404 not found, 409 conflict (duplicate, slot taken, still in use), 500 server error.

**Authentication:** protected routes need the header `Authorization: Bearer <token>`.

**Access levels:** Public (no login), Logged in (any role), Customer, Provider, Admin, Participant (the customer or provider of that booking).

**Pagination:** list endpoints accept `page` (default 1) and `limit` (default 10, maximum 50).

---

## 1. Auth

| Method | Path | Access | Request | Success | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/auth/register` | Public | Body: `name`, `email`, `password` (8+ characters, letter and number), `role` (`customer` or `provider`) | 201: `token`, `user` | 400 validation, 409 email exists |
| POST | `/auth/login` | Public | Body: `email`, `password` | 200: `token`, `user` | 400 validation, 401 wrong details, 403 account suspended |
| GET | `/auth/me` | Logged in | none | 200: `user` | 401 |

## 2. Categories

| Method | Path | Access | Request | Success | Errors |
| --- | --- | --- | --- | --- | --- |
| GET | `/categories` | Public | none | 200: list of categories | |
| POST | `/categories` | Admin | Body: `name`, `icon` (optional) | 201: category | 400, 401, 403, 409 name exists |
| PUT | `/categories/:id` | Admin | Body: `name`, `icon` | 200: category | 400, 401, 403, 404 |
| DELETE | `/categories/:id` | Admin | none | 200 | 401, 403, 404, 409 category has services |

## 3. Providers

| Method | Path | Access | Request | Success | Errors |
| --- | --- | --- | --- | --- | --- |
| GET | `/providers` | Public | Query: `search`, `city`, `category`, `minRating`, `page`, `limit`. Only approved, unpaused providers are returned | 200: list, `meta` | |
| GET | `/providers/:id` | Public | none | 200: provider profile with its active services | 400 bad id, 404 |
| PUT | `/providers/me` | Provider | Body: `bio`, `city`, `experienceYears`, `categories`, `photoUrl`, `isPaused` | 200: provider | 400, 401, 403 |

## 4. Services

| Method | Path | Access | Request | Success | Errors |
| --- | --- | --- | --- | --- | --- |
| GET | `/services` | Public | Query: `search`, `category`, `city`, `minPrice`, `maxPrice`, `minRating`, `sort` (`newest`, `price_asc`, `price_desc`, `rating`), `page`, `limit` | 200: list, `meta` | |
| GET | `/services/:id` | Public | none | 200: service | 400, 404 |
| POST | `/services` | Provider | Body: `category`, `title`, `description`, `price` (whole PKR), `durationMinutes`. Provider comes from the token | 201: service | 400, 401, 403 not approved, 404 category |
| PUT | `/services/:id` | Provider (owner) | Body: any of `category`, `title`, `description`, `price`, `durationMinutes`, `isActive` | 200: service | 400, 401, 403 not owner, 404 |
| DELETE | `/services/:id` | Provider (owner) | none | 200 | 401, 403, 404, 409 active bookings exist |

## 5. Availability and slots

| Method | Path | Access | Request | Success | Errors |
| --- | --- | --- | --- | --- | --- |
| GET | `/availability/me` | Provider | none | 200: weekly rules, `slotMinutes`, `daysOff` | 401, 403 |
| PUT | `/availability/me` | Provider | Body: `weekly` (list of `dayOfWeek`, `startTime`, `endTime`), `slotMinutes` (30, 60, 90 or 120), `daysOff` (list of `YYYY-MM-DD`) | 200: availability | 400, 401, 403 |
| GET | `/providers/:id/slots` | Public | Query: `date` (`YYYY-MM-DD`). Slots are computed: weekly rule minus days off, past times and active bookings | 200: `date`, list of `startTime` and `endTime` | 400, 404 |

## 6. Bookings

| Method | Path | Access | Request | Success | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/bookings` | Customer | Body: `service`, `date`, `startTime`, `address`, `notes` | 201: booking with status `pending` | 400, 401, 403, 404, 409 slot taken |
| GET | `/bookings/me` | Customer, Provider | Query: `status`, `from`, `to`, `page`, `limit`. Returns only the caller's bookings | 200: list, `meta` | 401 |
| GET | `/bookings/:id` | Participant, Admin | none | 200: booking | 400, 401, 403, 404 |
| PATCH | `/bookings/:id/status` | Owner per rule | Body: `status`, `reason` (optional) | 200: booking | 400 invalid move, 401, 403, 404 |

**Allowed status moves**

| From | To | Who |
| --- | --- | --- |
| pending | confirmed | Provider |
| pending | rejected | Provider |
| pending | cancelled | Customer |
| confirmed | completed | Provider, on or after the start time |
| confirmed | cancelled | Customer or Provider |

## 7. Reviews

| Method | Path | Access | Request | Success | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/bookings/:id/review` | Customer | Body: `rating` (1 to 5), `comment` (up to 500 characters). Booking must be completed and belong to the caller | 201: review | 400, 401, 403, 404, 409 already reviewed |
| GET | `/providers/:id/reviews` | Public | Query: `page`, `limit` | 200: list, `meta` | 400, 404 |
| DELETE | `/reviews/:id` | Admin | none | 200. The provider's average rating is recalculated | 401, 403, 404 |

## 8. Admin

| Method | Path | Access | Request | Success | Errors |
| --- | --- | --- | --- | --- | --- |
| GET | `/admin/stats` | Admin | none | 200: totals for users, providers, bookings by status | 401, 403 |
| GET | `/admin/users` | Admin | Query: `search`, `role`, `page`, `limit` | 200: list, `meta` | 401, 403 |
| PATCH | `/admin/users/:id/status` | Admin | Body: `isActive`. Suspending cancels the user's future bookings | 200: user | 400, 401, 403, 404 |
| GET | `/admin/providers/pending` | Admin | Query: `page`, `limit` | 200: list, `meta` | 401, 403 |
| PATCH | `/admin/providers/:id/approval` | Admin | Body: `approvalStatus` (`approved` or `rejected`), `rejectionReason` | 200: provider | 400, 401, 403, 404 |
| GET | `/admin/bookings` | Admin | Query: `status`, `provider`, `from`, `to`, `page`, `limit` | 200: list, `meta` | 401, 403 |

## 9. Health

| Method | Path | Access | Request | Success | Errors |
| --- | --- | --- | --- | --- | --- |
| GET | `/health` | Public | none | 200: `{ "message": "ServiceLink API is running" }` | |

---

**Total:** 3 auth + 4 categories + 3 providers + 5 services + 3 availability + 4 bookings + 3 reviews + 6 admin + 1 health = 32 endpoints.