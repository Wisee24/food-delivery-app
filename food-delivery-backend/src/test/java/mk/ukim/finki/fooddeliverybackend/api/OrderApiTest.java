package mk.ukim.finki.fooddeliverybackend.api;

import jakarta.servlet.ServletException;
import mk.ukim.finki.fooddeliverybackend.helpers.JwtHelper;
import mk.ukim.finki.fooddeliverybackend.model.domain.Dish;
import mk.ukim.finki.fooddeliverybackend.model.domain.Restaurant;
import mk.ukim.finki.fooddeliverybackend.model.domain.User;
import mk.ukim.finki.fooddeliverybackend.model.enums.OrderStatus;
import mk.ukim.finki.fooddeliverybackend.model.enums.Role;
import mk.ukim.finki.fooddeliverybackend.model.exceptions.DishNotFoundException;
import mk.ukim.finki.fooddeliverybackend.model.exceptions.DishOutOfStockException;
import mk.ukim.finki.fooddeliverybackend.model.exceptions.EmptyOrderException;
import mk.ukim.finki.fooddeliverybackend.repository.DishRepository;
import mk.ukim.finki.fooddeliverybackend.repository.OrderRepository;
import mk.ukim.finki.fooddeliverybackend.repository.RestaurantRepository;
import mk.ukim.finki.fooddeliverybackend.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class OrderApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtHelper jwtHelper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private DishRepository dishRepository;

    @Autowired
    private OrderRepository orderRepository;

    private User customer;
    private Dish dish;
    private Dish outOfStockDish;
    private String customerToken;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
        dishRepository.deleteAll();
        restaurantRepository.deleteAll();
        userRepository.deleteAll();
        customer = userRepository.save(new User("testcustomer", "pass",
                "Test", "Customer", "customer@email.com", Role.ROLE_CUSTOMER));
        Restaurant restaurant = restaurantRepository.save(new Restaurant("Test Restaurant", "desc"));
        dish = dishRepository.save(new Dish("Pizza", "Cheesy pizza", 10.0, 5, restaurant));
        outOfStockDish = dishRepository.save(new Dish("Sold Out Dish", "Not available", 5.0, 0, restaurant));
        customerToken = jwtHelper.generateToken(customer);
    }

    private String bearer() {
        return "Bearer " + customerToken;
    }

    @Test
    @Order(1)
    void getPendingOrderCreatesNewEmptyPendingOrder() throws Exception {
        mockMvc.perform(get("/api/orders/pending").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testcustomer"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.dishes", empty()));
        assertThat(orderRepository.findByUserAndStatus(customer, OrderStatus.PENDING)).isPresent();
    }

    @Test
    @Order(2)
    void addDishToOrderReturns200AndDecrementsQuantity() throws Exception {
        mockMvc.perform(post("/api/dishes/" + dish.getId() + "/add-to-order")
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.dishes", hasSize(1)))
                .andExpect(jsonPath("$.dishes[0].name").value("Pizza"));
        assertThat(dishRepository.findById(dish.getId()).get().getQuantity()).isEqualTo(4);
    }

    @Test
    @Order(3)
    void addOutOfStockDishToOrderThrowsServletException() {
        ServletException ex = assertThrows(ServletException.class, () ->
                mockMvc.perform(post("/api/dishes/" + outOfStockDish.getId() + "/add-to-order")
                        .header("Authorization", bearer())));
        assertThat(ex.getCause()).isInstanceOf(DishOutOfStockException.class);
    }

    @Test
    @Order(4)
    void addNonExistingDishToOrderThrowsServletException() {
        ServletException ex = assertThrows(ServletException.class, () ->
                mockMvc.perform(post("/api/dishes/999999/add-to-order")
                        .header("Authorization", bearer())));
        assertThat(ex.getCause()).isInstanceOf(DishNotFoundException.class);
    }

    @Test
    @Order(5)
    void removeDishFromOrderReturns200AndIncrementsQuantity() throws Exception {
        mockMvc.perform(post("/api/dishes/" + dish.getId() + "/add-to-order")
                        .header("Authorization", bearer()))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/dishes/" + dish.getId() + "/remove-from-order")
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dishes", empty()));
        assertThat(dishRepository.findById(dish.getId()).get().getQuantity()).isEqualTo(5);
    }

    @Test
    @Order(6)
    void confirmOrderWithDishesReturns200Confirmed() throws Exception {
        mockMvc.perform(post("/api/dishes/" + dish.getId() + "/add-to-order")
                        .header("Authorization", bearer()))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/orders/pending/confirm").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    @Order(7)
    void confirmEmptyOrderThrowsServletException() throws Exception {
        mockMvc.perform(get("/api/orders/pending").header("Authorization", bearer()))
                .andExpect(status().isOk());
        ServletException ex = assertThrows(ServletException.class, () ->
                mockMvc.perform(put("/api/orders/pending/confirm").header("Authorization", bearer())));
        assertThat(ex.getCause()).isInstanceOf(EmptyOrderException.class);
    }

    @Test
    @Order(8)
    void cancelOrderWithDishesReturns200Canceled() throws Exception {
        mockMvc.perform(post("/api/dishes/" + dish.getId() + "/add-to-order")
                        .header("Authorization", bearer()))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/orders/pending/cancel").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"));
    }

    @Test
    @Order(9)
    void cancelEmptyOrderThrowsServletException() throws Exception {
        mockMvc.perform(get("/api/orders/pending").header("Authorization", bearer()))
                .andExpect(status().isOk());
        ServletException ex = assertThrows(ServletException.class, () ->
                mockMvc.perform(put("/api/orders/pending/cancel").header("Authorization", bearer())));
        assertThat(ex.getCause()).isInstanceOf(EmptyOrderException.class);
    }

    @Test
    @Order(10)
    void unauthenticatedOrderAccessReturns403() throws Exception {
        // No custom AuthenticationEntryPoint → 403 instead of 401 (DEF-09)
        mockMvc.perform(get("/api/orders/pending"))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(11)
    void confirmOrderWhenNoPendingOrderReturns404() throws Exception {
        mockMvc.perform(put("/api/orders/pending/confirm").header("Authorization", bearer()))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(12)
    void cancelOrderWhenNoPendingOrderReturns404() throws Exception {
        mockMvc.perform(put("/api/orders/pending/cancel").header("Authorization", bearer()))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(13)
    void addDishWithQuantityOneSucceedsThenNextAddThrowsOutOfStock() throws Exception {
        Dish lastOne = dishRepository.save(new Dish("Last Slice", "Only 1 left", 4.0, 1, dish.getRestaurant()));

        mockMvc.perform(post("/api/dishes/" + lastOne.getId() + "/add-to-order")
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dishes", hasSize(1)));
        assertThat(dishRepository.findById(lastOne.getId()).orElseThrow().getQuantity()).isZero();

        ServletException ex = assertThrows(ServletException.class, () ->
                mockMvc.perform(post("/api/dishes/" + lastOne.getId() + "/add-to-order")
                        .header("Authorization", bearer())));
        assertThat(ex.getCause()).isInstanceOf(DishOutOfStockException.class);
    }

    @Test
    @Order(14)
    void removeDishNotInOrderCurrentlyInflatesStock_DEF01() throws Exception {
        mockMvc.perform(post("/api/dishes/" + dish.getId() + "/remove-from-order")
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dishes", empty()));
        // Characterization of DEF-01: quantity incremented from 5 to 6 even though dish was not in order
        assertThat(dishRepository.findById(dish.getId()).orElseThrow().getQuantity()).isEqualTo(6);
    }

    @Test
    @Order(15)
    void addSameDishTwiceCreatesDuplicateOrderEntries_DEF07() throws Exception {
        mockMvc.perform(post("/api/dishes/" + dish.getId() + "/add-to-order")
                        .header("Authorization", bearer()))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/dishes/" + dish.getId() + "/add-to-order")
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dishes", hasSize(2)));
        assertThat(dishRepository.findById(dish.getId()).orElseThrow().getQuantity()).isEqualTo(3);
    }

    @Test
    @Order(16)
    void ownerCanAccessOrderEndpointDueToRoleHierarchy() throws Exception {
        User owner = userRepository.save(new User("testowner", "pass",
                "Test", "Owner", "owner@email.com", Role.ROLE_OWNER));
        String ownerToken = jwtHelper.generateToken(owner);

        mockMvc.perform(get("/api/orders/pending")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testowner"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }
}