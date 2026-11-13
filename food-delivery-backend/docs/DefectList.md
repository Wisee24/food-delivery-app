# Defect List — Food Delivery Backend

- **Project:** Food Delivery App — `food-delivery-backend` (Spring Boot 3.3.3, Java 21)
- **Team:** Group 8
- **Date:** November 13, 2026
- **Method:** Static code inspection of `src/main/java/mk/ukim/finki/fooddeliverybackend/**`, JUnit 5 + Mockito unit testing, and MockMvc API integration testing. Every defect below was verified against the actual source code and/or automated characterization tests.
- **Related documents:** [TestReport.md](./TestReport.md), [TestSpecification.md](./TestSpecification.md), [TestCases.md](./TestCases.md), [UnitTestCases.md](./UnitTestCases.md)

## 1. Defect Summary Table

| ID | Severity | Module | Description | Steps to Reproduce | Expected vs Actual | Status |
|----|----------|--------|-------------|--------------------|--------------------|--------|
| DEF-01 | High | Dish / Order | `DishServiceImpl.removeFromOrder` increments dish quantity and saves even if the dish was never in the order — no membership check; `order.getDishes().remove(dish)` returns false while stock is already inflated | Call `POST /api/dishes/{id}/remove-from-order` for a dish not in the customer's pending order | Expected: error or no state change. Actual: 200 OK, dish quantity +1, order unchanged | Open (characterized in `DishServiceImplTest`, `OrderApiTest`) |
| DEF-02 | Medium | Exception Handling | Domain exceptions (`RestaurantNotFoundException`, `DishNotFoundException`, `DishOutOfStockException`, `EmptyOrderException`, `UsernameAlreadyExistsException`, `IncorrectPasswordException`) lack a `@RestControllerAdvice` handler, propagating as HTTP 500 instead of 400/401/404/409 | Trigger any domain exception via REST API (e.g., `POST /api/dishes/add` with `restaurantId=999999`, or duplicate register, or wrong password) | Expected: structured 4xx status. Actual: unhandled `ServletException` / HTTP 500 | Open (characterized in `UserApiTest`, `RestaurantDishApiTest`, `OrderApiTest`) |
| DEF-03 | Medium | Order | `OrderServiceImpl.findOrCreatePending` resolves the user via `userRepository.findByUsername`, then calls `findPending(username)` which executes the same lookup again — redundant DB call | Call `GET /api/orders/pending` (or add/remove-to-order) with SQL logging enabled | Expected: one user lookup. Actual: two identical `findByUsername` queries per request | Open |
| DEF-04 | Low | Security / Config | `JwtSecurityWebConfig.corsConfigurationSource` hard-codes `"http://localhost:3000"` instead of externalizing allowed origins; order-mutating endpoints rely solely on URL matchers without `@PreAuthorize` | Inspect `corsConfigurationSource()` in `JwtSecurityWebConfig.java` | Expected: configurable allowed origins. Actual: hard-coded single origin | Open |
| DEF-05 | Low | User / Auth | `User` entity `UserDetails` methods (`isAccountNonExpired`, `isAccountNonLocked`, `isCredentialsNonExpired`, `isEnabled`) delegate to `UserDetails.super.*` and always return `true` | Inspect `model/domain/User.java` lines 57–75 | Expected: persisted lifecycle flags. Actual: all accounts permanently enabled/unlocked | Open |
| DEF-06 | Medium | Security / JWT | JWT HMAC signing key hard-coded in source (`JwtConstants.SECRET_KEY`) and token expiration fixed at 10 days (`864000000L` ms) with no revocation | Read `constants/JwtConstants.java`; sign a token with the committed key | Expected: externalized secret, short-lived tokens. Actual: secret in VCS, 10-day tokens | Open |
| DEF-07 | Low | Order / Dish | `DishServiceImpl.addToOrder` appends the dish to `Order.dishes` (`@ManyToMany List<Dish>`) on every call — adding the same dish twice creates duplicate entries instead of line quantities | Call `POST /api/dishes/{id}/add-to-order` twice for the same dish | Expected: single order line with quantity 2. Actual: two duplicate `Dish` entries in `dishes[]` | Open (characterized in `OrderApiTest`) |
| DEF-08 | Medium | Security / Config | URL pattern matching order in `JwtSecurityWebConfig`: `/api/restaurants/{id}` (CUSTOMER rule) matches before `/api/restaurants/add` (OWNER rule), allowing CUSTOMER to create restaurants | Authenticate as CUSTOMER, send `POST /api/restaurants/add` | Expected: 403 Forbidden. Actual: 200 OK, restaurant created | Open (characterized in `RestaurantDishApiTest`) |
| DEF-09 | Medium | Security / Auth | No custom `AuthenticationEntryPoint` configured in `JwtSecurityWebConfig`; unauthenticated requests and `UsernameNotFoundException` on login return HTTP 403 Forbidden instead of HTTP 401 Unauthorized | Send `GET /api/user/me` or `GET /api/orders/pending` without `Authorization` header | Expected: 401 Unauthorized. Actual: 403 Forbidden | Open (characterized in `UserApiTest`, `OrderApiTest`) |
| DEF-10 | Medium | Validation / DTOs | Request DTOs (`RegisterUserRequestDto`, `CreateRestaurantDto`, `CreateDishDto`) lack Bean Validation (`@Valid`, `@NotBlank`, `@Positive`); missing password causes `IllegalArgumentException` (500) and empty restaurant names are persisted | `POST /api/user/register` with `{"username":"nofields"}` or `POST /api/restaurants/add` with `{"name":""}` | Expected: 400 Bad Request. Actual: 500 on null password; 200 persisted on empty name | Open (characterized in `UserApiTest`) |
| DEF-11 | Medium | Domain Model / JPA | Bidirectional Lombok `@Data` on `Dish` (`@ManyToOne Restaurant`) and `Restaurant` (`@OneToMany List<Dish>`) generates cyclic `equals`/`hashCode`/`toString`, causing `StackOverflowError` on populated graphs | Call `toString()` or `hashCode()` on a `Restaurant` whose `dishes` list contains a `Dish` referencing that `Restaurant` | Expected: safe `equals`/`hashCode`/`toString`. Actual: infinite recursion (`StackOverflowError`) | Open |
| DEF-12 | Low | Code Quality | `OrderServiceImpl` injects unused `DishRepository` (and unused `Transactional` import); `JwtHelper.buildToken` ignores its `expiration` parameter and hardcodes `JwtConstants.EXPIRATION_TIME`; `RestaurantController` and `DishController` (`edit`/`delete`) lack `@PreAuthorize` defense-in-depth | Inspect `OrderServiceImpl.java`, `JwtHelper.java`, `RestaurantController.java`, `DishController.java` | Expected: clean dependencies, honored parameters, consistent method security | Open |

**Severity distribution:** 1 High, 7 Medium, 4 Low (**12 total**). All defects remain Open in the unmodified System Under Test as of November 13, 2026.

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

### DEF-09 — Unauthenticated requests return HTTP 403 instead of HTTP 401 (Medium)
- **File:** `src/main/java/mk/ukim/finki/fooddeliverybackend/config/security/JwtSecurityWebConfig.java`
- **Root Cause:** Default `Http403ForbiddenEntryPoint` is used because `.exceptionHandling(e -> e.authenticationEntryPoint(...))` is not configured.

### DEF-10 — Missing Bean Validation on Request DTOs (Medium)
- **Files:** `dto/domain/RegisterUserRequestDto.java`, `CreateRestaurantDto.java`, `CreateDishDto.java`, and controllers
- **Root Cause:** No Jakarta Validation annotations (`@NotBlank`, `@Positive`, `@NotNull`, `@Email`) or `@Valid` parameters on controller endpoints.

### DEF-11 — Bidirectional Lombok `@Data` causes `StackOverflowError` (Medium)
- **Files:** `model/domain/Dish.java`, `model/domain/Restaurant.java`
- **Root Cause:** Lombok `@Data` includes `@ToString` and `@EqualsAndHashCode` across all fields, creating a mutual cycle between `Restaurant.dishes` and `Dish.restaurant`.
- **Recommendation:** Replace `@Data` on JPA entities with `@Getter`/`@Setter` and `@ToString.Exclude` / `@EqualsAndHashCode(onlyExplicitlyIncluded = true)` on relationships.
