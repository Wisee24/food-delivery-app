# Unit Test Case Design — Food Delivery Backend (Group 8)

Scope: pure unit tests of the domain service layer, application service layer, and JWT helper using JUnit 5 + Mockito.
Pattern: `@ExtendWith(MockitoExtension.class)`, `@Mock` dependencies, `@InjectMocks` class under test. No Spring context, no database.
Location: `src/test/java/mk/ukim/finki/fooddeliverybackend/unit/`
Run unit tests only: `.\mvnw.cmd test -Dtest="mk.ukim.finki.fooddeliverybackend.unit.*Test"`

---

## 1. `UserServiceImplTest` (9 tests)

Unit under test: `UserServiceImpl(UserRepository, PasswordEncoder)` — covers `FR-01`..`FR-05`, `NFR-03`.

| ID | Test method | Objective | Inputs | Expected |
|----|-------------|-----------|--------|----------|
| UT-01 | `register_whenUsernameAvailable_encodesPasswordAndSaves` | Register succeeds when username is free; password encoded before persisting | `User("alice","plain-pass",...)`; repo returns empty; encoder -> `"encoded-pass"` | `passwordEncoder.encode` called; `userRepository.save` receives encoded password; saved user returned |
| UT-02 | `register_whenUsernameExists_throwsUsernameAlreadyExistsException` | Duplicate username rejected before save or encoding | `User("bob",...)`; repo returns existing user | `UsernameAlreadyExistsException` thrown; `save` never called; `passwordEncoder` untouched |
| UT-03 | `login_whenPasswordMatches_returnsUser` | Successful login when password matches | `"carol"`, `"secret"`; `matches` -> `true` | Returns the same `User`; `passwordEncoder.matches` verified |
| UT-04 | `login_whenPasswordWrong_throwsIncorrectPasswordException` | Wrong password rejected | `"dave"`, `"wrong"`; `matches` -> `false` | `IncorrectPasswordException` thrown |
| UT-05 | `login_whenUsernameUnknown_throwsUsernameNotFoundException` | Unknown username fails before password check | `"ghost"`; repo -> empty | `UsernameNotFoundException` thrown; `passwordEncoder` untouched |
| UT-06 | `findByUsername_whenPresent_returnsOptionalWithUser` | Delegates lookup to repository | `"erin"`; repo -> `Optional.of(user)` | `Optional` containing same user |
| UT-07 | `findByUsername_whenMissing_returnsEmptyOptional` | Missing user yields empty `Optional` | `"missing"`; repo -> empty | Empty `Optional` |
| UT-08 | `loadUserByUsername_whenPresent_returnsUserDetails` | Spring Security `UserDetailsService` contract | `"frank"`; repo -> `Optional.of(user)` | Returns `UserDetails` with `username == "frank"` |
| UT-09 | `loadUserByUsername_whenMissing_throwsUsernameNotFoundException` | Security contract: unknown username throws | `"nobody"`; repo -> empty | `UsernameNotFoundException` thrown |

## 2. `RestaurantServiceImplTest` (8 tests)

Unit under test: `RestaurantServiceImpl(RestaurantRepository)` — covers `FR-07`..`FR-11`.

| ID | Test method | Objective | Inputs | Expected |
|----|-------------|-----------|--------|----------|
| UT-10 | `findAll_returnsAllRestaurants` | Returns all restaurants from repository | `repo.findAll` -> `[r1, r2]` | List containing `r1, r2` |
| UT-11 | `findById_whenExists_returnsRestaurant` | Finds existing restaurant by id | `1L`; repo -> `Optional.of(r)` | `Optional` containing `r` |
| UT-12 | `findById_whenMissing_returnsEmpty` | Unknown id yields empty | `99L`; repo -> empty | Empty `Optional` |
| UT-13 | `save_delegatesToRepositoryAndReturnsSaved` | Save delegates to repository | `new Restaurant(...)` | Returned value is saved instance |
| UT-14 | `update_whenExists_updatesFieldsAndSaves` | Update copies name + description onto existing entity | `5L`, existing + updates | Fields updated; `save(existing)` called |
| UT-15 | `update_whenNotFound_returnsEmptyAndDoesNotSave` | Update of unknown id does nothing | `42L`; repo -> empty | Empty `Optional`; `save` never called |
| UT-16 | `deleteById_whenExists_deletesAndReturnsRestaurant` | Delete removes existing restaurant | `7L`; repo -> `Optional.of(r)` | `delete(r)` verified; `r` returned |
| UT-17 | `deleteById_whenNotFound_returnsEmptyAndDoesNotDelete` | Delete of unknown id does nothing | `77L`; repo -> empty | Empty `Optional`; `delete` never called |

## 3. `DishServiceImplTest` (13 tests)

Unit under test: `DishServiceImpl(DishRepository, OrderRepository)` — covers `FR-12`..`FR-17`, `FR-19`..`FR-21`, `NFR-06`.

| ID | Test method | Objective | Inputs | Expected |
|----|-------------|-----------|--------|----------|
| UT-18 | `findAll_returnsAllDishes` | Returns all dishes | `repo.findAll` -> `[d1, d2]` | List containing `d1, d2` |
| UT-19 | `findById_whenPresent_returnsDish` | Finds existing dish | `1L`; repo -> `Optional.of(d)` | `Optional` containing `d` |
| UT-20 | `findById_whenMissing_returnsEmpty` | Unknown id yields empty | `99L`; repo -> empty | Empty `Optional` |
| UT-21 | `save_delegatesToRepository` | Save delegates to repository | `new Dish(...)` | Same dish returned; `save` verified |
| UT-22 | `update_whenExists_setsAllFieldsAndSaves` | Update copies all 5 fields and saves | `1L`, existing + updated | All 5 fields updated; `save(existing)` called |
| UT-23 | `update_whenNotFound_returnsEmptyAndDoesNotSave` | Update of unknown id does nothing | `42L`; repo -> empty | Empty `Optional`; `save` never called |
| UT-24 | `deleteById_whenExists_deletesAndReturnsDish` | Delete removes existing dish | `1L`; repo -> `Optional.of(d)` | `delete(d)` verified; `d` returned |
| UT-25 | `deleteById_whenNotFound_returnsEmptyAndDoesNotDelete` | Delete of unknown id does nothing | `77L`; repo -> empty | Empty `Optional`; `delete` never called |
| UT-26 | `addToOrder_whenInStock_decreasesQuantityAndSavesBoth` | In-stock dish decrements stock and joins order | `quantity = 5`, empty order | `quantity == 4`; order contains dish; both saves called |
| UT-27 | `addToOrder_whenQuantityZero_throwsDishOutOfStockException` | Out-of-stock dish rejected | `quantity = 0`, empty order | `DishOutOfStockException` thrown; no saves |
| UT-28 | `removeFromOrder_increasesQuantityRemovesDishAndSavesBoth` | Removing present dish restores stock and updates order | `quantity = 4`, dish in order | `quantity == 5`; dish removed; both saves called |
| UT-29 | `addToOrder_whenQuantityOne_succeedsAndSetsQuantityZero` | BVA: minimum positive stock (`1`) succeeds | `quantity = 1`, empty order | `quantity == 0`; order contains dish |
| UT-30 | `removeFromOrder_whenDishNotInOrder_currentlyStillIncrementsQuantity_DEF01` | Defect characterization (`DEF-01`): no membership check | `quantity = 4`, dish NOT in order | Documents current defect: `quantity == 5`, order still empty |

## 4. `OrderServiceImplTest` (13 tests)

Unit under test: `OrderServiceImpl(OrderRepository, UserRepository, DishRepository)` — covers `FR-18`, `FR-22`, `FR-23`, `NFR-07`.

| ID | Test method | Objective | Inputs | Expected |
|----|-------------|-----------|--------|----------|
| UT-31 | `findPending_whenOrderExists_returnsPendingOrder` | Returns user's `PENDING` order | `"john"`, repo -> `Order(PENDING)` | `Optional` containing pending order |
| UT-32 | `findPending_whenNoPendingOrder_returnsEmpty` | No pending order yields empty | `"john"`, `orderRepo` -> empty | Empty `Optional` |
| UT-33 | `findPending_whenUnknownUser_throwsUserNotFoundException` | Unknown user fails before order lookup | `"ghost"`, `userRepo` -> empty | `UserNotFoundException` thrown; `orderRepo` never queried |
| UT-34 | `findOrCreatePending_whenPendingExists_returnsItWithoutSaving` | Reuses existing pending order | `"john"`, pending exists | Same order returned; `save` never called |
| UT-35 | `findOrCreatePending_whenNoneExists_createsAndSavesNewOrder` | Creates new `PENDING` order when none exists | `"john"`, no pending | `save` called once; `status == PENDING`, empty dishes |
| UT-36 | `confirm_whenOrderHasDishes_setsConfirmedAndSaves` | Confirming non-empty order sets `CONFIRMED` | pending order with 1 dish | `status == CONFIRMED`; `save` called |
| UT-37 | `confirm_whenOrderIsEmpty_throwsEmptyOrderException` | Empty order cannot be confirmed | pending order with 0 dishes | `EmptyOrderException` thrown; `save` never called |
| UT-38 | `confirm_whenNoPendingOrder_returnsEmpty` | Confirm with no pending order yields empty | no pending order | Empty `Optional`; `save` never called |
| UT-39 | `cancel_whenOrderHasDishes_setsCanceledAndSaves` | Canceling non-empty order sets `CANCELED` | pending order with 1 dish | `status == CANCELED`; `save` called |
| UT-40 | `cancel_whenOrderIsEmpty_throwsEmptyOrderException` | Empty order cannot be canceled | pending order with 0 dishes | `EmptyOrderException` thrown; `save` never called |
| UT-41 | `cancel_whenNoPendingOrder_returnsEmpty` | Cancel with no pending order yields empty | no pending order | Empty `Optional`; `save` never called |
| UT-42 | `confirm_whenUnknownUser_throwsUserNotFoundException` | Unknown user fails on confirm | `"ghost"` | `UserNotFoundException` thrown; `save` never called |
| UT-43 | `cancel_whenUnknownUser_throwsUserNotFoundException` | Unknown user fails on cancel | `"ghost"` | `UserNotFoundException` thrown; `save` never called |

## 5. `DishApplicationServiceImplTest` (10 tests)

Unit under test: `DishApplicationServiceImpl(DishService, RestaurantService, OrderService)` — covers `FR-12`..`FR-21` application orchestration.

| ID | Test method | Objective | Inputs | Expected |
|----|-------------|-----------|--------|----------|
| UT-44 | `findAll_mapsAllDishesToDtos` | Maps `Dish` entities to `DisplayDishDto` | `[dish(10L, r1)]` | DTO list with `name` and `restaurantId` |
| UT-45 | `findByIdWithDetails_whenPresent_returnsDetailsDtoWithRestaurant` | Maps dish + restaurant into `DisplayDishDetailsDto` | `10L` | Nested `restaurant.name == "Bistro"` |
| UT-46 | `save_whenRestaurantExists_savesAndReturnsDto` | Resolves restaurant and saves dish | valid `CreateDishDto`, `restaurantId=1L` | Saved `DisplayDishDto` returned |
| UT-47 | `save_whenRestaurantMissing_throwsRestaurantNotFoundException` | Missing restaurant fails before `dishService.save` | `restaurantId=999L` -> empty | `RestaurantNotFoundException`; `dishService` untouched |
| UT-48 | `update_whenRestaurantAndDishExist_updatesAndReturnsDto` | Updates dish when both restaurant and dish exist | `10L`, valid DTO | Updated `DisplayDishDto` |
| UT-49 | `update_whenRestaurantMissing_throwsRestaurantNotFoundException` | Missing restaurant fails before `dishService.update` | `restaurantId=999L` -> empty | `RestaurantNotFoundException`; `dishService` untouched |
| UT-50 | `update_whenDishMissing_returnsEmpty` | Existing restaurant, missing dish returns empty | `dishId=999L` -> empty | Empty `Optional` |
| UT-51 | `addToOrder_whenDishExists_delegatesAndMapsOrder` | Orchestrates `dishService` + `orderService` | `dishId=10L`, `"john"` | `DisplayOrderDto` with 1 dish |
| UT-52 | `addToOrder_whenDishMissing_throwsDishNotFoundException` | Missing dish throws before `orderService` lookup | `dishId=999L` -> empty | `DishNotFoundException`; `orderService` untouched |
| UT-53 | `removeFromOrder_whenDishMissing_throwsDishNotFoundException` | Missing dish throws before `orderService` lookup | `dishId=999L` -> empty | `DishNotFoundException`; `orderService` untouched |

## 6. `JwtHelperTest` (3 tests)

Unit under test: `JwtHelper` — covers `NFR-03`.

| ID | Test method | Objective | Inputs | Expected |
|----|-------------|-----------|--------|----------|
| UT-54 | `generateToken_extractsUsernameAndNotExpired` | Token round-trips username and future expiration | `User("alice", ..., ROLE_CUSTOMER)` | Non-blank token; `extractUsername == "alice"`; `isExpired == false` |
| UT-55 | `extractUsername_withInvalidSignature_throwsSignatureException` | Tampered/wrong-key token is rejected | JWT signed with wrong key | `SignatureException` thrown |
| UT-56 | `extractUsername_withMalformedToken_throwsMalformedJwtException` | Non-JWT string is rejected | `"not.a.jwt"` | `MalformedJwtException` thrown |

---

**Total unit test cases: 56 (`UT-01` – `UT-56`).**
- Strict stubbing is enforced by `MockitoExtension`: every stubbed interaction is exercised; negative paths verify `never()` / `verifyNoInteractions`.
- Real domain entity constructors (`User`, `Order`, `Dish`, `Restaurant`) are used so entity methods (`Order.confirm()`, `Dish.decreaseQuantity()`, etc.) are exercised directly.
