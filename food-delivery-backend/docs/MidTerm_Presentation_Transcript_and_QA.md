# Group 8 — Presentation Script and Practice Guide

## Start here

Practise the five-minute script first. Use the code walkthrough and Q&A when you need them; you do not need to memorize every class or number.

Remember this order: **System → Requirements → Tests → Bug → Verdict.**

Keep four things ready: [SRS PDF](./SRS_Food_Delivery_App_Revised.pdf), [combined testing PDF](./TestDocuments_Combined_Revised.pdf), `DishServiceImpl.java`, and `DishServiceImplTest.java`. In the PDFs, use bookmarks or search for the requirement/test ID. In Word, the Navigation Pane provides the same section headings.

### Your reminder card

| Topic | What to remember |
|---|---|
| Our system | Existing food-delivery backend; Java 21, Spring Boot, H2; companion React frontend |
| Requirements | **24 backend FRs + 13 NFRs**; frontend requirements are in a separate appendix |
| Designs versus tests | **50 black-box designs**; **56 unit + 55 API tests = 111 automated tests** |
| Coverage | **100% domain-service branch coverage**; **75% overall branch coverage** |
| Strongest example | Add food: check stock → subtract one → add to order → save |
| Strongest defect | **DEF-01:** removing a dish absent from an order increases stock |
| Verdict | **Test execution PASS. Release readiness CONDITIONAL FAIL.** |

Numbers to look up if asked: the 50 scenario assessments are **34 Pass, 14 Fail, 1 Partial, 1 Design review**. The register has **12 open findings: 1 High, 7 Medium, 4 Low**, including the DEF-07 design observation. Results were verified on **19 November 2026**.

## 1. Five-minute speaking script

The quoted paragraphs are what you say. The **Show** lines are actions for you, not sentences to read aloud. The timings are approximate; allow short pauses while changing tabs.

<!-- SCRIPT_START -->

### 0:00–0:40 — Introduce the project

**Show:** the SRS title, then its scope.

> Good morning, teacher and everyone. I am presenting Group 8's Software Testing project.
>
> We selected an existing open-source food-delivery backend as our system under test. It uses Java 21, Spring Boot and an H2 database. Users can sign in, browse food, manage a pending order, and confirm or cancel it.
>
> We chose this application because it has business rules, different user roles, and several layers that we can test. Our work includes requirements analysis, test design, automation and defect reporting. We also have a companion frontend for demonstrating the workflow.

### 0:40–1:20 — Connect a requirement to a feature

**Show:** SRS **FR-19**, then **FR-20**. Search by ID rather than scrolling through every requirement.

> Our backend SRS contains 24 functional requirements and 13 non-functional requirements.
>
> One simple example is adding a dish to an order. FR-19 says that a successful addition should add one dish and reduce its stock by one. FR-20 says that a dish with no stock must be rejected.
>
> These requirements give us something concrete to test. The diagrams describe the same workflow and the order states. They help us connect the written requirements to the implementation.

### 1:20–2:15 — Explain the testing approach

**Show:** combined testing document, **Part 3: TC-31–TC-33**. If time permits, show **Part 4: UT-26**.

> We designed 50 black-box scenarios and 56 unit-test cases.
>
> For adding a dish, we test normal stock, stock of one, and stock of zero. If stock is one, the first addition should succeed and leave zero. Another addition should be rejected. This is an example of boundary value analysis.
>
> We implemented 56 unit tests and 55 API integration tests. Unit tests isolate a class and use mocked collaborators. API tests use Spring, MockMvc and H2 to check several layers together. These levels give us different kinds of evidence. The 50 scenario designs and the 111 automated tests are different counts; they are not a one-to-one list.

### 2:15–3:00 — Present the results carefully

**Show:** combined document, **Part 5: Automated Test Summary**, then **Code Coverage Report**.

> The latest full run passed all 111 automated tests, with no failures, errors or skipped tests.
>
> JaCoCo reports 100 percent branch coverage for the domain-service package: 14 out of 14 counted branches. Overall branch coverage is 75 percent. We keep those scopes separate.
>
> Passing tests and high coverage do not prove that every requirement is satisfied. Some tests deliberately reproduce known defects. Other requirements, such as concurrent stock safety and response-time targets, still need dedicated verification.

### 3:00–4:15 — Explain one real defect

**Show:** `DishServiceImpl.removeFromOrder`, then the unit test whose name ends in **DEF01**.

> Our clearest defect is DEF-01, a stock-integrity problem.
>
> The method increases stock before checking whether the dish is actually in the customer's order. If the dish was never added, removing it from the list changes nothing, but the stock still increases.
>
> The defect test starts with an empty order. It calls the removal method and checks that stock incorrectly goes up by one while the order remains empty.
>
> That test passes because it is a characterization test. It confirms that we can reproduce the current bug. The intended requirement still fails, and the defect remains open. A proposed repair is to verify membership before restoring stock, then change the test to expect the corrected behavior.

### 4:15–5:00 — Give the verdict and next steps

**Show:** combined document, **Part 5: Verdict Against Exit Criteria**.

> We recorded 12 open findings, including defects, implementation limitations and a design observation. DEF-01 is High severity because it affects stock integrity.
>
> Our test execution verdict is PASS. Our release-readiness verdict is CONDITIONAL FAIL, because the High-severity defect remains open without a waiver.
>
> Our next steps are to address the findings, update the affected tests, and complete the documented verification gaps. The main result of our project is a traceable connection between requirements, code, tests and observed problems.
>
> Thank you. I am ready for your questions.

<!-- SCRIPT_END -->

## 2. If you only have two minutes

> We selected an existing Spring Boot food-delivery backend and documented 24 functional requirements and 13 non-functional requirements.
>
> We designed 50 black-box scenarios and implemented 111 automated tests: 56 unit tests and 55 API integration tests. All automated tests passed in the latest full run. Domain-service branch coverage is 100 percent; overall branch coverage is 75 percent.
>
> Our main example is stock handling. Adding a dish should reduce stock by one. We test normal stock, stock one and stock zero.
>
> We also reproduced DEF-01: removing a dish that is absent from the order still increases stock. Its characterization test passes because it reproduces the bug, while the requirement remains unsatisfied.
>
> We therefore report test execution PASS and release readiness CONDITIONAL FAIL. Our next steps are to fix the documented findings and extend verification where evidence is incomplete.

## 3. If the teacher asks to see the code

Use this answer pattern: **What should happen → where it happens → what the test checks.** You only need one connected example.

In IntelliJ on Windows, use **Ctrl+N** to find a class and **Ctrl+F** to find its method. Class and method names are more reliable than memorizing line numbers.

### A. Show the working feature

| Open | Find | Say |
|---|---|---|
| [DishController.java](../src/main/java/mk/ukim/finki/fooddeliverybackend/web/controllers/DishController.java) | `addToOrder` | “This receives the dish ID and the authenticated user, then delegates the request.” |
| [DishApplicationServiceImpl.java](../src/main/java/mk/ukim/finki/fooddeliverybackend/service/application/impl/DishApplicationServiceImpl.java) | `addToOrder` | “This finds the dish, finds or creates the user's pending order, and calls the business operation.” |
| [DishServiceImpl.java](../src/main/java/mk/ukim/finki/fooddeliverybackend/service/domain/impl/DishServiceImpl.java) | `addToOrder` | “This checks stock, reduces it by one, adds the dish to the order, and saves.” |

The important code is:

```java
if (dish.getQuantity() <= 0)
    throw new DishOutOfStockException(dish.getId());
dish.decreaseQuantity();
dishRepository.save(dish);
order.getDishes().add(dish);
return orderRepository.save(order);
```

Say: “Stock five should become four. Stock one should become zero. Stock zero should be rejected.” The application-service method has `@Transactional`; that groups the changes in this service call, but does not prove concurrent requests are safe.

### B. Show its unit test

Open [DishServiceImplTest.java](../src/test/java/mk/ukim/finki/fooddeliverybackend/unit/DishServiceImplTest.java), method `addToOrder_whenInStock_decreasesQuantityAndSavesBoth` (**UT-26**).

| Test section | Point to | Say |
|---|---|---|
| Arrange | Dish quantity `5`, empty order, repository stubs | “We prepare the input and control the mock responses.” |
| Act | `dishService.addToOrder(dish, order)` | “We call the real service method once.” |
| Assert | Quantity `4`, dish in order | “We check the resulting state.” |
| Verify | Both repository `save` calls | “We check that the service requested persistence.” |

The repositories are mocked. These checks do not prove a real database write.

### C. Show the API evidence if requested

Open [OrderApiTest.java](../src/test/java/mk/ukim/finki/fooddeliverybackend/api/OrderApiTest.java), method `addDishToOrderReturns200AndDecrementsQuantity` (**TC-31**).

Say: “This sends a POST through MockMvc with a generated customer JWT. It checks HTTP 200 and the response JSON, then reloads the dish through the real repository and checks stored stock is four.”

MockMvc runs in-process. This test does not open a browser, and generating the token directly does not test the login screen. Other API cases use `@WithMockUser` to simulate authentication.

### D. Show DEF-01

In `DishServiceImpl.removeFromOrder`, point to the order of these operations:

```java
dish.increaseQuantity();
dishRepository.save(dish);
order.getDishes().remove(dish);
```

Say: “The code restores stock before it knows whether anything was removed. `List.remove` returns false for an absent item, and that result is ignored.”

In `DishServiceImplTest`, find `removeFromOrder_whenDishNotInOrder_currentlyStillIncrementsQuantity_DEF01` (**UT-30**):

```java
assertThat(dish.getQuantity()).isEqualTo(5);
assertThat(result.getDishes()).isEmpty();
```

This unit fixture starts at **four**, so reaching **five** reproduces the error. The separate API test `removeDishNotInOrderCurrentlyInflatesStock_DEF01` starts at **five** and reaches **six**. Explain the fixture actually on screen rather than mixing their numbers.

The document chain is **FR-21 → TC-37 → UT-30 → DEF-01**. For the working add operation it is **FR-19 → TC-31 → UT-26**.

## 4. Optional one-minute frontend demonstration

Only include this when the app is already working and you have time. Your main testing presentation can stand on the documents, source and test evidence.

| Step | Do | Say |
|---|---|---|
| 1 | Sign in as `customer` | “The frontend is a companion client of the backend under test.” |
| 2 | Open a restaurant and note one dish's stock | “This is the available quantity before ordering.” |
| 3 | Add that dish once | “The successful API operation reduces stock by one.” |
| 4 | Open Order, review, and confirm | “The pending order becomes CONFIRMED.” |
| 5 | Return to the testing report | “This live workflow is one demonstration. Our automated tests examine additional normal and error cases.” |

Use the stock shown on screen; runtime seed quantities are not necessarily five. Demonstrate confirmation rather than promising cancellation restocks food: the cancellation policy and UI wording are currently inconsistent.

DEF-01 is best shown through its automated test. The normal UI only offers Remove on visible order entries, so an empty cart will not provide a button to reproduce the absent-item request.

## 5. Short answers to likely questions

### “How can all tests pass if the software has bugs?”

“Some tests characterize the current faulty behavior. A passing characterization means the bug is reproducible. It does not mean the intended requirement passes, so our report separates execution from release readiness.”

### “Why are there 50 scenarios but 111 automated tests?”

“They count different things. The 50 are black-box scenario designs. The 111 include 56 unit methods and 55 API methods. One design can have several checks; two designs lack direct API execution.”

If asked which two: **TC-15** has source-inspection evidence; **TC-38** has unit/source evidence. Neither has a direct API test. Exact mappings are in TestCases Section 4.

### “What are the results of the 50 scenarios?”

“34 Pass, 14 Fail, 1 Partial and 1 Design review. These are assessments using the available tests and source inspection; they are not 50 completely automated acceptance executions.”

TC-32 is Partial because the first add from stock one works but the second call has defective error mapping. TC-35 is Design review because the SRS does not require a merged order line.

### “Did you dynamically reproduce all 12 findings?”

“No. The register includes inspection findings and the DEF-07 design observation. The failing and partial black-box rows reference five defects: DEF-01, DEF-02, DEF-08, DEF-09 and DEF-10. The report names the evidence for each.”

### “Why use both unit and API tests?”

“Unit tests isolate the business logic and control its collaborators. API tests check routing, security, DTOs and persistence together. For example, a service-only unit test would not establish the URL authorization behavior behind DEF-08.”

JUnit runs the tests; Mockito supplies mocks and verifies interactions; AssertJ provides assertions. `JwtHelperTest` directly constructs its helper rather than using Mockito.

### “Give examples of EP, BVA and error guessing.”

“Equivalence partitioning: valid login, wrong password, unknown username. Boundary value analysis: stock zero and stock one. Error guessing: removing a dish that was never added.” Use stock as the clear numeric boundary; an arbitrary nonexistent ID alone does not establish a boundary value.

### “Does 100% coverage prove correctness?”

“No. It means the counted code paths executed, not that every input or assertion is correct. DEF-01 is executed and reproduced by a passing test. Our 100% branch figure applies to domain services; overall branch coverage is 75%.”

If asked for more numbers: domain line coverage is 100%; whole-application line coverage is 89.8%, or 97.7% excluding the disabled DataInitializer. The report shows both scopes.

### “Why 98.7% instruction coverage but 100% line coverage?”

“The missing five instructions belong to an exception-producing lambda in `OrderServiceImpl.findOrCreatePending`. That supplier was not executed even though the source line was reached. It is not caused by the unused repository field.”

### “Have you verified every requirement?”

“No. We make the gaps explicit. Runtime seeding is inspected but disabled in the test profile; performance, concurrency and full validation/role matrices need dedicated verification. High coverage does not fill those gaps.”

### “Why could a CUSTOMER create a restaurant?”

“In `JwtSecurityWebConfig`, the earlier `/api/restaurants/{id}` rule also matches the word `add` and requires only CUSTOMER. The restaurant creation method has no additional method-level role check. The API test reproduces this as DEF-08.”

For comparison, `DishController.save` has `@PreAuthorize("hasRole('OWNER')")`, which blocks customer dish creation. Hiding the Manage page in React cannot fix a backend permission defect.

### “Why 401, 403 and 500?”

“Our intended contract uses 401 for missing/invalid authentication and 403 for insufficient permission. Domain failures should have suitable 4xx responses. Some domain exceptions are unhandled; MockMvc tests assert their ServletException root cause. We do not claim those tests assert a live server's rendered 500 response.”

### “Does cancel restore stock? Can an owner order food?”

“The backend currently changes cancellation status without restoring stock, while the UI promises restoration. The intended stock policy needs a decision. An owner can order food because OWNER inherits CUSTOMER permissions.”

### “What are the entities and states?”

“There are four main entities: User, Restaurant, Dish and Order. Role and OrderStatus are enums. An order starts PENDING and can become CONFIRMED or CANCELED through the supported endpoints. The service rejects empty finalization; the entity methods themselves simply assign status.”

### “What did your group contribute?”

“We evaluated an existing open-source backend. Our project work includes the requirements and models, test planning/design, unit and API automation, coverage analysis, findings and reports, plus the companion frontend.” Explain your personal contribution using work you actually performed and understand.

## 6. Before class: setup and recovery

### Prepare these once

1. Open the PDFs and the two main code files. Practise finding FR-19, TC-31, UT-26 and DEF-01.
2. Use Java 21 for the backend. Keep the completed full-suite output and JaCoCo HTML ready.
3. If showing the frontend, start both apps and verify customer sign-in before class. H2 data resets when the backend restarts.
4. Rehearse the five-minute script aloud with a timer. Pause after each main point; give the teacher time to see the evidence.
5. Practise the stock bug explanation without reading. If you can explain expected behavior, actual behavior and the test, you have a strong answer.

### Commands: run before presenting

Open the project root, `Food-Delivery-App-SpringBoot-master`, in IntelliJ. In a terminal starting at that root, enter the backend folder and check the wrapper uses Java 21:

```powershell
Set-Location .\food-delivery-backend
# Use your installed JDK 21 path if JAVA_HOME points at another version.
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot'
.\mvnw.cmd -v
.\mvnw.cmd clean test
```

Open `target/site/jacoco/index.html` after the completed full run. To start the live backend, use that backend terminal:

```powershell
.\mvnw.cmd spring-boot:run
```

Open a second terminal at the project root. With frontend dependencies already installed:

```powershell
Set-Location .\food-delivery-frontend
npm run dev
```

The frontend is `http://localhost:3000`; the backend is `http://localhost:8080`. The runtime demo login is `customer` / `customer`. Tests prepare their own fixtures and do not need the live app to be running.

### If asked to run a test

The fastest option is IntelliJ's green Run icon beside the exact unit method. Or, from the backend folder:

```powershell
.\mvnw.cmd "-Dtest=DishServiceImplTest#removeFromOrder_whenDishNotInOrder_currentlyStillIncrementsQuantity_DEF01" test
```

Say before running: “This is a selected test that reproduces DEF-01.” A selected run is not a new 111-test result. It can alter the reports in `target`; use a complete `clean test` run before claiming fresh full-suite coverage. The >=80% threshold is a documented exit criterion, not an automatically enforced JaCoCo check in the current POM.

### If something goes wrong

| Situation | Say and do |
|---|---|
| You lose your place | “Let me connect the requirement to the test.” Return to **System → Requirements → Tests → Bug → Verdict**. |
| You need time to find code | “Let me open the method and its test so I can answer precisely.” Use class search, then method search. |
| The app will not start | “I will use the recorded test evidence and source walkthrough.” Show the PDF and assertions; identify it as recorded evidence. |
| You have not tested a question | “We have not verified that case yet. I would prepare this input, call this operation, and check this result.” Describe the next test rather than guessing. |
| You cannot remember a number | Open the Test Report table. Explain its scope while you look it up. |

Speak “JWT” as the letters J-W-T; “DTO” as D-T-O. A characterization test can be explained simply as **a test that records the current behavior**. You can describe the business action instead of reading a long Java method name aloud.

Your final sentence to remember: **“Passing tests show that our assertions matched the current behavior. Release readiness also depends on the requirements and unresolved findings.”**
