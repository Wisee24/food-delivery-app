# Mid-Term Progress Report — Group 8

- **Course project:** Software Testing
- **Team:** Group 8
- **Application under test:** Food-Delivery-App-SpringBoot-master (`food-delivery-backend`)
- **Documentation revision:** November 19, 2026

## 1. Chosen Application and Why

Group 8 selected the open-source project **Food-Delivery-App-SpringBoot-master**, a food delivery backend built with Spring Boot 3.3.3 (Java 21). Reasons for the choice:

- **Complete, self-contained REST API** with a clear domain: user registration/login (JWT), restaurant management, dish catalog, and an order lifecycle (`PENDING` -> `CONFIRMED` / `CANCELED`).
- **Layered architecture** (`controller` -> `application service` -> `domain service` -> `repository`) that supports testing at multiple levels: unit tests with mocked dependencies (JUnit 5 + Mockito) and API integration/automation tests (`MockMvc`).
- **Role-based security** (`CUSTOMER` / `OWNER` / `ADMIN` with `RoleHierarchy`) provides meaningful authorization test scenarios.
- **H2 in-memory database** — no external database setup; tests and coverage run with `.\mvnw.cmd test` using Java 21. Starting the application is a separate `.\mvnw.cmd spring-boot:run` command.
- **Manageable size** — 56 production Java source types across four business modules; JaCoCo counts 44 classes with executable instructions (interfaces have no executable counters). This supports a focused semester project; it does not imply exhaustive testing.

## 2. Work Completed So Far

| # | Activity | Artifact | Status |
|---|----------|----------|--------|
| 1 | Requirements analysis & UML modeling | [SRS.md](./SRS.md) (FR-01..FR-24, NFR-01..NFR-13, Use Case, Class, Sequence, State, Activity diagrams) | Done |
| 2 | Test planning | [TestPlan.md](./TestPlan.md) | Done |
| 3 | Test specification | [TestSpecification.md](./TestSpecification.md) (FR-01..FR-24 traceability and explicit evidence gaps; seed initialization is source-inspected) | Done |
| 4 | Black-box test case design (Lab 1) | [TestCases.md](./TestCases.md) (50 test cases: `TC-01`..`TC-50`) | Done |
| 5 | Unit test design (Lab 2) | [UnitTestCases.md](./UnitTestCases.md) (56 unit test designs: `UT-01`..`UT-56`) | Done |
| 6 | Unit test implementation (Lab 3) | `src/test/java/.../unit/`: 6 classes, 56 methods (JUnit 5 + Mockito) | Done — 56/56 passing |
| 7 | API integration / automation tests (Lab 3) | `src/test/java/.../api/`: 3 classes, 55 methods (`MockMvc`) | Done — 55/55 passing |
| 8 | Test execution & JaCoCo coverage | `.\mvnw.cmd test` — 111/111 pass, 100% domain service branch coverage | Done |
| 9 | Defect logging (Lab 4) | [DefectList.md](./DefectList.md) — 12 open findings (1 High, 7 Medium, 4 Low), including design observation DEF-07 | Done |
| 10 | Test report (Lab 4) | [TestReport.md](./TestReport.md) (Surefire + JaCoCo summary + release verdict) | Done |

## 3. Current Status — Test & Coverage Results (verified November 19, 2026)

```text
Tests run: 111, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

| Suite | Level | Tests | Passed |
|---|---|---:|---:|
| `UserServiceImplTest` | Unit | 9 | 9 |
| `RestaurantServiceImplTest` | Unit | 8 | 8 |
| `DishServiceImplTest` | Unit | 13 | 13 |
| `OrderServiceImplTest` | Unit | 13 | 13 |
| `DishApplicationServiceImplTest` | Unit | 10 | 10 |
| `JwtHelperTest` | Unit | 3 | 3 |
| `UserApiTest` | API integration | 14 | 14 |
| `RestaurantDishApiTest` | API integration | 25 | 25 |
| `OrderApiTest` | API integration | 16 | 16 |
| **Total** | | **111** | **111** |

- **JaCoCo Coverage:** `service.domain.impl` = **100.0% branch** (14/14), **100.0% line** (92/92); `service.application.impl` = **100.0% instruction & line**; `web.controllers` = **100.0% instruction & line**.
- **Findings Logged:** **12 open findings** (1 High, 7 Medium, 4 Low), including design observation DEF-07, in [DefectList.md](./DefectList.md).
- **Scenario assessment:** 34 Pass, 14 Fail, 1 Partial and 1 Design review across 50 designs. TC-15 has source evidence and TC-38 has unit/source evidence without a direct API test.
- **Release readiness:** CONDITIONAL FAIL / NOT READY FOR PRODUCTION. Passing characterization tests reproduce open defects; they do not establish acceptance compliance. Runtime seeding, performance and concurrency have no dedicated acceptance execution in this suite.

## 4. Issues Encountered

1. **No input validation on DTOs (`DEF-10`)** — missing `@Valid` / Jakarta Validation allows empty restaurant names and causes `IllegalArgumentException` (HTTP 500) on null password.
2. **No exception handlers for domain exceptions (`DEF-02`)** — domain exceptions (`DishNotFoundException`, `EmptyOrderException`, etc.) propagate as HTTP 500 instead of 400/401/404/409.
3. **Missing `AuthenticationEntryPoint` (`DEF-09`)** — unauthenticated requests receive HTTP 403 instead of HTTP 401.
4. **URL pattern matching order in security config (`DEF-08`)** — `/api/restaurants/{id}` matches before `/api/restaurants/add`, allowing `CUSTOMER` role to create restaurants.
5. **Stock inflation bug (`DEF-01`, High)** — `removeFromOrder` increments dish stock even when the dish was not in the pending order.

## 5. Plan for Remaining Work

- If the development team patches the defects in [DefectList.md](./DefectList.md), revise the affected API assertions to the intended HTTP responses and the unit assertions to the corrected business behavior, then re-run `.\mvnw.cmd test`.
- Complete or explicitly retain the documented verification gaps (runtime seeding, TC-15/TC-38 API coverage, response time/concurrency) and resolve cancellation stock/referenced-deletion policy before expanding acceptance claims.
- Prepare the final submission package from the synchronized Markdown (all documents in `docs/`, `pom.xml`, and `src/test/`); preserve IDs, expected/observed columns, evidence boundaries and the release verdict during Word conversion.
