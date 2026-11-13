# Test Specification — Food Delivery Backend

**Group 8** — companion to Test Plan `TP-G8-FDB-2026-001` and [SRS.md](./SRS.md).
Techniques: `EP` = Equivalence Partitioning, `BVA` = Boundary Value Analysis, `EG` = Error Guessing, `SC/BC` = Statement/Branch Coverage.
Priority: `P1` = Critical, `P2` = High, `P3` = Medium.

---

## 1. User Registration & Lookup

| Field | Value |
|---|---|
| Spec ID | TS-01 |
| Associated SRS Requirements | `FR-01` (register), `FR-02` (duplicate username), `FR-05` (admin lookup), `FR-06` (`/me`), `NFR-03`, `NFR-05` |
| Technique | EP, BVA, EG, SC/BC (duplicate-username branch) |

| TC | Inputs | Expected output (per SRS) | Pass/Fail criteria & Defect Notes | Priority |
|---|---|---|---|---|
| TS-01-1 | New unique username, valid password, name, surname, email | 200 OK, user persisted with `ROLE_CUSTOMER` & encoded password | User retrievable; password not returned in response | P1 |
| TS-01-2 | Duplicate existing username | Rejected (`UsernameAlreadyExistsException` -> 4xx) | Username count remains 1 (SUT returns 500; see `DEF-02`) | P1 |
| TS-01-3 | Missing/null password or empty fields | Rejected with 400 validation error | No user persisted (SUT lacks `@Valid`, throws `IllegalArgumentException` -> 500; see `DEF-10`) | P2 |
| TS-01-4 | `GET /api/user/me` with valid JWT | 200 OK with current user's profile & role | Username and email match JWT subject | P1 |
| TS-01-5 | `GET /api/user/{username}` as `ADMIN` (existing / missing) | 200 OK for existing; 404 for missing | Non-ADMIN caller receives 403 | P2 |

## 2. User Login & JWT Validation

| Field | Value |
|---|---|
| Spec ID | TS-02 |
| Associated SRS Requirements | `FR-03` (login / JWT issuance), `FR-04` (wrong password), `NFR-03`, `NFR-05` |
| Technique | EP, EG, SC/BC (wrong-password & unknown-user branches, JWT filter branches) |

| TC | Inputs | Expected output (per SRS) | Pass/Fail criteria & Defect Notes | Priority |
|---|---|---|---|---|
| TS-02-1 | Correct username + password | 200 OK + signed JWT token | Token authenticates subsequent requests | P1 |
| TS-02-2 | Correct username, wrong password | Rejected (`IncorrectPasswordException` -> 401) | No token issued (SUT returns 500; see `DEF-02`) | P1 |
| TS-02-3 | Non-existent username | Rejected (401/403) | `UsernameNotFoundException` caught by Spring Security -> 403 (see `DEF-09`) | P2 |
| TS-02-4 | Protected endpoint with invalid signature, expired, or malformed JWT | 401 Unauthorized (`JwtExceptionResponseDto`) | Handled by `JwtFilter` + `JwtExceptionHandler` | P1 |

## 3. Restaurant CRUD

| Field | Value |
|---|---|
| Spec ID | TS-03 |
| Associated SRS Requirements | `FR-07`..`FR-11` (list/view/add/edit/delete restaurant) |
| Technique | EP, BVA, EG, SC/BC |

| TC | Inputs | Expected output (per SRS) | Pass/Fail criteria & Defect Notes | Priority |
|---|---|---|---|---|
| TS-03-1 | `POST /api/restaurants/add` with valid payload (`OWNER`) | 200 OK, created with generated id | Fields (`id`, `name`, `description`) round-trip | P1 |
| TS-03-2 | `GET /api/restaurants` and `GET /api/restaurants/{id}` (`CUSTOMER`) | 200 OK + JSON list/object | Matches stored records | P1 |
| TS-03-3 | `GET` / `PUT` / `DELETE` non-existent restaurant id | 404 Not Found | Empty body, no mutation | P1 |
| TS-03-4 | `PUT /api/restaurants/{id}/edit` valid id with changed fields (`OWNER`) | 200 OK, fields persisted | Updated values returned and stored | P2 |
| TS-03-5 | `DELETE /api/restaurants/{id}/delete` valid id (`OWNER`) | 200 OK, deleted; subsequent GET -> 404 | Record removed from DB | P2 |
| TS-03-6 | `POST /api/restaurants/add` with empty name | Rejected with 400 validation error | SUT lacks `@Valid` and persists empty name (`DEF-10`) | P3 |

## 4. Dish CRUD

| Field | Value |
|---|---|
| Spec ID | TS-04 |
| Associated SRS Requirements | `FR-12`..`FR-17` (list/view/details/add/edit/delete dish) |
| Technique | EP, BVA, EG, SC/BC |

| TC | Inputs | Expected output (per SRS) | Pass/Fail criteria & Defect Notes | Priority |
|---|---|---|---|---|
| TS-04-1 | `POST /api/dishes/add` valid dish (`name`, `price`, `quantity >= 1`, valid `restaurantId`) as `OWNER` | 200 OK, created | Dish retrievable via `GET /api/dishes/{id}` | P1 |
| TS-04-2 | `GET` / `GET details` / `PUT` / `DELETE` existing dish id | 200 OK per verb; details includes nested `restaurant` | State matches expectation | P1 |
| TS-04-3 | Any CRUD verb on non-existent dish id | 404 Not Found | Status 404 | P1 |
| TS-04-4 | `POST` / `PUT` dish with non-existent `restaurantId` | 404 Not Found (`RestaurantNotFoundException`) | SUT returns 500 (`DEF-02`) | P2 |
| TS-04-5 | Negative price / negative quantity / empty name | Rejected with 400 validation error | SUT lacks `@Valid` (`DEF-10`) | P3 |

## 5. Add-to-Order

| Field | Value |
|---|---|
| Spec ID | TS-05 |
| Associated SRS Requirements | `FR-18`, `FR-19`, `FR-20`, `NFR-06` |
| Technique | EP, BVA, EG, SC/BC (`quantity <= 0` branch -> `DishOutOfStockException`) |

| TC | Inputs | Expected output (per SRS) | Pass/Fail criteria & Defect Notes | Priority |
|---|---|---|---|---|
| TS-05-1 | Add dish with `quantity > 1` (`CUSTOMER`) | 200 OK; stock decremented by 1 | `stock == N - 1`; dish in pending order | P1 |
| TS-05-2 | Boundary: add dish with `quantity == 1`, then add same dish again | 1st call: 200 OK (stock becomes `0`); 2nd call: `DishOutOfStockException` | Stock does not go negative | P1 |
| TS-05-3 | Add dish with `quantity == 0` (out-of-stock) | `DishOutOfStockException` (4xx intended; 500 actual `DEF-02`) | Order unchanged, stock stays 0 | P1 |
| TS-05-4 | Add non-existent dish id | `DishNotFoundException` (404 intended; 500 actual `DEF-02`) | Order unchanged | P2 |
| TS-05-5 | Add same dish twice while `quantity >= 2` | Single line with qty 2 or distinct entries per design | SUT appends duplicate `List<Dish>` entries (`DEF-07`) | P3 |

## 6. Remove-from-Order

| Field | Value |
|---|---|
| Spec ID | TS-06 |
| Associated SRS Requirements | `FR-21`, `NFR-06` |
| Technique | EP, EG, SC/BC |

| TC | Inputs | Expected output (per SRS) | Pass/Fail criteria & Defect Notes | Priority |
|---|---|---|---|---|
| TS-06-1 | Remove a dish previously added to pending order | 200 OK; dish removed, stock incremented by 1 | `stock == N + 1` | P1 |
| TS-06-2 | Remove a dish **not** present in the pending order | Rejected or no stock change | **High Defect `DEF-01`**: SUT increments stock anyway (+1) | P1 |
| TS-06-3 | Remove non-existent dish id | `DishNotFoundException` (404 intended; 500 actual `DEF-02`) | Order unchanged | P2 |

## 7. Confirm Order

| Field | Value |
|---|---|
| Spec ID | TS-07 |
| Associated SRS Requirements | `FR-18`, `FR-22`, `NFR-07` |
| Technique | EP, EG, SC/BC (empty-order guard -> `EmptyOrderException`) |

| TC | Inputs | Expected output (per SRS) | Pass/Fail criteria & Defect Notes | Priority |
|---|---|---|---|---|
| TS-07-1 | Confirm pending order containing `>= 1` dish | 200 OK; status == `CONFIRMED` | Status persisted | P1 |
| TS-07-2 | Confirm empty pending order | `EmptyOrderException` (4xx intended; 500 actual `DEF-02`) | Status stays `PENDING` | P1 |
| TS-07-3 | Confirm when user has no pending order (or already `CONFIRMED`) | 404 Not Found | Empty body, no mutation | P2 |

## 8. Cancel Order

| Field | Value |
|---|---|
| Spec ID | TS-08 |
| Associated SRS Requirements | `FR-18`, `FR-23`, `NFR-07` |
| Technique | EP, EG, SC/BC (empty-order guard) |

| TC | Inputs | Expected output (per SRS) | Pass/Fail criteria & Defect Notes | Priority |
|---|---|---|---|---|
| TS-08-1 | Cancel pending order containing `>= 1` dish | 200 OK; status == `CANCELED` | Status persisted | P1 |
| TS-08-2 | Cancel empty pending order | `EmptyOrderException` (4xx intended; 500 actual `DEF-02`) | Status stays `PENDING` | P1 |
| TS-08-3 | Cancel when user has no pending order (or already `CANCELED`) | 404 Not Found | Empty body, no mutation | P2 |

## 9. Security / Role Hierarchy Enforcement

| Field | Value |
|---|---|
| Spec ID | TS-09 |
| Associated SRS Requirements | `FR-05`..`FR-23`, `NFR-03`, `NFR-04` |
| Technique | EP (role x endpoint matrix), EG, SC/BC (`JwtSecurityWebConfig` filter chain + `@PreAuthorize`) |

| TC | Inputs | Expected output (per SRS) | Pass/Fail criteria & Defect Notes | Priority |
|---|---|---|---|---|
| TS-09-1 | `CUSTOMER` accesses browsing & order endpoints | Allowed (200 OK) | Order & catalog operations succeed | P1 |
| TS-09-2 | `CUSTOMER` attempts `POST /api/restaurants/add`, `PUT/DELETE` restaurant/dish, or `POST /api/dishes/add` | 403 Forbidden | **Defect `DEF-08`**: `POST /api/restaurants/add` returns 200 for `CUSTOMER` due to `/api/restaurants/{id}` pattern order; all other OWNER endpoints return 403 | P1 |
| TS-09-3 | `OWNER` manages restaurants and dishes | Allowed (200 OK) | Mutations persisted | P1 |
| TS-09-4 | `OWNER` accesses `CUSTOMER` order endpoints (`GET /api/orders/pending`, etc.) | Allowed (200 OK) via `RoleHierarchy` (`OWNER` implies `CUSTOMER`) | Role inheritance verified | P2 |
| TS-09-5 | `ADMIN` vs `CUSTOMER` accessing `GET /api/user/{username}` | `ADMIN`: 200/404; `CUSTOMER`: 403 Forbidden | `.anyRequest().hasRole("ADMIN")` enforced | P1 |
| TS-09-6 | Unauthenticated request to any protected endpoint (no JWT) | 401 Unauthorized | SUT returns 403 (no `AuthenticationEntryPoint`; see `DEF-09`) | P1 |

---

*End of Test Specification — Group 8.*
