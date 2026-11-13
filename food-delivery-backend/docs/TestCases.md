# Black-Box System Test Cases — Food Delivery REST API

| Field | Value |
|---|---|
| **Team** | Group 8 |
| **System under test** | Food Delivery App backend (Spring Boot REST API) |
| **Test level / type** | Black-box system testing (REST API level) |
| **Techniques** | Equivalence partitioning (EP), boundary value analysis (BVA), error guessing (EG) |
| **API base URL** | `http://localhost:8080` (automated via MockMvc under `test` profile) |
| **Total test cases** | 50 (`TC-01` – `TC-50`) |

## 1. Test environment and conventions

- Backend running with seeded or test-profile H2 database.
- All request/response bodies are JSON (`Content-Type: application/json`).
- Protected endpoints require the header `Authorization: Bearer <token>` obtained from `POST /api/user/login`.
- Public endpoints: `POST /api/user/register`, `POST /api/user/login`.
- `$JWT(customer)`, `$JWT(owner)`, `$JWT(admin)` denote valid JWT tokens for each role.
- **Expected (SRS)** states the specification requirement; **Actual Observed / Status** documents whether the unmodified SUT passes or exposes a logged defect (`DEF-*`).

## 2. Seeded accounts (runtime default profile)

| Username | Password | Role |
|---|---|---|
| `customer` | `customer` | `ROLE_CUSTOMER` |
| `owner` | `owner` | `ROLE_OWNER` |
| `admin` | `admin` | `ROLE_ADMIN` |

## 3. Test case suite

### 3.1 User registration, login, profile & lookup (`/api/user`)

| ID | SRS / TS Ref | Test Title | Technique | Preconditions | Request (Method + Path + Body / Auth) | Expected Result (SRS) | Actual Observed / Status | Priority |
|---|---|---|---|---|---|---|---|---|
| TC-01 | FR-01 / TS-01-1 | Register new user with valid fields | EP (valid) | Username `newuser` unused | `POST /api/user/register` `{"username":"newuser","password":"pass123","name":"John","surname":"Doe","email":"john@example.com"}` | HTTP 200; returns `username`, `name`, `surname`, `email`, `role=ROLE_CUSTOMER`; no password exposed | **Pass** — HTTP 200, password excluded | High |
| TC-02 | FR-02 / TS-01-2 | Register duplicate username | EP (invalid) | User `customer` exists | `POST /api/user/register` `{"username":"customer","password":"x12345","name":"A","surname":"B","email":"a@b.com"}` | Rejected (4xx conflict/bad request); no duplicate saved | **Fail (`DEF-02`)** — `UsernameAlreadyExistsException` -> HTTP 500 | High |
| TC-03 | NFR-05 / TS-01-3 | Register with missing password | EG (negative) | None | `POST /api/user/register` `{"username":"nofields"}` | HTTP 400 validation error | **Fail (`DEF-10`)** — `IllegalArgumentException` in `PasswordEncoder` -> HTTP 500 | High |
| TC-04 | FR-03 / TS-02-1 | Login with valid credentials | EP (valid) | User `customer/customer` exists | `POST /api/user/login` `{"username":"customer","password":"customer"}` | HTTP 200; non-empty JWT `token` returned | **Pass** — HTTP 200 + valid JWT | High |
| TC-05 | FR-04 / TS-02-2 | Login with wrong password | EP (invalid) | User `customer` exists | `POST /api/user/login` `{"username":"customer","password":"wrongpass"}` | HTTP 401 Unauthorized | **Fail (`DEF-02`)** — `IncorrectPasswordException` -> HTTP 500 | High |
| TC-06 | FR-03 / TS-02-3 | Login with unknown username | EP (invalid) | User `ghost` does not exist | `POST /api/user/login` `{"username":"ghost","password":"whatever"}` | HTTP 401/403 rejected | **Pass (Actual: HTTP 403)** — `UsernameNotFoundException` caught by `ExceptionTranslationFilter` -> 403 (`DEF-09`) | High |
| TC-07 | FR-05 / TS-01-5 | Get existing user by username as ADMIN | EP (valid) | Auth `$JWT(admin)` | `GET /api/user/customer` with `Authorization: Bearer $JWT(admin)` | HTTP 200; returns `username`, `name`, `surname`, `email`, `role` | **Pass** — HTTP 200 | Medium |
| TC-08 | FR-05 / TS-01-5 | Get non-existing user by username as ADMIN | EP (invalid) | Auth `$JWT(admin)` | `GET /api/user/nosuchuser` with `Authorization: Bearer $JWT(admin)` | HTTP 404 Not Found | **Pass** — HTTP 404 | Medium |
| TC-09 | FR-05 / TS-09-5 | Get user by username as CUSTOMER | EP (invalid role) | Auth `$JWT(customer)` | `GET /api/user/customer` with `Authorization: Bearer $JWT(customer)` | HTTP 403 Forbidden | **Pass** — HTTP 403 | High |
| TC-10 | FR-06 / TS-01-4 | Get current authenticated user profile (`/me`) | EP (valid) | Auth `$JWT(customer)` | `GET /api/user/me` with `Authorization: Bearer $JWT(customer)` | HTTP 200; returns profile of token owner | **Pass** — HTTP 200 | High |

### 3.2 Restaurant CRUD (`/api/restaurants`)

| ID | SRS / TS Ref | Test Title | Technique | Preconditions | Request (Method + Path + Body / Auth) | Expected Result (SRS) | Actual Observed / Status | Priority |
|---|---|---|---|---|---|---|---|---|
| TC-11 | FR-07 / TS-03-2 | List all restaurants | EP (valid) | Auth `$JWT(customer)` | `GET /api/restaurants` | HTTP 200; JSON array of `{id, name, description}` | **Pass** — HTTP 200 | Medium |
| TC-12 | FR-08 / TS-03-2 | Get restaurant by existing id | EP (valid) | Auth `$JWT(customer)`; id `1` exists | `GET /api/restaurants/1` | HTTP 200; `{id, name, description}` | **Pass** — HTTP 200 | Medium |
| TC-13 | FR-08 / TS-03-3 | Get restaurant by non-existing id | BVA (invalid id) | Auth `$JWT(customer)` | `GET /api/restaurants/999999` | HTTP 404 Not Found | **Pass** — HTTP 404 | Medium |
| TC-14 | FR-09 / TS-03-1 | Add restaurant as OWNER (valid) | EP (valid) | Auth `$JWT(owner)` | `POST /api/restaurants/add` `{"name":"Test Bistro","description":"Desc"}` | HTTP 200; created restaurant with generated `id` | **Pass** — HTTP 200 | High |
| TC-15 | NFR-05 / TS-03-6 | Add restaurant with empty name | EG (negative) | Auth `$JWT(owner)` | `POST /api/restaurants/add` `{"name":"","description":"missing name"}` | HTTP 400 validation error | **Fail (`DEF-10`)** — HTTP 200, persisted with empty name | Medium |
| TC-16 | FR-10 / TS-03-4 | Edit restaurant with valid id as OWNER | EP (valid) | Auth `$JWT(owner)`; id `1` exists | `PUT /api/restaurants/1/edit` `{"name":"Renamed Bistro","description":"updated"}` | HTTP 200; updated restaurant persisted | **Pass** — HTTP 200 | High |
| TC-17 | FR-10 / TS-03-3 | Edit restaurant with non-existing id | BVA (invalid id) | Auth `$JWT(owner)` | `PUT /api/restaurants/999999/edit` `{"name":"Ghost","description":"n/a"}` | HTTP 404 Not Found | **Pass** — HTTP 404 | Medium |
| TC-18 | FR-11 / TS-03-5 | Delete restaurant with valid id as OWNER | EP (valid) | Auth `$JWT(owner)`; deletable id `2` exists | `DELETE /api/restaurants/2/delete` | HTTP 200; subsequent GET returns 404 | **Pass** — HTTP 200 | High |
| TC-19 | FR-11 / TS-03-3 | Delete restaurant with non-existing id | BVA (invalid id) | Auth `$JWT(owner)` | `DELETE /api/restaurants/999999/delete` | HTTP 404 Not Found | **Pass** — HTTP 404 | Medium |

### 3.3 Dish CRUD (`/api/dishes`)

| ID | SRS / TS Ref | Test Title | Technique | Preconditions | Request (Method + Path + Body / Auth) | Expected Result (SRS) | Actual Observed / Status | Priority |
|---|---|---|---|---|---|---|---|---|
| TC-20 | FR-12 / TS-04-2 | List all dishes | EP (valid) | Auth `$JWT(customer)` | `GET /api/dishes` | HTTP 200; JSON array with `id`, `name`, `description`, `price`, `quantity`, `restaurantId` | **Pass** — HTTP 200 | Medium |
| TC-21 | FR-13 / TS-04-2 | Get dish by existing id | EP (valid) | Auth `$JWT(customer)`; id `1` exists | `GET /api/dishes/1` | HTTP 200; dish JSON | **Pass** — HTTP 200 | Medium |
| TC-22 | FR-13 / TS-04-3 | Get dish by non-existing id | BVA (invalid id) | Auth `$JWT(customer)` | `GET /api/dishes/999999` | HTTP 404 Not Found | **Pass** — HTTP 404 | Medium |
| TC-23 | FR-14 / TS-04-2 | Get dish details by existing id | EP (valid) | Auth `$JWT(customer)`; id `1` exists | `GET /api/dishes/1/details` | HTTP 200; dish fields + nested `restaurant` object | **Pass** — HTTP 200 | Medium |
| TC-24 | FR-14 / TS-04-3 | Get dish details by non-existing id | BVA (invalid id) | Auth `$JWT(customer)` | `GET /api/dishes/999999/details` | HTTP 404 Not Found | **Pass** — HTTP 404 | Medium |
| TC-25 | FR-15 / TS-04-1 | Add dish as OWNER (valid) | EP (valid) | Auth `$JWT(owner)`; restaurant `1` exists | `POST /api/dishes/add` `{"name":"Test Pizza","description":"Cheese","price":9.99,"quantity":10,"restaurantId":1}` | HTTP 200; created dish returned | **Pass** — HTTP 200 | High |
| TC-26 | FR-15 / TS-04-4 | Add dish as OWNER with non-existing restaurantId | EG (negative) | Auth `$JWT(owner)` | `POST /api/dishes/add` `{"name":"Orphan","description":"desc","price":5.0,"quantity":3,"restaurantId":999999}` | HTTP 404 Not Found (`RestaurantNotFoundException`) | **Fail (`DEF-02`)** — HTTP 500 | High |
| TC-27 | FR-16 / TS-04-2 | Edit dish with valid id as OWNER | EP (valid) | Auth `$JWT(owner)`; dish `1` exists | `PUT /api/dishes/1/edit` `{"name":"Updated Pizza","description":"Updated","price":11.5,"quantity":8,"restaurantId":1}` | HTTP 200; updated fields returned | **Pass** — HTTP 200 | High |
| TC-28 | FR-16 / TS-04-3 | Edit dish with non-existing id as OWNER | BVA (invalid id) | Auth `$JWT(owner)` | `PUT /api/dishes/999999/edit` valid dish body | HTTP 404 Not Found | **Pass** — HTTP 404 | Medium |
| TC-29 | FR-17 / TS-04-2 | Delete dish with valid id as OWNER | EP (valid) | Auth `$JWT(owner)`; deletable dish `2` exists | `DELETE /api/dishes/2/delete` | HTTP 200; subsequent GET returns 404 | **Pass** — HTTP 200 | High |
| TC-30 | FR-17 / TS-04-3 | Delete dish with non-existing id as OWNER | BVA (invalid id) | Auth `$JWT(owner)` | `DELETE /api/dishes/999999/delete` | HTTP 404 Not Found | **Pass** — HTTP 404 | Medium |

### 3.4 Order dish management (`/api/dishes/{id}/add-to-order`, `/api/dishes/{id}/remove-from-order`)

| ID | SRS / TS Ref | Test Title | Technique | Preconditions | Request (Method + Path + Body / Auth) | Expected Result (SRS) | Actual Observed / Status | Priority |
|---|---|---|---|---|---|---|---|---|
| TC-31 | FR-19 / TS-05-1 | Add in-stock dish (`qty > 1`) to pending order | EP (valid) | Auth `$JWT(customer)`; dish `1` has `quantity > 1` | `POST /api/dishes/1/add-to-order` | HTTP 200; dish added, stock decremented by 1, status `PENDING` | **Pass** — HTTP 200 | High |
| TC-32 | FR-19,20 / TS-05-2 | Boundary: add dish with `quantity == 1`, then add again | BVA (boundary 1 -> 0) | Auth `$JWT(customer)`; dish has `quantity == 1` | `POST /api/dishes/{id}/add-to-order` twice | 1st call: HTTP 200, stock becomes `0`; 2nd call: `DishOutOfStockException` (4xx) | **Partial (`DEF-02`)** — 1st returns 200 (qty 0); 2nd throws 500 | High |
| TC-33 | FR-20 / TS-05-3 | Add out-of-stock dish (`quantity == 0`) | BVA (`qty == 0`) | Auth `$JWT(customer)`; dish `3` has `quantity == 0` | `POST /api/dishes/3/add-to-order` | `DishOutOfStockException` (4xx); order unchanged | **Fail (`DEF-02`)** — HTTP 500 (order unchanged) | High |
| TC-34 | FR-19 / TS-05-4 | Add non-existing dish to order | EG (negative) | Auth `$JWT(customer)` | `POST /api/dishes/999999/add-to-order` | HTTP 404 (`DishNotFoundException`) | **Fail (`DEF-02`)** — HTTP 500 | Medium |
| TC-35 | FR-19 / TS-05-5 | Add same dish twice to pending order | EG (edge) | Auth `$JWT(customer)`; dish `1` has `quantity >= 2` | `POST /api/dishes/1/add-to-order` twice | Single order line or clear quantity semantics | **Fail (`DEF-07`)** — Two duplicate entries in `dishes[]` | Low |
| TC-36 | FR-21 / TS-06-1 | Remove dish present in pending order | EP (valid) | Auth `$JWT(customer)`; dish `1` in pending order | `POST /api/dishes/1/remove-from-order` | HTTP 200; dish removed, stock incremented by 1 | **Pass** — HTTP 200 | High |
| TC-37 | FR-21 / TS-06-2 | Remove dish **not** present in pending order | EG (negative) | Auth `$JWT(customer)`; dish `1` NOT in pending order | `POST /api/dishes/1/remove-from-order` | Rejected (4xx) or no stock change | **Fail (`DEF-01` High)** — HTTP 200, stock inflated +1! | High |
| TC-38 | FR-21 / TS-06-3 | Remove non-existing dish from order | EG (negative) | Auth `$JWT(customer)` | `POST /api/dishes/999999/remove-from-order` | HTTP 404 (`DishNotFoundException`) | **Fail (`DEF-02`)** — HTTP 500 | Medium |

### 3.5 Order lifecycle (`/api/orders`)

| ID | SRS / TS Ref | Test Title | Technique | Preconditions | Request (Method + Path + Body / Auth) | Expected Result (SRS) | Actual Observed / Status | Priority |
|---|---|---|---|---|---|---|---|---|
| TC-39 | FR-18 / TS-07-1 | Get or create pending order | EP (valid) | Auth `$JWT(customer)`; no pending order | `GET /api/orders/pending` | HTTP 200; creates empty `PENDING` order; idempotent on repeat | **Pass** — HTTP 200 | High |
| TC-40 | FR-22 / TS-07-1 | Confirm pending order containing dishes | EP (valid) | Auth `$JWT(customer)`; pending order has `>= 1` dish | `PUT /api/orders/pending/confirm` | HTTP 200; `status == CONFIRMED` | **Pass** — HTTP 200 | High |
| TC-41 | FR-22 / TS-07-2 | Confirm empty pending order | BVA (empty) | Auth `$JWT(customer)`; empty `PENDING` order exists | `PUT /api/orders/pending/confirm` | `EmptyOrderException` (400); stays `PENDING` | **Fail (`DEF-02`)** — HTTP 500 (stays `PENDING`) | High |
| TC-42 | FR-22 / TS-07-3 | Confirm when no pending order exists | EG (negative) | Auth `$JWT(customer)`; no `PENDING` order | `PUT /api/orders/pending/confirm` | HTTP 404 Not Found | **Pass** — HTTP 404 | Medium |
| TC-43 | FR-23 / TS-08-1 | Cancel pending order containing dishes | EP (valid) | Auth `$JWT(customer)`; pending order has `>= 1` dish | `PUT /api/orders/pending/cancel` | HTTP 200; `status == CANCELED` | **Pass** — HTTP 200 | High |
| TC-44 | FR-23 / TS-08-2 | Cancel empty pending order | BVA (empty) | Auth `$JWT(customer)`; empty `PENDING` order exists | `PUT /api/orders/pending/cancel` | `EmptyOrderException` (400); stays `PENDING` | **Fail (`DEF-02`)** — HTTP 500 (stays `PENDING`) | Medium |
| TC-45 | FR-23 / TS-08-3 | Cancel when no pending order exists | EG (negative) | Auth `$JWT(customer)`; no `PENDING` order | `PUT /api/orders/pending/cancel` | HTTP 404 Not Found | **Pass** — HTTP 404 | Medium |

### 3.6 Security, JWT & Role Hierarchy

| ID | SRS / TS Ref | Test Title | Technique | Preconditions | Request (Method + Path + Body / Auth) | Expected Result (SRS) | Actual Observed / Status | Priority |
|---|---|---|---|---|---|---|---|---|
| TC-46 | NFR-03 / TS-09-6 | Unauthenticated request to protected endpoint | EG (negative) | No `Authorization` header | `GET /api/orders/pending` (or `/api/user/me`) | HTTP 401 Unauthorized | **Fail (`DEF-09`)** — Returns HTTP 403 Forbidden | High |
| TC-47 | NFR-03 / TS-02-4 | Protected endpoint with invalid/expired/malformed JWT | EP (invalid JWT) | Tampered/expired/malformed token | `GET /api/user/me` with `Authorization: Bearer <bad-jwt>` | HTTP 401 Unauthorized + JSON error body | **Pass** — HTTP 401 (`JwtExceptionHandler`) | High |
| TC-48 | NFR-04 / TS-09-2 | CUSTOMER attempts `POST /api/dishes/add` | EP (invalid role) | Auth `$JWT(customer)` | `POST /api/dishes/add` valid dish body | HTTP 403 Forbidden | **Pass** — HTTP 403 (via `@PreAuthorize`) | High |
| TC-49 | NFR-04 / TS-09-2 | CUSTOMER attempts `POST /api/restaurants/add` | EP (invalid role) | Auth `$JWT(customer)` | `POST /api/restaurants/add` `{"name":"Hack","description":"Denied"}` | HTTP 403 Forbidden | **Fail (`DEF-08`)** — HTTP 200 OK, restaurant created! | High |
| TC-50 | NFR-04 / TS-09-4 | OWNER accesses CUSTOMER order endpoint (`GET /api/orders/pending`) | EP (role hierarchy) | Auth `$JWT(owner)` | `GET /api/orders/pending` with `$JWT(owner)` | HTTP 200 OK (`OWNER` implies `CUSTOMER`) | **Pass** — HTTP 200 | Medium |

---

**Total test cases: 50 (`TC-01` to `TC-50`).**
Summary against SRS specification: **37 Pass**, **13 expose/document defects (`DEF-01`, `DEF-02`, `DEF-07`, `DEF-08`, `DEF-09`, `DEF-10`)** — all automated in `src/test/java/mk/ukim/finki/fooddeliverybackend/api/`.
