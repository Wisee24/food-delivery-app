# Test Report — Food Delivery App Backend

## 1. Overview

| Item | Detail |
|---|---|
| Project | Software Testing — Group 8 |
| Application under test | Food-Delivery-App-SpringBoot-master (`food-delivery-backend`), Spring Boot 3.3.3 / Java 21 |
| Scope | User/Auth, Restaurant, Dish, Order — four domain services, Dish application-service unit tests, JWT helper/filter, controllers and H2 integration |
| Test levels executed | 56 isolated unit tests and 55 API integration tests (`@SpringBootTest` + MockMvc + Spring Security Test) |
| Coverage tooling | JaCoCo Maven Plugin 0.8.12; instruction, branch and line counters are separate metrics |
| Latest verification | 19 November 2026 (rechecked after the 13 November execution baseline) |
| Environment | Windows, Eclipse Adoptium JDK 21.0.8, Maven Wrapper / Maven 3.9.9, in-memory H2, `test` profile |
| Command executed | `.\mvnw.cmd -o test` with Java 21 selected; `-o` uses the already cached dependencies |
| Related documents | [SRS.md](./SRS.md), [TestPlan.md](./TestPlan.md), [TestSpecification.md](./TestSpecification.md), [TestCases.md](./TestCases.md), [UnitTestCases.md](./UnitTestCases.md), [DefectList.md](./DefectList.md), [MidTermReport.md](./MidTermReport.md) |

MockMvc dispatches requests in-process without opening an HTTP server. Selected tests send JWTs; catalog and admin tests using `@WithMockUser` simulate authentication and do not exercise JWT parsing. Source DTO/configuration inspection supplements the assertions; not every field, postcondition or security combination is asserted.

## 2. Automated Test Summary

Results below were checked against the latest nine `target/surefire-reports/TEST-*.xml` files. All 111 tests executed; none failed, errored or skipped.

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

```text
Tests run: 111, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

## 3. Code Coverage Report (JaCoCo 0.8.12)

The same run generated `target/site/jacoco/index.html`, `jacoco.xml` and `jacoco.csv`. Values below are derived from the XML counters. JaCoCo analyzes 44 classes with executable instructions; the source tree also contains interfaces without executable counters (56 Java source types total).

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
| `config.initialization` (`DataInitializer`, `@Profile("!test")`) | 0 / 447 (**0.0%**) | n/a | 0 / 43 (**0.0%**) |
| `config.openapi` | 30 / 30 (**100.0%**) | n/a | 8 / 8 (**100.0%**) |
| `constants` | 4 / 7 (**57.1%**) | n/a | 1 / 2 (**50.0%**) |
| Application bootstrap (base package) | 8 / 13 (**61.5%**) | n/a | 2 / 4 (**50.0%**) |
| **Total (all 44 executable classes)** | 1880 / 2377 (**79.1%**) | 24 / 32 (**75.0%**) | 476 / 530 (**89.8%**) |
| **Total (excluding DataInitializer)** | 1880 / 1930 (**97.4%**) | 24 / 32 (**75.0%**) | 476 / 487 (**97.7%**) |

`DataInitializer` is disabled under the `test` profile, so seed startup behavior is not exercised by this suite. Report both totals rather than hiding that exclusion.

`OrderServiceImpl` has 100% line (29/29) and branch (8/8) coverage but misses five instructions. The XML attributes those instructions to the unexecuted `UserNotFoundException` supplier in `findOrCreatePending` (`lambda$findOrCreatePending$1`), not to its unused `DishRepository` field. Executing a source line does not imply every instruction on that line executed.

100% domain-service branch coverage is specific to the branches JaCoCo counts. It does not establish all inputs, concurrency safety, complete assertions, or 100% whole-application coverage. Application services have no counted JaCoCo branches (`n/a`), so their 100% instruction/line values are reported separately.

## 4. Scenario Assessment and Defect Evidence

The 50 designs in [TestCases.md](./TestCases.md) have the following **scenario assessments**, separate from the 111 automated execution results:

| Assessment | Count | Meaning |
|---|---:|---|
| Pass | 34 | Available test/source evidence supports the scenario; not every listed acceptance detail has a dedicated assertion |
| Fail | 14 | Current behavior conflicts with the intended acceptance criterion |
| Partial | 1 | TC-32: stock-1 add succeeds, but second add has defective error mapping |
| Design review | 1 | TC-35: duplicate dish entries are characterized; a merged line is not an established SRS requirement |
| **Total** | **50** | |

The 14 Fail rows and TC-32 reference **five defects**: DEF-01, DEF-02, DEF-08, DEF-09 and DEF-10. TC-35 records the separate DEF-07 design observation. The defect register contains **12 open findings** overall (1 High, 7 Medium, 4 Low); this is not a claim that all 12 were reproduced by black-box tests.

- **TC-06:** Unknown-user login returns 403. It now consistently fails the intended 401 contract (DEF-09), matching the SRS and defect register. Its automated characterization still passes.
- **48 of 50 designs have a related API test method**, with exact names in TestCases Section 4. TC-15 has source evidence only; TC-38 has unit/source evidence, not a direct API test.
- API tests for unhandled domain errors assert `ServletException` and its root cause; they do not assert a rendered HTTP 500 response from a live server. A deployed server would normally map an unhandled exception to 500.
- TC-39's API evidence covers creating a pending order; unit tests cover reuse/create branches. No repeated HTTP-lookup assertion or concurrent uniqueness check is claimed.
- DEF-01/02/08/09/10 have automated characterization for the named paths. DEF-07 has a representation characterization. DEF-03/04/05/06/11/12 are source-inspection findings; no exploit, performance or recursion execution is claimed.

## 5. Requirements Not Fully Verified

| Requirement / area | Evidence and limit |
|---|---|
| FR-24 / NFR-09 startup seeding | Three users, ten restaurants, twenty dishes and the profile guard inspected in DataInitializer; disabled during the suite; no new runtime seed acceptance run |
| NFR-01 response time | ~500 ms target retained; no latency benchmark or defined workload/percentile result |
| NFR-02 / NFR-06 concurrent integrity | Sequential stock tests and transaction annotations inspected; no concurrent request/locking test or uniqueness proof |
| NFR-03 / NFR-04 security | Selected JWT failures, role denials and OWNER inheritance covered; no exhaustive endpoint-by-role matrix or attack campaign |
| NFR-05 validation | Missing-password API characterization; empty-name inspection; no complete field/boundary/email matrix |
| NFR-06 stock integrity | Positive/zero/one stock and absent-order membership paths covered; DEF-01 remains open |
| NFR-07 order integrity | Non-empty/empty/no-pending-order transitions tested; no immutable post-finalization invariant or referenced-deletion policy established |
| NFR-08 errors | JWT error JSON tested; domain exception mapping remains defective |
| NFR-10 / NFR-11 architecture/persistence | Layering inspected and H2 integration exercised; no database migration/production portability test |
| NFR-12 runtime | Suite verified with Java 21; other JVM versions not certified |
| NFR-13 CORS | Exact hard-coded origin inspected; no dedicated browser CORS campaign |
| Cancellation restocking / referenced deletion | Product policies remain unspecified; tests do not establish a stock-restoration or referenced-child deletion contract |

## 6. Verdict Against Exit Criteria

| Exit Criterion ([TestPlan.md](./TestPlan.md)) | Target | Actual | Met? |
|---|---|---|---|
| Implemented unit/API tests execute without failures/errors | 111 executed, none skipped | 111 passed; 0 failures/errors/skips | **Yes** |
| Domain-service branch coverage | >=80% | 100.0% (14/14) | **Yes** |
| Critical scenarios have documented acceptance evidence and gaps | Evidence and outcomes explicit | Mapped tests and inspection; gaps and failed requirements remain visible | **Documented; not full acceptance** |
| **Release gate:** no open High defect without waiver | 0 open High or a documented waiver | DEF-01 remains High/Open; no waiver recorded. Medium: DEF-02, DEF-03, DEF-06, DEF-08, DEF-09, DEF-10, DEF-11 (7) | **No** |

- **Test Execution Verdict: PASS** — 111/111 implemented tests pass, with zero skipped tests.
- **Release Readiness Verdict: CONDITIONAL FAIL / NOT READY FOR PRODUCTION** — DEF-01 is unresolved, additional defects remain and dedicated acceptance gaps are documented. Passing characterization tests do not waive these defects.

## 7. Recommendations

1. Fix DEF-01: verify actual order membership before restoring stock.
2. Fix DEF-08: correct restaurant security matcher order; review mutation method security (DEF-12).
3. Fix DEF-02/DEF-09: add structured domain-error mapping (400/401/404/409) and a 401 authentication entry point.
4. Fix DEF-10: add explicit DTO validation consistent with NFR-05; allow zero stock but reject negative stock.
5. Address DEF-06/DEF-11: externalize the JWT secret/shorten token lifetime and prevent Lombok recursion on entity relationships.
6. Add missing acceptance evidence only when undertaking that test work: TC-15/TC-38 API paths, runtime seeding, complete validation/authorization matrices, response time and concurrent stock/pending-order integrity.
7. Decide cancellation restocking and referenced-deletion policies; keep the order-line model improvement DEF-07 separate from established requirements. After application fixes, revise characterization assertions to the intended behavior and regenerate this report.
