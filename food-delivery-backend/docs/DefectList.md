# Defect List — Food Delivery Backend

- **Project:** Food Delivery App — `food-delivery-backend` (Spring Boot 3.3.3, Java 21)
- **Team:** Group 8
- **Date:** November 19, 2026 (documentation review and 111-test rerun; original execution baseline November 13)
- **Method:** Static code inspection of `src/main/java/mk/ukim/finki/fooddeliverybackend/**`, JUnit 5 + Mockito unit testing, and MockMvc API integration testing. Each entry identifies a source-confirmed defect, implementation limitation or design observation; only the named tests provide dynamic evidence. No exploit, concurrency or default-profile seeding run is implied.
- **Related documents:** [TestReport.md](./TestReport.md), [TestSpecification.md](./TestSpecification.md), [TestCases.md](./TestCases.md), [UnitTestCases.md](./UnitTestCases.md)

## 1. Defect Summary Table

| ID | Severity | Module | Description | Steps to Reproduce | Expected vs Actual | Status / evidence |
|----|----------|--------|-------------|--------------------|--------------------|--------|
| DEF-01 | High | Dish / Order | `DishServiceImpl.removeFromOrder` increments dish quantity and saves even if the dish was never in the order — no membership check; `order.getDishes().remove(dish)` returns false while stock is already inflated | Call `POST /api/dishes/{id}/remove-from-order` for a dish not in the customer's pending order | Expected: error or no state change. Actual: 200 OK, dish quantity +1, order unchanged | Open (characterized in `DishServiceImplTest`, `OrderApiTest`) |
| DEF-02 | Medium | Exception Handling | Domain exceptions (`RestaurantNotFoundException`, `DishNotFoundException`, `DishOutOfStockException`, `EmptyOrderException`, `UsernameAlreadyExistsException`, `IncorrectPasswordException`) lack a `@RestControllerAdvice` handler, propagating as HTTP 500 instead of 400/401/404/409 | Trigger any domain exception via REST API (e.g., `POST /api/dishes/add` with `restaurantId=999999`, or duplicate register, or wrong password) | Expected: structured 4xx status. Actual: unhandled `ServletException` / HTTP 500 | Open (characterized in `UserApiTest`, `RestaurantDishApiTest`, `OrderApiTest`) |
| DEF-03 | Medium | Order | `OrderServiceImpl.findOrCreatePending` resolves the user via `userRepository.findByUsername`, then calls `findPending(username)` which executes the same lookup again — redundant DB call | Call `GET /api/orders/pending` (or add/remove-to-order) with SQL logging enabled | Expected: one user lookup. Actual: two identical `findByUsername` queries per request | Open |
| DEF-04 | Low | Security / Config | `JwtSecurityWebConfig.corsConfigurationSource` hard-codes `"http://localhost:3000"` instead of externalizing allowed origins; order-mutating endpoints rely solely on URL matchers without `@PreAuthorize` | Inspect `corsConfigurationSource()` in `JwtSecurityWebConfig.java` | Expected: configurable allowed origins. Actual: hard-coded single origin | Open |
| DEF-05 | Low | User / Auth | `User` entity `UserDetails` methods (`isAccountNonExpired`, `isAccountNonLocked`, `isCredentialsNonExpired`, `isEnabled`) delegate to `UserDetails.super.*` and always return `true` | Inspect `model/domain/User.java` lines 57–75 | Expected: persisted lifecycle flags. Actual: all accounts permanently enabled/unlocked | Open |
| DEF-06 | Medium | Security / JWT | JWT HMAC signing key hard-coded in source (`JwtConstants.SECRET_KEY`) and token expiration fixed at 10 days (`864000000L` ms) with no revocation | Read `constants/JwtConstants.java`; sign a token with the committed key | Expected: externalized secret, short-lived tokens. Actual: secret in VCS, 10-day tokens | Open |
| DEF-07 | Low | Order / Dish | Repeated additions append repeated `Dish` entries in `Order.dishes`; there is no dedicated order-line quantity or price snapshot | Add the same in-stock dish twice; inspect order entries and stock | Current representation: two entries, stock reduced by 2. A merged line with quantity 2 is a proposed design improvement, not an existing SRS acceptance rule | Open design observation (representation characterized in `OrderApiTest`) |
| DEF-08 | Medium | Security / Config | URL pattern matching order in `JwtSecurityWebConfig`: `/api/restaurants/{id}` (CUSTOMER rule) matches before `/api/restaurants/add` (OWNER rule), allowing CUSTOMER to create restaurants | Authenticate as CUSTOMER, send `POST /api/restaurants/add` | Expected: 403 Forbidden. Actual: 200 OK, restaurant created | Open (characterized in `RestaurantDishApiTest`) |
| DEF-09 | Medium | Security / Auth | No custom `AuthenticationEntryPoint` configured in `JwtSecurityWebConfig`; unauthenticated requests and `UsernameNotFoundException` on login return HTTP 403 Forbidden instead of HTTP 401 Unauthorized | Send `GET /api/user/me` or `GET /api/orders/pending` without `Authorization` header | Expected: 401 Unauthorized. Actual: 403 Forbidden | Open (characterized in `UserApiTest`, `OrderApiTest`) |
| DEF-10 | Medium | Validation / DTOs | Request DTOs (`RegisterUserRequestDto`, `CreateRestaurantDto`, `CreateDishDto`) lack Bean Validation (`@Valid`, `@NotBlank`, `@Positive`); missing password causes `IllegalArgumentException` (500) and empty restaurant names are persisted | `POST /api/user/register` with `{"username":"nofields"}` or `POST /api/restaurants/add` with `{"name":""}` | Expected: 400 Bad Request. Actual: 500 on null password; 200 persisted on empty name | Open (null-password behavior characterized in `UserApiTest`; empty-name persistence source-inspected, no direct API case) |
| DEF-11 | Medium | Domain Model / JPA | Bidirectional Lombok `@Data` on `Dish` (`@ManyToOne Restaurant`) and `Restaurant` (`@OneToMany List<Dish>`) generates cyclic `equals`/`hashCode`/`toString`, causing `StackOverflowError` on populated graphs | Call `toString()` or `hashCode()` on a `Restaurant` whose `dishes` list contains a `Dish` referencing that `Restaurant` | Expected: safe `equals`/`hashCode`/`toString`. Actual: infinite recursion (`StackOverflowError`) | Open |
| DEF-12 | Low | Code Quality | `OrderServiceImpl` injects unused `DishRepository` (and unused `Transactional` import); `JwtHelper.buildToken` ignores its `expiration` parameter and hardcodes `JwtConstants.EXPIRATION_TIME`; `RestaurantController` and `DishController` (`edit`/`delete`) lack `@PreAuthorize` defense-in-depth | Inspect `OrderServiceImpl.java`, `JwtHelper.java`, `RestaurantController.java`, `DishController.java` | Expected: clean dependencies, honored parameters, consistent method security | Open |

**Register distribution:** 1 High, 7 Medium, 4 Low (**12 open findings**, retaining DEF-01–DEF-12). This includes the Low design observation DEF-07; it is not counted as a failed SRS requirement. All findings remain unresolved as of November 19, 2026. DEF-03/04/05/06/11/12 have source-inspection evidence; DEF-01/02/08/09/10 have dynamic evidence for the named paths, and DEF-07 has a representation characterization.

Suggested HTTP 500 descriptions refer to the normal deployed-server consequence of an unhandled exception. MockMvc tests for those paths assert a `ServletException` and root cause, not a rendered HTTP 500 response. Reproduction steps without a named execution are instructions, not proof that the request or exploit was run.

## 2. Key Defect Details

### DEF-01 — `removeFromOrder` increases quantity even when dish is not in the order (High)
- **File:** `src/main/java/mk/ukim/finki/fooddeliverybackend/service/domain/impl/DishServiceImpl.java` (lines 70–76)
- **Root Cause:** `dish.increaseQuantity()` and `dishRepository.save(dish)` execute unconditionally before `order.getDishes().remove(dish)`. Because `DishApplicationServiceImpl.removeFromOrder` is `@Transactional`, the inflated stock count commits even when `remove(dish)` returns `false`.
- **Recommendation:** Check `if (!order.getDishes().remove(dish))` (or throw a domain exception) before incrementing stock.

### DEF-02 — Unhandled domain exceptions return HTTP 500 (Medium)
- **Files:** `web/exception/JwtExceptionHandler.java` (handles JWT exceptions only); `service/domain/impl/*`, `service/application/impl/*`
- **Root Cause:** No `@RestControllerAdvice` maps `DishNotFoundException`, `RestaurantNotFoundException`, `UserNotFoundException` (404), `UsernameAlreadyExistsException` (409), `IncorrectPasswordException` (401), or `DishOutOfStockException` / `EmptyOrderException` (400).

### DEF-08 — URL pattern matching order allows CUSTOMER to create restaurants (Medium)
- **File:** `src/main/java/mk/ukim/finki/fooddeliverybackend/config/security/JwtSecurityWebConfig.java` (lines 86–107)
- **Root Cause:** `/api/restaurants/{id}` (CUSTOMER) is declared before `/api/restaurants/add` (OWNER), and `RestaurantController.save` has no `@PreAuthorize("hasRole('OWNER')")`.
- **Recommendation:** Place `/api/restaurants/add` before `/api/restaurants/{id}` (or restrict `{id}` to digits) and add `@PreAuthorize("hasRole('OWNER')")` on controller mutation methods.

### DEF-09 — Missing credentials and unknown-user login return HTTP 403 instead of HTTP 401 (Medium)
- **File:** `src/main/java/mk/ukim/finki/fooddeliverybackend/config/security/JwtSecurityWebConfig.java`
- **Root Cause:** No 401 `AuthenticationEntryPoint` is configured; missing credentials and unknown-user login are routed to 403. This does not apply to invalid-signature/expired/malformed JWTs handled by the JWT advice, which return 401.
- **Evidence:** `UserApiTest.unauthenticatedAccessToMeReturns403`, `UserApiTest.loginWithUnknownUsernameReturns403`, and `OrderApiTest.unauthenticatedOrderAccessReturns403`. TC-06 and TC-46 fail the intended 401 contract even though these characterization tests pass.

### DEF-10 — Missing Bean Validation on Request DTOs (Medium)
- **Files:** `dto/domain/RegisterUserRequestDto.java`, `CreateRestaurantDto.java`, `CreateDishDto.java`, and controllers
- **Root Cause:** No Jakarta Validation annotations (`@NotBlank`, `@Positive`, `@NotNull`, `@Email`) or `@Valid` parameters on controller endpoints.

### DEF-11 — Bidirectional Lombok `@Data` causes `StackOverflowError` (Medium)
- **Files:** `model/domain/Dish.java`, `model/domain/Restaurant.java`
- **Root Cause:** Lombok `@Data` includes `@ToString` and `@EqualsAndHashCode` across all fields, creating a mutual cycle between `Restaurant.dishes` and `Dish.restaurant`.
- **Recommendation:** Replace `@Data` on JPA entities with `@Getter`/`@Setter` and `@ToString.Exclude` / `@EqualsAndHashCode(onlyExplicitlyIncluded = true)` on relationships.

## 3. Open Product Decisions and Verification Gaps

- **Cancellation restocking:** FR-23 requires a status transition, not a stock policy. `OrderServiceImpl.cancel` changes the status without restoring stock; the companion frontend promises restoration. Resolve the policy before adding a requirement or counting this mismatch as a backend SRS failure. Existing cancellation tests do not assert stock.
- **Referenced deletion:** The intended behavior when deleting a restaurant with dishes, or a dish referenced by orders, is not specified or directly tested. Existing deletion tests use suitable deletable fixtures.
- **Concurrency:** Sequential tests do not establish stock safety or unique pending-order creation across concurrent requests. This is an unverified NFR-02/NFR-06 target, not a reproduced concurrency defect.
- **Lifecycle/configuration observations:** DEF-03 (redundant lookup), DEF-04 (hard-coded CORS), DEF-05 (unsupported account lifecycle) and DEF-12 (code quality/defense in depth) are inspection findings; no performance loss, account-administration feature or standalone exploit test is claimed.
