# Test Report — Food Delivery App Backend

## 1. Overview

| Item | Detail |
|---|---|
| Project | Software Testing — Group 8 |
| Application under test | Food-Delivery-App-SpringBoot-master (`food-delivery-backend`), Spring Boot 3.3.3 / Java 21 |
| Scope | User/Auth (JWT), Restaurant, Dish, Order modules — domain & application services, JWT helper/filter, REST API |
| Test levels executed | Unit testing (JUnit 5 + Mockito), API integration / automation testing (`@SpringBootTest` + `MockMvc` + Spring Security Test) |
| Coverage tooling | JaCoCo Maven Plugin `0.8.12` |
| Test date | 13 November 2026 |
| Environment | Windows 11, JDK 21.0.8 (Eclipse Adoptium), Maven Wrapper, H2 in-memory DB (`test` profile) |
| Command executed | `.\mvnw.cmd test` |
| Related documents | [TestPlan.md](./TestPlan.md), [TestSpecification.md](./TestSpecification.md), [TestCases.md](./TestCases.md), [UnitTestCases.md](./UnitTestCases.md), [DefectList.md](./DefectList.md), [SRS.md](./SRS.md) |

## 2. Automated Test Summary

| Level / Class | Tests run | Passed | Failed | Errors |
|---|---:|---:|---:|---:|
| Unit — `unit.UserServiceImplTest` | 9 | 9 | 0 | 0 |
| Unit — `unit.RestaurantServiceImplTest` | 8 | 8 | 0 | 0 |
| Unit — `unit.DishServiceImplTest` | 13 | 13 | 0 | 0 |
| Unit — `unit.OrderServiceImplTest` | 13 | 13 | 0 | 0 |
| Unit — `unit.DishApplicationServiceImplTest` | 10 | 10 | 0 | 0 |
| Unit — `unit.JwtHelperTest` | 3 | 3 | 0 | 0 |
| **Subtotal (Unit)** | **56** | **56** | **0** | **0** |
| API — `api.UserApiTest` | 14 | 14 | 0 | 0 |
| API — `api.RestaurantDishApiTest` | 25 | 25 | 0 | 0 |
| API — `api.OrderApiTest` | 16 | 16 | 0 | 0 |
| **Subtotal (API Integration)** | **55** | **55** | **0** | **0** |
| **Total** | **111** | **111** | **0** | **0** |

Maven Surefire summary (`13 Nov 2026`):

```text
Tests run: 16, Failures: 0, Errors: 0, Skipped: 0 -- in mk.ukim.finki.fooddeliverybackend.api.OrderApiTest
Tests run: 25, Failures: 0, Errors: 0, Skipped: 0 -- in mk.ukim.finki.fooddeliverybackend.api.RestaurantDishApiTest
Tests run: 14, Failures: 0, Errors: 0, Skipped: 0 -- in mk.ukim.finki.fooddeliverybackend.api.UserApiTest
Tests run: 10, Failures: 0, Errors: 0, Skipped: 0 -- in mk.ukim.finki.fooddeliverybackend.unit.DishApplicationServiceImplTest
Tests run: 13, Failures: 0, Errors: 0, Skipped: 0 -- in mk.ukim.finki.fooddeliverybackend.unit.DishServiceImplTest
Tests run: 3,  Failures: 0, Errors: 0, Skipped: 0 -- in mk.ukim.finki.fooddeliverybackend.unit.JwtHelperTest
Tests run: 13, Failures: 0, Errors: 0, Skipped: 0 -- in mk.ukim.finki.fooddeliverybackend.unit.OrderServiceImplTest
Tests run: 8,  Failures: 0, Errors: 0, Skipped: 0 -- in mk.ukim.finki.fooddeliverybackend.unit.RestaurantServiceImplTest
Tests run: 9,  Failures: 0, Errors: 0, Skipped: 0 -- in mk.ukim.finki.fooddeliverybackend.unit.UserServiceImplTest
Tests run: 111, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

## 3. Code Coverage Report (JaCoCo 0.8.12)

Generated automatically at `target/site/jacoco/index.html` and `target/site/jacoco/jacoco.csv`:

| Package | Instruction Coverage | Branch Coverage | Line Coverage |
|---|---:|---:|---:|
| `service.domain.impl` | 381 / 386 (**98.7%**) | 14 / 14 (**100.0%**) | 92 / 92 (**100.0%**) |
| `service.application.impl` | 254 / 254 (**100.0%**) | n/a | 74 / 74 (**100.0%**) |
| `web.controllers` | 219 / 219 (**100.0%**) | n/a | 71 / 71 (**100.0%**) |
| `web.exception` | 38 / 38 (**100.0%**) | n/a | 10 / 10 (**100.0%**) |
| `web.filters` (`JwtFilter`) | 100 / 125 (**80.0%**) | 10 / 18 (**55.6%**) | 30 / 34 (**88.2%**) |
| `helpers` (`JwtHelper`) | 90 / 90 (**100.0%**) | n/a | 25 / 25 (**100.0%**) |
| `config.security` | 219 / 219 (**100.0%**) | n/a | 38 / 38 (**100.0%**) |
| `dto.domain` & `dto.security` | 289 / 289 (**100.0%**) | n/a | 52 / 52 (**100.0%**) |
| `model.domain` | 140 / 152 (**92.1%**) | n/a | 50 / 54 (**92.6%**) |
| `model.exceptions` & `model.enums` | 108 / 108 (**100.0%**) | n/a | 23 / 23 (**100.0%**) |
| `config.initialization` (`DataInitializer`, `@Profile("!test")`) | 0 / 447 (0.0%) | n/a | 0 / 43 (0.0%) |
| **Total (all 44 classes)** | **1880 / 2377 (79.1%)** | **24 / 32 (75.0%)** | **476 / 530 (89.8%)** |
| **Total (excl. `@Profile("!test") DataInitializer`)** | **1880 / 1930 (97.4%)** | **24 / 32 (75.0%)** | **476 / 487 (97.7%)** |

> Note on `OrderServiceImpl`: 100% of lines (29/29) and 100% of branches (8/8) are covered; the 5 missed instructions correspond to the unused `DishRepository` field/parameter (`DEF-12`).

## 4. Detailed Findings & Black-Box Compliance

Out of 50 black-box system test cases in [TestCases.md](./TestCases.md):
- **37 Pass** against the SRS specification.
- **13 expose/characterize 12 logged defects** (`DEF-01` – `DEF-12` in [DefectList.md](./DefectList.md)).

Note that all 111 automated JUnit/MockMvc tests pass because negative/buggy SUT behaviors (e.g., `DEF-01`, `DEF-02`, `DEF-07`, `DEF-08`, `DEF-09`, `DEF-10`) are asserted as **characterization tests** so the unmodified open-source repository's behavior is reproducibly verified.

## 5. Verdict Against Exit Criteria

| Exit Criterion ([TestPlan.md](./TestPlan.md)) | Target | Actual | Met? |
|---|---|---|---|
| All automated unit & API tests execute with 0 failures | 100% (0 failures) | 111 / 111 passed (0 failures, 0 errors) | **Yes** |
| Core service branch coverage (`service.domain.impl`) | >= 80% | **100.0%** (14/14 branches) | **Yes** |
| All Priority-1 workflows tested | 100% | 100% covered across unit & API suites | **Yes** |
| **Release Gate:** No open High-severity defect without waiver | 0 open High | **1 Open High (`DEF-01`)** + 7 Medium (`DEF-02`, `DEF-06`, `DEF-08`, `DEF-09`, `DEF-10`, `DEF-11`) | **No** |

- **Test Execution Verdict:** **PASS** (111/111 automated tests pass; 100% branch coverage on domain services).
- **Release Readiness Verdict:** **CONDITIONAL FAIL / NOT READY FOR PRODUCTION** — the unmodified System Under Test has an unpatched High-severity stock-integrity defect (`DEF-01`) and Medium-severity security/validation defects (`DEF-02`, `DEF-06`, `DEF-08`, `DEF-09`, `DEF-10`, `DEF-11`).

## 6. Recommendations

1. **Fix `DEF-01` (High):** Verify `order.getDishes().contains(dish)` / `remove(dish)` before calling `dish.increaseQuantity()` in `DishServiceImpl.removeFromOrder`.
2. **Fix `DEF-08` (Medium):** Reorder `JwtSecurityWebConfig` matchers so `/api/restaurants/add` precedes `/api/restaurants/{id}` and add `@PreAuthorize("hasRole('OWNER')")` on `RestaurantController` and `DishController` mutation endpoints (`DEF-12`).
3. **Fix `DEF-02` & `DEF-09` (Medium):** Add a `@RestControllerAdvice` for domain exceptions (400/401/404/409) and a custom `AuthenticationEntryPoint` returning 401.
4. **Fix `DEF-10` (Medium):** Add Jakarta Bean Validation annotations (`@NotBlank`, `@Positive`, `@Email`) and `@Valid` on controller DTOs.
5. **Fix `DEF-06` & `DEF-11` (Medium):** Externalize JWT secret & shorten expiration; replace `@Data` on `Dish`/`Restaurant` with `@Getter`/`@Setter` and excluded relationships.
