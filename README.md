# ServiceLink

A local service marketplace and booking platform. Customers find verified providers (plumbers, tutors, cleaners, tailors and more), pick a free time slot and book. Providers publish services and availability. Admins approve providers and moderate the platform.

Built with the MERN stack (MongoDB, Express.js, React, Node.js) as the Month 3 project of the AUREX Full-Stack Engineering Internship.

**Status: Week 1 (planning and design) complete. Implementation starts in Week 2.**

Author: Kinza Imtiaz  · Internship: AUREX Full-Stack Engineering, Month 3

---

## Problem statement

Finding a reliable local service provider still depends on word of mouth and WhatsApp groups. Customers cannot see verified profiles, real availability or past reviews. Providers lose jobs to double scheduling and have no booking history or reputation record.

## Objectives

- Let customers search, compare and book providers by category, city, price and rating.
- Let providers publish services and weekly availability, and accept or reject bookings.
- Prevent double booking with server-side slot checks.
- Let admins approve providers, manage categories and monitor all bookings.
- Allow reviews only for completed bookings, with ratings that update automatically.
- Deliver a deployed, documented and tested portfolio project.

## User roles

| Role | What they can do |
| --- | --- |
| Customer | Search and filter providers, view reviews, book and cancel, track bookings, review completed jobs |
| Provider | Manage profile, services and weekly availability, accept or reject requests, mark jobs completed |
| Admin | Approve or suspend providers and users, manage categories, view all bookings, moderate reviews |

## Planned features

- Registration and login with JWT and bcrypt, role-based access
- Provider onboarding with admin approval
- Service listings with search, filters, sorting and pagination
- Weekly availability and generated time slots
- Booking with double-booking prevention and a status flow: pending, confirmed, rejected, completed, cancelled
- Reviews and automatic rating averages
- Customer, provider and admin dashboards
- Validation and consistent error responses everywhere

Detailed requirements (with IDs and priorities) are in the design document.

## Technology stack

| Layer | Choice |
| --- | --- |
| Frontend | React (Vite), React Router, Axios, Tailwind CSS |
| State | Context API with a `useAuth` hook |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas with Mongoose |
| Authentication | JWT, bcryptjs |
| Validation | express-validator |
| Testing | Postman collection, Jest and Supertest for key logic |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas |

## System architecture

```
React frontend  ->  REST API (JSON over HTTPS)  ->  Express.js  ->  Mongoose  ->  MongoDB Atlas
```

Every request passes through middleware (JWT check, role check, validation) before it reaches a controller. Controllers hold the business rules; Mongoose models describe the data. The architecture diagram is in `docs/diagrams/`.

## Database design

Seven collections: `users`, `providers`, `categories`, `services`, `availability`, `bookings`, `reviews`. The `bookings` collection is the core: it links a customer, a provider and a service to one time slot, and a unique partial index prevents two active bookings for the same slot. The ER diagram is in `docs/diagrams/`.

## Documentation

| Document | Location |
| --- | --- |
| Project planning and technical design document | `docs/Project-Planning-Design.pdf` |
| API list (32 endpoints) | [`docs/api-list.md`](docs/api-list.md) |
| Diagrams (architecture, database, booking lifecycle) | `docs/diagrams/` |

## Repository structure

```
servicelink/
  frontend/     React application (added in Week 2)
  backend/      Express API (added in Week 2)
  docs/         design document, API list, diagrams
  README.md
  .gitignore
```

## Development plan

| Week | Focus | Outcome |
| --- | --- | --- |
| 1 | Planning, design, repository setup | Design document, diagrams, API list, repository |
| 2 | Core build: backend, models, React shell | Categories, providers and services working from React to MongoDB |
| 3 | Authentication, roles, booking logic, testing | Login, protected routes, booking flow, Postman collection |
| 4 | Polish, deployment, documentation | Live URLs, final README, screenshots, demo |

## Running locally

Setup instructions, environment variables and screenshots will be added when the code is committed in Week 2.

## Known limitations and future improvements

To be completed at the end of the project. Planned extensions: online payments, map-based search, real-time notifications and a recommendation engine.