# NotesApp — Full-Stack CRUD Notes Application

A full-stack notes application with a **React + TypeScript** frontend and a **Java Spring Boot** backend, backed by **PostgreSQL (Supabase)** and **Redis (Upstash / Redis Cloud)**.

## Features

- **JWT authentication** — register/login, per-user notes (each user only sees their own notes)
- **CRUD** — create, read, update, delete, pin/unpin notes
- **Title search** — prefix search on note titles with pagination
- **Autocomplete suggestions** — typo-tolerant title suggestions powered by PostgreSQL `pg_trgm`, debounced (300 ms) on the frontend
- **Pagination** — 6 notes per page
- **Caching** — Redis-backed cache for paginated notes, search results, and suggestions; evicted on every write
- **Rate limiting** — Bucket4j sliding-window rate limiter (per client IP, configurable)
- **REST API** — validated requests, JSON error responses, CORS configured for the dev server

---

## Tech Stack

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| Frontend   | React 18, TypeScript, Vite, React Router, Axios                   |
| Backend    | Java 17, Spring Boot 3.3, Spring Security, Spring Data JPA        |
| Database   | PostgreSQL (Supabase) + `pg_trgm` extension                       |
| Cache      | Redis (Upstash / Redis Cloud) via Spring Cache                    |
| Auth       | JWT (jjwt)                                                        |
| Rate Limit | Bucket4j (`bucket4j_jdk17-core`) — sliding window                  |

---

## Project Structure

```
NotesAppSpringboot/
├── backend/                          # Spring Boot backend
│   ├── .mvn/wrapper/                 # Maven wrapper
│   ├── src/main/java/com/notesapp/
│   │   ├── NotesAppApplication.java
│   │   ├── config/                   # RedisConfig, RateLimitProperties, DatabaseInitializer
│   │   ├── controller/               # AuthController, NoteController
│   │   ├── dto/                      # AuthRequest, AuthResponse, NoteRequest, NoteResponse, PageResponse
│   │   ├── entity/                   # User, Note
│   │   ├── exception/                # ApiError + custom exceptions + GlobalExceptionHandler
│   │   ├── ratelimit/                # RateLimitFilter (Bucket4j sliding window)
│   │   ├── repository/               # UserRepository, NoteRepository
│   │   ├── security/                 # JwtService, JwtAuthFilter, CurrentUser, SecurityConfig
│   │   └── service/                  # AuthService, NoteService
│   ├── src/main/resources/
│   │   ├── application.yml           # datasource, redis, jwt, cors, rate-limit config
│   │   └── db/init.sql               # pg_trgm setup reference
│   ├── .env.example                  # backend env template
│   ├── pom.xml
│   └── mvnw / mvnw.cmd               # Maven wrapper
│
├── frontend/                         # React + TypeScript frontend
│   ├── src/
│   │   ├── api/                      # axios API modules (auth, notes)
│   │   ├── components/               # Navbar, NoteCard, NoteModal, NotesGrid, Pagination, ProtectedRoute
│   │   ├── context/                  # AuthContext (JWT + user state)
│   │   ├── hooks/                    # useNotes, useDebounce
│   │   ├── lib/                      # axios instance + error helper
│   │   ├── pages/                    # Login, Register, Notes, Search, NoteDetail
│   │   ├── types/                    # shared TS types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.example                  # frontend env template
│   └── package.json
│
└── README.md
```

---

## Prerequisites

- **Java 17+** (verified with 17.0.13)
- **Node.js 18+** (verified with 22.x)
- **Maven** — not required, the bundled Maven wrapper (`./mvnw`) handles it
- A **PostgreSQL** database (Supabase) and a **Redis** instance (Upstash / Redis Cloud)

---

## Setup

### 1. Backend

```bash
cd backend
```

Create `backend/src/main/resources/application.yml` from the template, or copy `.env.example` values into it. Fill in:

```yaml
spring:
  datasource:
    # The direct host db.<ref>.supabase.co is IPv6-ONLY. Without IPv6,
    # use the Supavisor pooler (session mode) with user "postgres.<ref>".
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}

  data:
    redis:
      # Credentials MUST be embedded in the URL (see note below).
      url: ${SPRING_DATA_REDIS_URL}

jwt:
  secret: ${JWT_SECRET}
  expiration-ms: ${JWT_EXPIRATION_MS:86400000}

cors:
  allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:5173}

rate-limit:
  capacity: ${RATE_LIMIT_CAPACITY:100}
  window-seconds: ${RATE_LIMIT_WINDOW_SECONDS:60}
```

Run it:

```bash
# Windows
.\mvnw.cmd spring-boot:run

# macOS / Linux
./mvnw spring-boot:run
```

The backend starts on **http://localhost:8080**. On startup it:
- creates the tables (Hibernate `ddl-auto: update`)
- enables `pg_trgm` and creates the trigram index on `notes.title` (idempotent)

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env` from `.env.example`:

```
VITE_API_BASE_URL=http://localhost:8080/api
```

Run it:

```bash
npm run dev
```

Open **http://localhost:5173**.

---

## Connection-string notes (learned the hard way)

These two Supabase/Redis specifics cost real debugging time; both are already
handled by the included `application.yml`.

### Supabase Postgres: the direct host is IPv6-only

`db.<project-ref>.supabase.co` resolves to an **AAAA record only**:

```
db.coiujvxeminknrymacto.supabase.co.  AAAA  2406:da1a:109c:2602:...
```

If your machine has no IPv6 route, the connection fails outright. Use the
**Supavisor pooler** instead — session mode on port 5432, with the project ref
appended to the username:

```
jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require
username: postgres.<project-ref>
password: <your password>        # keep as a separate property
```

> **Which `aws-N-<region>` cluster?** You can't guess it. `aws-0-ap-south-1`
> returned `FATAL: (ENOTFOUND) tenant/user postgres.<ref> not found` while
> `aws-1-ap-south-1` worked. Find the right one by probing, or copy the exact
> string from the Supabase dashboard → **Settings → Database → Connection
> string → URI**.

> **Why the pooler and not the direct host?** Both worked; the pooler is used
> here because it works over IPv4. Also note the password contains `@`
> (`Abhishek@4753gupta`), so it must be a *separate* `password:` property —
> embedding it in the JDBC URL unescaped would mis-parse the host.

### Redis: credentials must live in the URL

Spring Boot **ignores** `spring.data.redis.username` / `spring.data.redis.password`
whenever `spring.data.redis.url` is set. Putting them in separate properties
silently connects unauthenticated, and Lettuce's handshake then fails with:

```
NOAUTH HELLO must be called with the client already authenticated...
  -> RedisConnectionFailureException: Unable to connect to Redis
```

Put the credentials in the URL instead:

```
redis://default:<password>@<host>:<port>
```

Use `rediss://` if the endpoint requires TLS (this one is plain TCP: an
`AUTH`/`PING` probe returned `+OK`/`+PONG` on plain, and TLS failed).

### JWT secret

`Keys.hmacShaKeyFor` rejects keys shorter than 32 bytes, so a short secret like
`GuptaAbhishek` would fail at startup. `JwtService` SHA-256 stretches any
shorter secret to 256 bits, so short secrets work — but use a long random one
in production.

---

## API Reference

All endpoints are under `/api`. Authenticated endpoints require an `Authorization: Bearer <token>` header.

### Auth

| Method | Path                 | Body                              | Returns        |
| ------ | -------------------- | --------------------------------- | -------------- |
| POST   | `/api/auth/register` | `{ name, email, password }`       | `{ token, ... }` |
| POST   | `/api/auth/login`    | `{ email, password }`             | `{ token, ... }` |

### Notes (authenticated)

| Method | Path                          | Query params            | Description                       |
| ------ | ----------------------------- | ----------------------- | --------------------------------- |
| GET    | `/api/notes`                  | `page`, `size` (def 6)  | List your notes (paginated)       |
| GET    | `/api/notes/search`           | `title`, `page`, `size` | Search by title prefix            |
| GET    | `/api/notes/suggestions`      | `query`                 | Autocomplete suggestions (titles) |
| GET    | `/api/notes/{id}`             | —                       | Get a single note                 |
| POST   | `/api/notes`                  | `{ title, content?, color?, pinned? }` | Create a note          |
| PUT    | `/api/notes/{id}`             | same as POST            | Update a note                     |
| PATCH  | `/api/notes/{id}/pin`         | —                       | Toggle pin                        |
| DELETE | `/api/notes/{id}`             | —                       | Delete a note                     |

---

## How each requirement is implemented

### JWT authentication
`JwtService` issues an HS256 token containing the user id (subject) and email. `JwtAuthFilter` validates it on every request and sets the authenticated principal to the user id. `SecurityConfig` is stateless, permits `/api/auth/**`, and requires auth on everything else. `CurrentUser` extracts the current user id from the security context and is used by controllers.

### Per-user notes
Every `Note` has a `user_id` FK. Repositories filter by `userId`, and `NoteService.findOwned()` guarantees a user cannot read/update/delete another user's note (returns 404 to avoid leaking existence).

### Search by title + suggestions
- **Search** (`GET /api/notes/search?title=...`) uses a JPA `LIKE 'query%'` prefix query, paginated.
- **Suggestions** (`GET /api/notes/suggestions?query=...`) uses PostgreSQL `pg_trgm` similarity (`similarity(...) >= 0.15`, plus a case-insensitive prefix match) to find typo-tolerant title matches, ranked exact → prefix → fuzzy. The `DatabaseInitializer` enables `pg_trgm` and creates the GIN trigram index on startup.

### Debouncing
The search box in `Notes.tsx` calls the suggestions API through `useDebounce(value, 300)` — it only fires 300 ms after the user stops typing.

### Pagination (6 per page)
`NoteService` uses `PAGE_SIZE = 6` (also the default `size` query param). `PageResponse` returns `content`, `page`, `size`, `totalElements`, `totalPages`, `last`. The frontend renders `Pagination` controls.

### Caching (pages + search)
Spring Cache abstraction backed by Redis (`application.yml` → `spring.cache.type=redis`):
- `@Cacheable("notes", key="#userId + ':' + #page + ':' + #size")` on paginated notes
- `@Cacheable("search", ...)` on search results
- `@Cacheable("suggestions", ...)` on autocomplete
- Every create/update/delete/pin does `@CacheEvict(allEntries=true)` on all three caches so data never goes stale. TTLs: notes 5 min, search 2 min, suggestions 1 min (`RedisConfig`).

### Rate limiting (Bucket4j sliding window)
`RateLimitFilter` (a `OncePerRequestFilter`) keeps one Bucket4j `Bucket` per client IP (honoring `X-Forwarded-For`). Each bucket is configured with `Bandwidth` + `refillGreedy` — bucket4j's sliding-window refill strategy — allowing `capacity` tokens per `window-seconds`. Excess requests get **429** with a `Retry-After` header. Tune via `rate-limit.capacity` / `rate-limit.window-seconds`.

> **Heads-up:** the limiter also covers `POST /api/auth/login` (brute-force protection), so a runaway frontend loop shows up as "rate limit exceeded" on the login screen. The usual cause is a `useEffect` whose dependency array contains a value that changes on every render — a completed fetch calls `setPageData(new object)`, which re-renders, which re-runs the effect, which fetches again. `useNotes` therefore takes no callback props and surfaces errors via `toast` directly; `reload` is a counter, not a boolean, so a second mutation still re-fires.

---

## Configuration Reference

| Variable                  | Default                          | Description                                  |
| ------------------------- | -------------------------------- | -------------------------------------------- |
| `SPRING_DATASOURCE_URL`   | — (required)                     | PostgreSQL JDBC URL                          |
| `SPRING_DATASOURCE_USERNAME` | — (required)                  | DB user                                      |
| `SPRING_DATASOURCE_PASSWORD` | — (required)                  | DB password                                  |
| `SPRING_DATA_REDIS_URL`   | — (required)                     | Redis URL **with credentials embedded** (`redis://default:pass@host:port`) |
| `JWT_SECRET`              | — (required)                     | HMAC secret (short values are SHA-256 stretched) |
| `JWT_EXPIRATION_MS`       | `86400000` (24h)                 | Token lifetime in ms                         |
| `CORS_ALLOWED_ORIGINS`    | `http://localhost:5173`          | Comma-separated allowed origins              |
| `RATE_LIMIT_CAPACITY`     | `100`                            | Requests per window per IP                   |
| `RATE_LIMIT_WINDOW_SECONDS` | `60`                           | Sliding window length in seconds             |
| `SERVER_PORT`             | `8080`                           | Backend port                                 |
| `VITE_API_BASE_URL`       | `http://localhost:8080/api`      | Frontend → backend base URL                  |

---

## Build & Verify

```bash
# Backend
cd backend
.\mvnw.cmd clean package        # compiles + runs tests + builds jar

# Frontend
cd frontend
npm run build                   # tsc + vite production build
```

Both projects have been verified to compile/build successfully with Java 17 and Node 22.