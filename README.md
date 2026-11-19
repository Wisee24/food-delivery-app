# Food Delivery Spring Boot Application
## Backend REST API & Software Testing Project (`food-delivery-backend`)

This project is a RESTful API built with Java 21 and Spring Boot 3.3.3 for a food delivery platform, alongside a complete Software Testing & QA deliverables suite (SRS, Test Plan, Test Specification, Black-Box Test Cases, Unit Test Cases, JUnit 5 + Mockito & MockMvc tests, JaCoCo Coverage, Defect List, Test Report, and Mid-Term Report).

## Key Features

* **User Management & JWT Auth:** Registration (`ROLE_CUSTOMER`), login (JWT issuance), profile lookup (`/api/user/me`), and admin user lookup (`/api/user/{username}`), with `ADMIN -> OWNER -> CUSTOMER` role hierarchy.
* **Restaurant & Dish Catalog:** CRUD operations for restaurants and dishes, plus dish stock quantity tracking.
* **Order Processing:** Customer pending order workflow (`PENDING` -> `CONFIRMED` or `CANCELED`), adding/removing dishes with stock adjustments.
* **RESTful API:** JSON endpoints under `/api/*` with OpenAPI/Swagger documentation (`/swagger-ui/**`).
* **Data Persistence:** Managed by an **H2 in-memory database** (`jdbc:h2:mem:food-delivery`) via Spring Data JPA, seeded at startup with demo users, restaurants, and dishes.

## Project Structure
- `food-delivery-backend/src/main/java` — Spring Boot backend (Controllers, Application/Domain Services, Models, Security, Repositories)
- `food-delivery-backend/src/main/resources` — Application and test profile properties
- `food-delivery-backend/src/test/java` — JUnit 5 + Mockito unit tests (`unit/`) and MockMvc API integration tests (`api/`)
- `food-delivery-backend/docs` — Course deliverables:
  - `SRS.md` — Software Requirements Specification + Mermaid UML diagrams
  - `TestPlan.md` — Test Plan (`TP-G8-FDB-2026-001`)
  - `TestSpecification.md` — Formal Test Specification (`TS-01`..`TS-11`) with evidence boundaries
  - `TestCases.md` — Black-Box System Test Cases
  - `UnitTestCases.md` — Unit Test Case Designs
  - `DefectList.md` — Defect Log
  - `TestReport.md` — Final Test Execution & JaCoCo Coverage Report
  - `MidTermReport.md` — Mid-Term Progress Report
  - [Document index](./food-delivery-backend/docs/README.md) — Word/PDF editions and the presentation practice guide

## Installation and Local Setup

### Prerequisites

* Java Development Kit (JDK) 21
* Maven (or included Maven Wrapper `mvnw` / `mvnw.cmd`)

### Running the Application

```bash
cd food-delivery-backend
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
cd food-delivery-backend
.\mvnw.cmd spring-boot:run
```

The application starts on `http://localhost:8080` with an in-memory H2 database seeded with demo data (3 users: `customer`, `owner`, `admin`; 10 restaurants; 20 dishes). No external database setup is required.

### Running the Tests & Coverage Report

```powershell
cd food-delivery-backend
.\mvnw.cmd test
```

This runs the full JUnit 5 + Mockito unit test suite and MockMvc API integration test suite, and generates a JaCoCo coverage report at `target/site/jacoco/index.html`.
