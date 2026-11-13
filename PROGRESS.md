# Project Progress — Group 8 (`food-delivery-backend`)

**Last updated:** 2026-11-14

## Completed
1. **Audited & Rated Original Project**
   - Reviewed `pom.xml`, `src/main/java/**`, `src/test/java/**`, `README.md`, and all 8 documents in `food-delivery-backend/docs/`.
   - Identified broken Markdown tables, broken SRS-to-TestSpec traceability (`FR-U1` vs `FR-01`), inaccurate HTTP/role expectations (`TC-06`, `TC-07`, `TC-08`, `TC-18`, `TS-05-2`, `TS-09-4`), missing JaCoCo coverage tooling, missing unit/API tests, and 4 unlogged defects (`DEF-09`–`DEF-12`).
2. **Added Code Coverage Tooling (`pom.xml`)**
   - Configured `jacoco-maven-plugin` `0.8.12` (`prepare-agent` + `report` on `test` phase).
3. **Expanded Automated Test Suite (`src/test/java/...`) — 70 -> 111 Tests (111/111 Passing)**
   - **Unit tests (56 total):** Added missing branch/boundary/defect-characterization tests in `OrderServiceImplTest` (13) and `DishServiceImplTest` (13), plus new `DishApplicationServiceImplTest` (10) and `JwtHelperTest` (3), alongside `UserServiceImplTest` (9) and `RestaurantServiceImplTest` (8).
   - **API integration tests (55 total):** Expanded `UserApiTest` (14), `RestaurantDishApiTest` (25), and `OrderApiTest` (16) to cover `/api/user/me`, invalid/expired/malformed JWTs (401), role hierarchy (`OWNER` -> `CUSTOMER`), edit/delete dish & restaurant auth/404s, and defect characterization tests.
   - **JaCoCo Coverage Measured:** `service.domain.impl` = 100.0% branch (14/14), 100.0% line (92/92); `service.application.impl` & `web.controllers` = 100.0% instruction & line; 97.4% instruction coverage excluding `@Profile("!test") DataInitializer`.
4. **Updated All Documentation (`README.md` & `food-delivery-backend/docs/`)**
   - `README.md` — Removed template placeholders, updated structure and test/coverage commands.
   - `docs/SRS.md` — Fixed `FR-05`, `FR-07`, `FR-08`, `FR-12`, `FR-13`; added Domain Class Diagram; improved Use Case and Sequence diagrams.
   - `docs/TestPlan.md` — Added API Integration & JaCoCo coverage details and clarified release-gate exit criteria.
   - `docs/TestSpecification.md` — Fixed traceability to `FR-01`–`FR-24` and corrected `TS-05-2`, `TS-08-4`, `TS-09-4`, `TS-09-5`.
   - `docs/TestCases.md` — Fixed broken Markdown backticks, corrected `TC-06`/`TC-07`/`TC-08`/`TC-18`, expanded to 50 test cases (`TC-01`–`TC-50`) with SRS refs and Pass/Fail status.
   - `docs/UnitTestCases.md` — Updated to all 56 unit test cases (`UT-01`–`UT-56`).
   - `docs/DefectList.md` — Expanded from 8 to 12 verified defects (`DEF-01`–`DEF-12`).
   - `docs/TestReport.md` — Updated with 111-test Surefire results, real JaCoCo coverage tables, and explicit Conditional Fail release-gate verdict.
   - `docs/MidTermReport.md` — Synced with updated test counts, coverage, and defect findings.

## What Needs to Be Done Next
- **QA/Testing Deliverables:** Complete (`111/111` tests passing, JaCoCo & docs synced). `src/main/java/**` kept unmodified as SUT.
- **Frontend (`food-delivery-frontend`):** Core implementation, tests, and production build are complete:
  - **Stack:** TypeScript + React 19 + Vite 8 + React Router v7 + Vitest + oxlint (runs on `http://localhost:3000` with `strictPort: true` to match backend CORS in `JwtSecurityWebConfig.java`).
  - **API & State (`src/types/api.ts`, `src/api/`, `src/context/`):** Typed DTOs & REST wrappers for all User, Restaurant, Dish, and Order endpoints; `hasRole()` hierarchy (`ROLE_ADMIN > ROLE_OWNER > ROLE_CUSTOMER`); `groupOrderDishes()` handling backend `DEF-07` duplicate dish list; persistent JWT auth (`localStorage` key `fd_jwt_token`) with `/api/user/me` hydration and 401 session-expired handling; pending order state synced with `/api/orders/pending`.
  - **UI & Pages (`src/components/`, `src/pages/`, `src/styles/`):**
    - `styles/tokens.css` & `styles/app.css`: `@layer reset, tokens, base, components, utilities`, `color-scheme: light dark`, `prefers-color-scheme: dark`, `@media (forced-colors: active)`, native `<dialog>` backdrop scroll containment, `:user-invalid`/`:user-valid`.
    - `components/Navbar.tsx`: Single `<nav aria-label="Primary">` tree with `ResizeObserver` `.is-wide` toggle and `popover="auto"` + `@oddbird/popover-polyfill` fallback.
    - `components/ModalDialog.tsx` & `DishDetailsDialog.tsx`: Native `<dialog>` (`showModal()`, `closedby`, `aria-labelledby`, `returnValue` reset).
    - Pages: `LoginPage` (autofill + Show/Hide password + demo role quick-fill), `RegisterPage`, `RestaurantsPage`, `RestaurantDetailPage`, `DishesPage`, `OrderPage` (grouped order table + confirm/cancel dialogs), `ManagePage` (`ROLE_OWNER`+ Restaurant & Dish CRUD), `AdminUsersPage` (`ROLE_ADMIN` user lookup).
  - **Verification:** `npm run build` (`tsc -b && vite build`) passes (0 errors), `npm test` (`vitest run`) passes (`3` files, `9/9` tests), `npm run lint` (`oxlint`) passes (`0` errors, 10 React Compiler style warnings).
  - **Optional Next Step:** End-to-end manual/live smoke test against the running Spring Boot backend (`mvn spring-boot:run` on port `8080` + `npm run dev` on port `3000`).
