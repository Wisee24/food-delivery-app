# Test Plan — Food Delivery Backend

**Group 8** — Software Testing Course Project
Document version: 1.2 | Date: 2026-11-19

---

## 1. Test Plan Identifier

| Field | Value |
|---|---|
| Plan ID | TP-G8-FDB-2026-001 |
| Project | Food Delivery Application (Backend) |
| Repository | `Food-Delivery-App-SpringBoot-master/food-delivery-backend` |
| Prepared by | Group 8 |
| Status | Execution complete for the 111-test automated suite; documented coverage gaps remain |

## 2. Introduction & Scope

This test plan governs all verification activities for the **food-delivery-backend** module: a Spring Boot **3.3.3** REST API implementing a food delivery system. Testing covers functional correctness of the REST endpoints, the application and domain service layer business logic, JWT authentication/exception handling, and the Spring Security role hierarchy.

**In scope:** REST API behavior (via MockMvc automation), application and domain service-layer unit logic, JWT token helper behavior, exception handling and HTTP status mapping, security/authorization rules, and data integrity through H2 persistence.

**Out of scope:** see Section 4.

## 3. Items Under Test

| Module / Layer | Responsibility |
|---|---|
| User / Auth (`UserServiceImpl`, `UserApplicationServiceImpl`, `UserController`, `JwtHelper`, `JwtFilter`) | Registration, login, JWT issuance/validation, `/me` and admin user lookup, role assignment (`CUSTOMER`, `OWNER`, `ADMIN`) |
| Restaurant (`RestaurantServiceImpl`, `RestaurantApplicationServiceImpl`, `RestaurantController`) | CRUD of restaurant records, role-based access enforcement |
| Dish (`DishServiceImpl`, `DishApplicationServiceImpl`, `DishController`) | CRUD of dishes, dish details, stock quantity management, add/remove dish to order |
| Order (`OrderServiceImpl`, `OrderApplicationServiceImpl`, `OrderController`) | Pending order creation/lookup, confirm order, cancel order, order state transitions |

Supporting layers exercised indirectly: repositories (Spring Data JPA) and the H2 persistence store.

## 4. Features to be Tested / Not Tested

**To be tested:**
- User registration (including duplicate-username rejection and missing-field behavior)
- User login (valid credentials, wrong password, unknown username)
- JWT authentication (`GET /api/user/me`, expired/invalid/malformed tokens) and authorization matrix (`CUSTOMER` / `OWNER` / `ADMIN` + role hierarchy)
- Restaurant CRUD operations and authorization
- Dish CRUD operations, details view, stock quantity increments/decrements
- Order workflow: get/create pending, add-to-order, remove-from-order, confirm, cancel
- Empty-order handling (`EmptyOrderException`) and out-of-stock handling (`DishOutOfStockException`)
- Not-found resource handling (HTTP 404)

**Not to be tested:**
- Performance, load, and stress characteristics
- Swagger UI rendering and H2 web console UI
- Companion frontend UI testing (separate project scope)

FR-24/NFR-09 runtime seed initialization is specified and source-inspected but disabled in the automated `test` profile. No startup acceptance execution or full role/input matrix is claimed. The requirement/evidence boundaries are recorded in [TestSpecification.md](./TestSpecification.md) Section 12 and [TestReport.md](./TestReport.md).

## 5. Test Approach / Levels

| Level | Technique | Tooling |
|---|---|---|
| Unit testing | Four domain services and Dish application-service tested with mocked collaborators; JWT helper tested directly | JUnit 5 + Mockito + AssertJ |
| API Integration / Automation testing | Spring Boot context, MockMvc request dispatch, security and H2 persistence; selected tests send real JWTs, others use `@WithMockUser` | `@SpringBootTest` + `MockMvc` + Spring Security Test |
| Black-box design | Equivalence partitioning (EP), boundary value analysis (BVA), and error guessing (EG) applied to REST API inputs | Documented in `TestSpecification.md` and `TestCases.md` |
| White-box coverage analysis | Instruction, line and branch coverage measured automatically across production packages; these are separate JaCoCo metrics | JaCoCo Maven Plugin (`0.8.12`) |

Defect management: defects discovered via code inspection or dynamic testing are logged in `DefectList.md` with reproduction steps, severity, and status. The third-party System Under Test (`src/main/java`) is kept as the evaluation baseline: this documentation review does not patch application code. Some defects are characterized by automated tests and others are source-inspected; design observations are identified separately. A passing characterization is not an acceptance pass.

## 6. Test Environment

| Item | Value |
|---|---|
| JDK | Java 21 (Eclipse Adoptium 21.0.8) |
| Build tool | Maven Wrapper (`./mvnw` / `mvnw.cmd`) |
| Database | H2 in-memory (`test` profile) |
| OS | Windows 11 |
| IDE | IntelliJ IDEA |
| Frameworks & Plugins | Spring Boot 3.3.3, JUnit Jupiter 5.9.2, Mockito, AssertJ, Spring Security Test, JaCoCo 0.8.12 |

Execution command from `food-delivery-backend` with Java 21 selected (runs all unit + API tests and generates JaCoCo HTML/XML/CSV reports):

```powershell
.\mvnw.cmd test
```

## 7. Entry / Exit Criteria

**Entry criteria:**
- Backend source compiles with `.\mvnw.cmd compile` on Windows (or `./mvnw compile` on a POSIX shell)
- Test framework and JaCoCo plugin resolved; the wrapper executes the harness with Java 21
- SRS (`SRS.md`) and Test Specification (`TestSpecification.md`) baselined

**Exit criteria:**
- 100% of the 111 implemented automated unit and API tests executed with zero failures/errors; this does not mean every designed acceptance criterion is automated
- Planned critical workflow scenarios have documented evidence and acceptance outcomes; gaps and defect-characterization results must be explicit
- Combined-suite branch coverage on `service.domain.impl` ≥ 80% measured via JaCoCo; `service.application.impl` has no counted JaCoCo branches, so report its instruction/line coverage instead
- **Release gate:** No open Severity-1/High defects without a documented waiver (if any High defect remains open in an unmodified SUT, the release verdict must be recorded as **Conditional Fail / Not Ready for Production**)

## 8. Deliverables

1. Software Requirements Specification (`SRS.md`) with UML/Mermaid models
2. Test Plan (`TestPlan.md`)
3. Test Specification (`TestSpecification.md`)
4. Black-box system test cases (`TestCases.md`) — Lab 1
5. Unit test case designs (`UnitTestCases.md`) — Lab 2
6. Automated JUnit 5 + Mockito unit tests and MockMvc API integration tests (`src/test/java/...`) — Lab 3
7. JaCoCo coverage report (`target/site/jacoco/index.html`) + Maven Surefire reports (`target/surefire-reports/`)
8. Test Report (`TestReport.md`) and Defect List (`DefectList.md`) — Lab 4
9. Mid-Term Progress Report (`MidTermReport.md`)

## 9. Responsibilities (Group 8)

| Role | Responsibility |
|---|---|
| Test lead | Plan approval, schedule tracking, exit-criteria review |
| Test designers | Derive test cases via EP/BVA/EG; maintain `TestSpecification.md`, `TestCases.md`, `UnitTestCases.md` |
| Test implementers | Implement JUnit 5 + Mockito unit tests and MockMvc API automation tests |
| Defect manager | Log, classify, and track defects in `DefectList.md`; verify characterization tests |
| All members | Review artifacts, execute `.\mvnw.cmd test`, analyze JaCoCo coverage, finalize `TestReport.md` |

## 10. Risks & Contingencies

| Risk | Impact | Contingency |
|---|---|---|
| Upstream code changes break tests mid-lab | High | Pin to a baseline commit; re-run full suite after any change |
| Unhandled domain/validation exceptions propagate as `ServletException` in MockMvc | Medium | For DEF-02/DEF-10, assert the root cause. For DEF-09, assert the actual 403 separately; it is handled by Spring Security rather than propagated |
| H2 in-memory state leaks across API tests | Medium | Clean repositories in `@BeforeEach` in each API test class |
| Lombok `@Data` recursion on bidirectional JPA entities | Medium | Avoid invoking `toString()`/`hashCode()` on populated `Restaurant`↔`Dish` graphs in tests; log as `DEF-11` |
| Member unavailability | Medium | Each lab artifact has a designated backup owner |

## 11. Schedule

| Lab | Deliverable | Output |
|---|---|---|
| Lab 1 | Requirements & Test case design | `SRS.md`, `TestPlan.md`, `TestSpecification.md`, `TestCases.md` |
| Lab 2 | Unit test cases | `UnitTestCases.md` for service & helper classes |
| Lab 3 | Unit & API test code | JUnit 5 + Mockito + MockMvc tests implemented; `.\mvnw.cmd test` green; JaCoCo report |
| Lab 4 | Test report & defects | `TestReport.md` (with Surefire & JaCoCo numbers) and `DefectList.md` finalized |
