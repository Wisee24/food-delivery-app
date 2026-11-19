# Software Requirements Specification

## Food Delivery Web Application — `food-delivery-backend`

| | |
|---|---|
| **Prepared by** | Group 8 |
| **Application under test** | `food-delivery-backend` (Spring Boot 3.3.3, Java) |
| **Base package** | `mk.ukim.finki.fooddeliverybackend` |
| **Document version** | 1.1 |
| **Revision date** | 2026-11-19 |
| **Status** | Reviewed backend testing baseline; known deviations remain open |

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) describes the functional and non-functional requirements of the **Food Delivery Web Application** backend (`food-delivery-backend`). It is intended for the development team (Group 8), testers, reviewers, and any stakeholder who needs a precise, verifiable description of what the system does and the constraints under which it operates.

### 1.2 Scope

The product is a REST backend for a food delivery platform. It allows:

- **Customers** to register, log in, browse restaurants and dishes, build a pending order by adding/removing dishes, and confirm or cancel the order.
- **Restaurant owners** to create, edit, and delete restaurant and dish records. The model has no owner-to-restaurant association; per-owner isolation is outside this baseline.
- **Administrators** to manage the platform (an ADMIN account inherits OWNER rights, which in turn inherit CUSTOMER rights).

The backend is implemented with **Spring Boot 3.3.3**, uses an **H2 in-memory database**, and secures endpoints with **JWT authentication** and role-based authorization. Authentication issues JWT tokens; passwords are stored encoded; the `User` entity implements Spring Security's `UserDetails`.

Out of scope: the companion React frontend, payment processing, courier/delivery tracking, mobile applications, per-owner tenancy, and production-grade persistent storage (the current system uses in-memory H2).

Requirements below state intended behavior. Current implementation deviations are recorded in [DefectList.md](./DefectList.md); passing characterization tests reproduce those deviations rather than establish compliance. [TestReport.md](./TestReport.md) distinguishes automated execution, scenario assessment, source inspection and untested targets.

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|---|---|
| SRS | Software Requirements Specification |
| JWT | JSON Web Token used for stateless authentication |
| H2 | In-memory relational database used for persistence |
| ROLE_CUSTOMER | Role allowing browsing and ordering |
| ROLE_OWNER | Role allowing restaurant/dish management; implies CUSTOMER rights |
| ROLE_ADMIN | Role with full access; implies OWNER (and thus CUSTOMER) rights |
| PENDING | Order state: dishes are being collected, not yet finalized |
| CONFIRMED | Order state: customer finalized the order successfully |
| CANCELED | Order state: customer canceled the order |
| Dish quantity | Available stock count for a dish; decremented when added to an order, incremented when removed |
| PK | Primary key (`User.username`) |
| REST | Representational State Transfer API style |

### 1.4 References

- Spring Boot 3.3.3 documentation — https://spring.io/projects/spring-boot
- Spring Security (JWT, `UserDetails`) — https://spring.io/projects/spring-security
- H2 Database Engine — https://www.h2database.com
- Mermaid diagram syntax — https://mermaid.js.org
- IEEE 830-style SRS template (adapted)
- Project source: `mk.ukim.finki.fooddeliverybackend` (Group 8 repository)

### 1.5 Overview

The remainder of this document is organized as follows: Section 2 gives an overall description of the product; Section 3 lists the functional requirements (FR-01 … FR-24); Section 4 lists the non-functional requirements; Section 5 presents system models as Mermaid diagrams (use case, domain class diagram, two sequence diagrams, a state diagram, and an activity diagram).

---

## 2. Overall Description

### 2.1 Product Perspective

`food-delivery-backend` is a self-contained Spring Boot REST service. It exposes a JSON API for food delivery operations. Data is stored in an H2 in-memory database, seeded at startup with demo data (3 users, 10 restaurants, 20 dishes) when the `test` profile is inactive. Under `test`, `DataInitializer` is disabled and tests create their own fixtures. Authentication is stateless via JWT; authorization is role-based. The service is designed for development, demonstration, and testing rather than production multi-tenant deployment.

### 2.2 Product Functions

- **Account management**: register (creates `ROLE_CUSTOMER` user), login (returns JWT), retrieve user by username, retrieve the currently authenticated user.
- **Restaurant catalog**: list restaurants and view restaurant summary metadata; dishes are retrieved through the separate dish endpoints. Owners may add, edit, and delete restaurant records.
- **Dish catalog**: list dishes, view a dish and its details; owners may add, edit, and delete dishes.
- **Ordering**: customers add dishes to a pending order (decrementing stock), remove dishes (incrementing stock), then confirm or cancel the pending order.
- **Stock enforcement**: a dish with `quantity <= 0` cannot be added to an order.
- **Demo data seeding**: outside the `test` profile, the database is pre-populated with 3 users (username/password pairs `customer/customer`, `owner/owner`, `admin/admin`), 10 restaurants, and 20 dishes.

### 2.3 User Classes and Characteristics

| User class | Role | Privileges |
|---|---|---|
| Guest | None | Register or log in through public account endpoints |
| Customer | `ROLE_CUSTOMER` | Browse restaurants and dishes, retrieve own profile, manage a pending order, confirm/cancel the order |
| Restaurant owner | `ROLE_OWNER` | All CUSTOMER rights, plus add/edit/delete restaurants and dishes |
| Administrator | `ROLE_ADMIN` | All OWNER rights (full platform management) |

Role hierarchy: **ADMIN implies OWNER, OWNER implies CUSTOMER**. Public business endpoints are registration and login. The development configuration also permits `/swagger-ui/**`, `/v3/api-docs/**` and `/h2/**`; these tooling routes are distinct from protected business operations.

### 2.4 Constraints

- Runtime: Spring Boot 3.3.3 with Java 21, the configured compilation and verification target.
- Persistence: H2 **in-memory** database — state is lost on restart; demo data is re-seeded when the `test` profile is inactive.
- Security: JWT tokens; passwords stored encoded; endpoints guarded by role checks.
- API style: REST under `/api/*` with JSON payloads.
- `User.username` is the primary key; usernames must be unique.

### 2.5 Assumptions and Dependencies

- API clients (curl, Postman, or automated tests) interact with the REST endpoints.
- Clients store and present the JWT returned by login on subsequent requests.
- Demo credentials equal the username (e.g., `customer`/`customer`).
- Network availability on the local machine; single-instance deployment.

---

## 3. Functional Requirements

Priority scale: **High** = core system behavior; **Medium** = important supporting behavior.

### FR-01 — User Registration
- **Description**: `POST /api/user/register` (public) creates a new user with role `ROLE_CUSTOMER` and an encoded password. Fields: username (PK), password, name, surname, email.
- **Priority**: High

### FR-02 — Duplicate Username Rejection
- **Description**: Registration with an existing username must fail with `UsernameAlreadyExistsException` at the service boundary and HTTP 409 Conflict at the API boundary; no user is created. Current unhandled error mapping is `DEF-02`.
- **Priority**: High

### FR-03 — User Login (JWT Issuance)
- **Description**: `POST /api/user/login` (public) validates credentials and returns a JWT for authenticated requests. Unknown usernames must be rejected with HTTP 401 and no token; the current HTTP 403 response is `DEF-09`.
- **Priority**: High

### FR-04 — Incorrect Password Handling
- **Description**: Login with a wrong password must fail with `IncorrectPasswordException` at the service boundary and HTTP 401 at the API boundary; no token is issued. Current unhandled error mapping is `DEF-02`.
- **Priority**: High

### FR-05 — Retrieve User by Username
- **Description**: `GET /api/user/{username}` (`ROLE_ADMIN` required) returns the user record (`RegisterUserResponseDto`) for the given username, or HTTP 404 if not found.
- **Priority**: Medium

### FR-06 — Retrieve Current User
- **Description**: `GET /api/user/me` (any authenticated user) returns the profile of the user associated with the presented JWT.
- **Priority**: Medium

### FR-07 — List Restaurants
- **Description**: `GET /api/restaurants` (`ROLE_CUSTOMER` or higher) returns all restaurants.
- **Priority**: High

### FR-08 — View Restaurant
- **Description**: `GET /api/restaurants/{id}` (`ROLE_CUSTOMER` or higher) returns the restaurant summary (`id`, `name`, `description`) for the given id, or HTTP 404 if not found.
- **Priority**: High

### FR-09 — Add Restaurant
- **Description**: `POST /api/restaurants/add` (ROLE_OWNER or higher) creates a restaurant with a name and description.
- **Priority**: High

### FR-10 — Edit Restaurant
- **Description**: `PUT /api/restaurants/{id}/edit` (ROLE_OWNER or higher) updates an existing restaurant.
- **Priority**: Medium

### FR-11 — Delete Restaurant
- **Description**: `DELETE /api/restaurants/{id}/delete` (ROLE_OWNER or higher) removes a restaurant.
- **Priority**: Medium

### FR-12 — List Dishes
- **Description**: `GET /api/dishes` (`ROLE_CUSTOMER` or higher) returns all dishes (`id`, `name`, `description`, `price`, `quantity`, `restaurantId`).
- **Priority**: High

### FR-13 — View Dish
- **Description**: `GET /api/dishes/{id}` (`ROLE_CUSTOMER` or higher) returns a dish by id, or HTTP 404 if not found.
- **Priority**: High

### FR-14 — View Dish Details
- **Description**: `GET /api/dishes/{id}/details` (ROLE_CUSTOMER or higher) returns full dish details including its restaurant.
- **Priority**: Medium

### FR-15 — Add Dish
- **Description**: `POST /api/dishes/add` (ROLE_OWNER or higher, enforced with a role check) creates a dish with name, description, price (Double), quantity (Integer), and its restaurant.
- **Priority**: High

### FR-16 — Edit Dish
- **Description**: `PUT /api/dishes/{id}/edit` (ROLE_OWNER or higher) updates an existing dish.
- **Priority**: Medium

### FR-17 — Delete Dish
- **Description**: `DELETE /api/dishes/{id}/delete` (ROLE_OWNER or higher) removes a dish.
- **Priority**: Medium

### FR-18 — Get or Create Pending Order
- **Description**: `GET /api/orders/pending` (ROLE_CUSTOMER or higher) returns the user's existing PENDING order, or creates a new empty PENDING order if none exists. Creation is lazy: login alone does not create an order. A repeated sequential lookup reuses the pending order; concurrency uniqueness has not been verified.
- **Priority**: High

### FR-19 — Add Dish to Order
- **Description**: `POST /api/dishes/{id}/add-to-order` (ROLE_CUSTOMER or higher) adds one unit of an existing dish to the user's pending order and decrements its stock by one. Stock 1 is sufficient: the add succeeds and stock becomes 0. A nonexistent dish must return HTTP 404 (`DEF-02` is the current mapping deviation).
- **Representation note**: The current order contains a `List<Dish>` with one entry per addition, including repeated dish IDs. A dedicated order-line quantity model is a design improvement under review (`DEF-07`), not a requirement established by this SRS.
- **Priority**: High

### FR-20 — Out-of-Stock Rejection
- **Description**: If the dish quantity is `<= 0`, adding it to an order must fail with `DishOutOfStockException` and an HTTP 400 response; no dish is added and stock is unchanged. Current unhandled error mapping is `DEF-02`.
- **Priority**: High

### FR-21 — Remove Dish from Order
- **Description**: `POST /api/dishes/{id}/remove-from-order` (ROLE_CUSTOMER or higher) removes one occurrence of a dish actually present in the pending order and restores one stock unit. If a valid dish is absent from the order, reject the request or leave stock unchanged (`DEF-01` is the current violation). A nonexistent dish must return HTTP 404 (`DEF-02` is the current mapping deviation).
- **Priority**: High

### FR-22 — Confirm Order
- **Description**: `PUT /api/orders/pending/confirm` (ROLE_CUSTOMER or higher) sets the pending order's status to `CONFIRMED`. If the order contains no dishes, it fails with `EmptyOrderException` and HTTP 400, leaving it PENDING. If no pending order exists, return HTTP 404. Current empty-order error mapping is `DEF-02`.
- **Priority**: High

### FR-23 — Cancel Order
- **Description**: `PUT /api/orders/pending/cancel` (ROLE_CUSTOMER or higher) sets the pending order's status to `CANCELED`. If the order contains no dishes, it fails with `EmptyOrderException` and HTTP 400, leaving it PENDING. If no pending order exists, return HTTP 404. Current empty-order error mapping is `DEF-02`.
- **Priority**: High

> Cancellation stock policy: FR-23 specifies the status transition. It does not establish whether whole-order cancellation should restore stock. The current implementation does not restore it; the companion UI promises restoration. Resolve that product decision before adding a stock-restoration acceptance criterion. Existing cancellation tests verify status behavior, not that policy.

### FR-24 — Demo Data Seeding
- **Description**: On startup with the `test` profile inactive, the fresh database is seeded with 3 users (`customer`, `owner`, `admin` — each with password equal to its username), 10 restaurants, and 20 dishes.
- **Priority**: Medium

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-01 — Response time**: Typical API responses (list restaurants, list dishes, add dish to order) should return within ~500 ms under normal load in the development/test environment.
- **NFR-02 — Concurrent integrity**: Concurrent customer and owner requests must not corrupt orders or stock. This is a target, not a verified result: the current sequential unit/API tests do not establish concurrency safety, and using H2 or transactions alone is not proof.

### 4.2 Security
- **NFR-03 — Authentication**: All protected endpoints require a valid JWT. Missing credentials and invalid/expired/malformed JWTs must return HTTP 401; insufficient roles return HTTP 403. Stored account passwords use BCrypt hashes and are omitted from response DTOs. Published demo credentials are development fixtures. Current missing-credential HTTP 403 behavior is `DEF-09`.
- **NFR-04 — Authorization**: The role hierarchy is enforced — `ADMIN` implies `OWNER` implies `CUSTOMER`. Endpoints are guarded by role (`hasRole`) so only permitted roles can create/edit/delete restaurants and dishes or manage orders.
- **NFR-05 — Input validation**: Reject missing username/password, blank restaurant/dish names, non-positive dish prices and negative stock with HTTP 400; zero stock is a valid unavailable dish. Validate email format when supplied. Reject duplicate usernames with HTTP 409 and invalid login credentials with HTTP 401. The current missing validation/error mapping is documented in `DEF-02`, `DEF-09` and `DEF-10`; this requirement is not a claim of implemented validation.

### 4.3 Reliability & Data Integrity
- **NFR-06 — Consistent stock handling**: A successful add decrements stock by one and adds one order entry; removing a present entry restores one unit. Dish and order changes must commit together or roll back together. Removing an absent dish must not inflate stock. An add from stock 0 must fail without reducing stock below zero. These are integrity requirements; current single-operation evidence includes `DEF-01`, and failure rollback/multi-request locking has not been comprehensively verified.
- **NFR-07 — Order integrity**: Confirming or canceling an empty order is rejected (`EmptyOrderException`), so the supported finalization operation only succeeds when the pending order is non-empty. This does not prove an immutable invariant against later catalog edits or deletion.

### 4.4 API Usability
- **NFR-08 — Clear API contract**: REST endpoints follow a consistent `/api/{resource}/...` naming scheme and return meaningful error bodies so front-end clients can handle failures.
- **NFR-09 — Demo data**: With the `test` profile inactive, seeded sample data (3 users, 10 restaurants, 20 dishes) is available after startup for demos. Automated tests disable `DataInitializer` and create isolated fixtures.

### 4.5 Maintainability & Portability
- **NFR-10 — Layered architecture**: Code is organized into controller/service/repository layers within `mk.ukim.finki.fooddeliverybackend`, making features independently testable and maintainable.
- **NFR-11 — Embedded database**: Uses in-memory H2, so the application runs with no external database setup; state resets on restart (suitable for dev/test, not production persistence).

### 4.6 Compatibility & Deployment Constraints
- **NFR-12 — Runtime**: Build and verify with Java 21, as configured by `pom.xml`, and run as a standard Spring Boot application. Compatibility with other Java versions is not established by this test run.
- **NFR-13 — CORS**: Browser cross-origin requests are restricted by the security CORS configuration. The current allowed origin is exactly `http://localhost:3000`, hard-coded in `JwtSecurityWebConfig` (`DEF-04`). CORS does not replace authentication or prevent non-browser API clients from connecting. Externalizing the origin is a deployment improvement, not verified configurable behavior.

---

## 5. System Models

### 5.1 Use Case Diagram

> Role inheritance: `ADMIN` implies `OWNER` implies `CUSTOMER`. Owners inherit Customer use cases (`UC3`–`UC8`, `UC11`, `UC13`); Admins inherit Owner use cases and add admin user lookup (`UC12`). Registration/login (`UC1`, `UC2`) are public Guest operations. This is a flowchart representation of use cases, not formal UML notation.

```mermaid
flowchart LR
    Unauth((Guest / Unauthenticated))
    Customer((Customer))
    Owner((Owner))
    Admin((Admin))

    subgraph FoodDeliverySystem["Food Delivery System"]
        UC1["UC1: Register"]
        UC2["UC2: Login"]
        UC3["UC3: Browse Restaurants"]
        UC4["UC4: Browse Dishes & View Details"]
        UC5["UC5: Add Dish to Order"]
        UC6["UC6: Remove Dish from Order"]
        UC7["UC7: Confirm Order"]
        UC8["UC8: Cancel Order"]
        UC9["UC9: Manage Restaurants (add/edit/delete)"]
        UC10["UC10: Manage Dishes (add/edit/delete)"]
        UC11["UC11: View Own Profile (/me)"]
        UC12["UC12: Lookup User by Username"]
        UC13["UC13: Get or Create Pending Order"]
    end

    Unauth --> UC1
    Unauth --> UC2

    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC6
    Customer --> UC7
    Customer --> UC8
    Customer --> UC11
    Customer --> UC13

    Owner -.->|"inherits"| Customer
    Owner --> UC9
    Owner --> UC10

    Admin -.->|"inherits"| Owner
    Admin --> UC12
```

| Use case | Functional requirements |
|---|---|
| UC1 Register | FR-01, FR-02 |
| UC2 Login | FR-03, FR-04 |
| UC3 Browse Restaurants | FR-07, FR-08 |
| UC4 Browse Dishes / Details | FR-12, FR-13, FR-14 |
| UC5 Add Dish | FR-19, FR-20 |
| UC6 Remove Dish | FR-21 |
| UC7 Confirm | FR-22 |
| UC8 Cancel | FR-23 |
| UC9 Manage Restaurants | FR-09, FR-10, FR-11 |
| UC10 Manage Dishes | FR-15, FR-16, FR-17 |
| UC11 Own Profile | FR-06 |
| UC12 Admin Lookup | FR-05 |
| UC13 Pending Order | FR-18 |
| Background initialization (no actor goal) | FR-24 |

### 5.2 Domain Class Diagram

The diagram shows intended entity associations, not a guarantee that every database column is non-null. Users/restaurants may have zero orders/dishes; pending orders may be empty. `Role` and `OrderStatus` are enums, not separate persisted tables.

```mermaid
classDiagram
    class User {
        -String username
        -String password
        -String name
        -String surname
        -String email
        -Role role
        +getAuthorities() Collection
    }

    class Role {
        <<enumeration>>
        ROLE_CUSTOMER
        ROLE_OWNER
        ROLE_ADMIN
    }

    class Restaurant {
        -Long id
        -String name
        -String description
        -List~Dish~ dishes
    }

    class Dish {
        -Long id
        -String name
        -String description
        -Double price
        -Integer quantity
        -Restaurant restaurant
        +increaseQuantity() void
        +decreaseQuantity() void
    }

    class Order {
        -Long id
        -User user
        -List~Dish~ dishes
        -OrderStatus status
        +confirm() void
        +cancel() void
    }

    class OrderStatus {
        <<enumeration>>
        PENDING
        CONFIRMED
        CANCELED
    }

    User "1" --> "0..*" Order : places
    User --> Role : has
    Restaurant "1" --> "0..*" Dish : offers
    Order "0..*" --> "0..*" Dish : contains
    Order --> OrderStatus : has
```

### 5.3 Sequence Diagram — User Registration & Login

> Note: The diagram below specifies the **intended HTTP error contract** (4xx). Deviations in the current implementation (e.g., unhandled domain exceptions returning HTTP 500 or `UsernameNotFoundException` returning 403) are documented in [DefectList.md](./DefectList.md).

```mermaid
sequenceDiagram
    participant C as Client
    participant API as UserController
    participant AS as UserApplicationService
    participant S as UserService
    participant JWT as JwtHelper
    participant DB as H2 Database

    Note over C,DB: Registration
    C->>API: POST /api/user/register {username,password,name,surname,email}
    API->>AS: register(dto)
    AS->>S: register(user)
    S->>DB: findByUsername(username)
    alt username already exists
        DB-->>S: found
        S-->>API: UsernameAlreadyExistsException
        API-->>C: 4xx error response (intended)
    else new username
        S->>DB: save User (encoded password, ROLE_CUSTOMER)
        DB-->>S: saved
        S-->>AS: User
        AS-->>API: RegisterUserResponseDto
        API-->>C: 200 OK
    end

    Note over C,DB: Login
    C->>API: POST /api/user/login {username,password}
    API->>AS: login(dto)
    AS->>S: login(username,password)
    S->>DB: findByUsername
    DB-->>S: user or absent
    alt username not found
        S-->>API: UsernameNotFoundException
        API-->>C: 401 Unauthorized (intended)
    else wrong password
        S-->>API: IncorrectPasswordException
        API-->>C: 401 Unauthorized (intended)
    else correct password
        S-->>AS: user
        AS->>JWT: generateToken(user)
        JWT-->>AS: token
        AS-->>API: LoginUserResponseDto
        API-->>C: 200 OK {token}
    end
```

### 5.4 Sequence Diagram — Add Dish to Order & Confirm Order

This diagram assumes a valid existing dish and authenticated user. Repository calls are summarized as database interactions; the thin OrderApplicationService delegation is omitted for clarity. Error responses show the intended contract; current unhandled exceptions are `DEF-02`.

```mermaid
sequenceDiagram
    participant C as Customer Client
    participant DC as DishController
    participant DAS as DishApplicationService
    participant DS as DishService
    participant OS as OrderService
    participant OC as OrderController
    participant DB as H2 Database

    Note over C,DB: Add dish to order
    C->>DC: POST /api/dishes/{id}/add-to-order (JWT)
    DC->>DAS: addToOrder(dishId, username)
    DAS->>DS: findById(dishId)
    DS->>DB: query dish
    DB-->>DS: dish
    DS-->>DAS: dish
    DAS->>OS: findOrCreatePending(username)
    OS->>DB: query/create PENDING order
    OS-->>DAS: pending Order
    DAS->>DS: addToOrder(dish, order)
    alt dish quantity <= 0
        DS-->>DC: DishOutOfStockException
        DC-->>C: 4xx error response (intended)
    else dish in stock
        DS->>DB: decrement dish.quantity & save dish
        DS->>DB: add dish to order.dishes & save order
        DS-->>DAS: updated Order
        DAS-->>DC: DisplayOrderDto
        DC-->>C: 200 OK
    end

    Note over C,DB: Confirm order
    C->>OC: PUT /api/orders/pending/confirm (JWT)
    OC->>OS: confirm(username)
    OS->>DB: find PENDING order
    DB-->>OS: pending order or absent
    alt no pending order
        OS-->>OC: empty Optional
        OC-->>C: 404 Not Found
    else order has no dishes
        OS-->>OC: EmptyOrderException
        OC-->>C: 4xx error response (intended)
    else order has dishes
        OS->>DB: set status = CONFIRMED & save
        OS-->>OC: order confirmed
        OC-->>C: 200 OK
    end
```

### 5.5 State Diagram — Order Lifecycle

The final node ends this order's lifecycle. A later pending-order lookup/add/remove can create a different pending order; a completed order does not become PENDING again.

```mermaid
stateDiagram-v2
    [*] --> PENDING: GET /api/orders/pending (creates order if none)
    PENDING --> PENDING: add / remove dish
    PENDING --> CONFIRMED: PUT /api/orders/pending/confirm (non-empty)
    PENDING --> CANCELED: PUT /api/orders/pending/cancel (non-empty)
    CONFIRMED --> [*]
    CANCELED --> [*]
    note right of PENDING
        confirm/cancel on an empty order
        throws EmptyOrderException
        and the status stays PENDING
    end note
```

### 5.6 Activity Diagram — Ordering Flow

```mermaid
flowchart TD
    A(["Start"]) --> B["Customer logs in and obtains JWT"]
    B --> C["Browse restaurants and dishes"]
    C --> D["Select a dish"]
    D --> E{"Dish quantity > 0?"}
    E -- "No" --> F["DishOutOfStockException"]
    F --> C
    E -- "Yes" --> G["Add dish to pending order, decrement quantity"]
    G --> H{"Add more dishes?"}
    H -- "Yes" --> D
    H -- "No" --> I{"Confirm or cancel?"}
    I -- "Cancel" --> J{"Order empty?"}
    J -- "Yes" --> K["EmptyOrderException"]
    K --> I
    J -- "No" --> L["Set status = CANCELED"]
    I -- "Confirm" --> M{"Order empty?"}
    M -- "Yes" --> N["EmptyOrderException"]
    N --> I
    M -- "No" --> O["Set status = CONFIRMED"]
    L --> P(["End"])
    O --> P
```

---

*Document prepared by Group 8 for the `food-delivery-backend` application under test.*
