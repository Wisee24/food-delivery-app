package mk.ukim.finki.fooddeliverybackend.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import mk.ukim.finki.fooddeliverybackend.model.domain.Dish;
import mk.ukim.finki.fooddeliverybackend.model.domain.Restaurant;
import mk.ukim.finki.fooddeliverybackend.model.exceptions.RestaurantNotFoundException;
import mk.ukim.finki.fooddeliverybackend.repository.DishRepository;
import mk.ukim.finki.fooddeliverybackend.repository.OrderRepository;
import mk.ukim.finki.fooddeliverybackend.repository.RestaurantRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RestaurantDishApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private DishRepository dishRepository;

    @Autowired
    private OrderRepository orderRepository;

    private Restaurant restaurant;
    private Restaurant emptyRestaurant;
    private Dish dish;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
        dishRepository.deleteAll();
        restaurantRepository.deleteAll();
        restaurant = restaurantRepository.save(new Restaurant("Test Restaurant", "A test restaurant"));
        emptyRestaurant = restaurantRepository.save(new Restaurant("Empty Place", "Has no dishes"));
        dish = dishRepository.save(new Dish("Pizza", "Cheesy pizza", 10.0, 5, restaurant));
    }

    @Test
    @Order(1)
    @WithMockUser(roles = {"CUSTOMER"})
    void listRestaurantsAsCustomerReturns200() throws Exception {
        mockMvc.perform(get("/api/restaurants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @Order(2)
    @WithMockUser(roles = {"CUSTOMER"})
    void getRestaurantByIdAsCustomerReturns200() throws Exception {
        mockMvc.perform(get("/api/restaurants/" + restaurant.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Restaurant"));
    }

    @Test
    @Order(3)
    @WithMockUser(roles = {"CUSTOMER"})
    void getRestaurantByNonExistingIdReturns404() throws Exception {
        mockMvc.perform(get("/api/restaurants/999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(4)
    @WithMockUser(roles = {"OWNER"})
    void addRestaurantAsOwnerReturns200() throws Exception {
        Map<String, String> body = Map.of("name", "New Place", "description", "Fresh food");
        mockMvc.perform(post("/api/restaurants/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("New Place"));
    }

    @Test
    @Order(5)
    @WithMockUser(roles = {"CUSTOMER"})
    void addRestaurantAsCustomerReturns200DueToUrlPatternMatch() throws Exception {
        // /api/restaurants/add matches /api/restaurants/{id} pattern first (CUSTOMER rule)
        Map<String, String> body = Map.of("name", "Nope", "description", "Denied");
        mockMvc.perform(post("/api/restaurants/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk());
    }

    @Test
    @Order(6)
    @WithMockUser(roles = {"OWNER"})
    void editRestaurantAsOwnerReturns200() throws Exception {
        Map<String, String> body = Map.of("name", "Renamed Place", "description", "Updated description");
        mockMvc.perform(put("/api/restaurants/" + restaurant.getId() + "/edit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed Place"));
        assertThat(restaurantRepository.findById(restaurant.getId()).get().getName())
                .isEqualTo("Renamed Place");
    }

    @Test
    @Order(7)
    @WithMockUser(roles = {"OWNER"})
    void deleteRestaurantAsOwnerReturns200() throws Exception {
        mockMvc.perform(delete("/api/restaurants/" + emptyRestaurant.getId() + "/delete"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Empty Place"));
        assertThat(restaurantRepository.findById(emptyRestaurant.getId())).isEmpty();
    }

    @Test
    @Order(8)
    @WithMockUser(roles = {"CUSTOMER"})
    void listDishesAsCustomerReturns200() throws Exception {
        mockMvc.perform(get("/api/dishes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @Order(9)
    @WithMockUser(roles = {"CUSTOMER"})
    void getDishByIdAsCustomerReturns200() throws Exception {
        mockMvc.perform(get("/api/dishes/" + dish.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Pizza"))
                .andExpect(jsonPath("$.quantity").value(5));
    }

    @Test
    @Order(10)
    @WithMockUser(roles = {"CUSTOMER"})
    void getDishDetailsReturns200WithRestaurantInfo() throws Exception {
        mockMvc.perform(get("/api/dishes/" + dish.getId() + "/details"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Pizza"))
                .andExpect(jsonPath("$.restaurant.id").value(restaurant.getId()))
                .andExpect(jsonPath("$.restaurant.name").value("Test Restaurant"));
    }

    @Test
    @Order(11)
    @WithMockUser(roles = {"CUSTOMER"})
    void getDishByNonExistingIdReturns404() throws Exception {
        mockMvc.perform(get("/api/dishes/999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(12)
    @WithMockUser(roles = {"OWNER"})
    void addDishAsOwnerWithValidDataReturns200() throws Exception {
        Map<String, Object> body = Map.of(
                "name", "Burger", "description", "Juicy burger",
                "price", 8.5, "quantity", 20, "restaurantId", restaurant.getId());
        mockMvc.perform(post("/api/dishes/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Burger"))
                .andExpect(jsonPath("$.restaurantId").value(restaurant.getId()));
    }

    @Test
    @Order(13)
    @WithMockUser(roles = {"OWNER"})
    void addDishAsOwnerWithInvalidRestaurantThrowsServletException() {
        Map<String, Object> body = Map.of(
                "name", "Orphan Dish", "description", "No restaurant",
                "price", 5.0, "quantity", 3, "restaurantId", 999999);

        ServletException ex = assertThrows(ServletException.class, () ->
                mockMvc.perform(post("/api/dishes/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))));
        assertThat(ex.getCause()).isInstanceOf(RestaurantNotFoundException.class);
    }

    @Test
    @Order(14)
    @WithMockUser(roles = {"CUSTOMER"})
    void addDishAsCustomerReturns403FromMethodSecurity() throws Exception {
        // URL /api/dishes/add matches /api/dishes/{id} (CUSTOMER rule),
        // but @PreAuthorize("hasRole('OWNER')") on method denies CUSTOMER
        Map<String, Object> body = Map.of(
                "name", "Denied", "description", "No",
                "price", 1.0, "quantity", 1, "restaurantId", restaurant.getId());
        mockMvc.perform(post("/api/dishes/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(15)
    @WithMockUser(roles = {"CUSTOMER"})
    void editRestaurantAsCustomerReturns403() throws Exception {
        Map<String, String> body = Map.of("name", "Hack", "description", "Denied");
        mockMvc.perform(put("/api/restaurants/" + restaurant.getId() + "/edit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(16)
    @WithMockUser(roles = {"CUSTOMER"})
    void deleteRestaurantAsCustomerReturns403() throws Exception {
        mockMvc.perform(delete("/api/restaurants/" + emptyRestaurant.getId() + "/delete"))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(17)
    @WithMockUser(roles = {"OWNER"})
    void editRestaurantNonExistingReturns404() throws Exception {
        Map<String, String> body = Map.of("name", "Ghost", "description", "Missing");
        mockMvc.perform(put("/api/restaurants/999999/edit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(18)
    @WithMockUser(roles = {"OWNER"})
    void deleteRestaurantNonExistingReturns404() throws Exception {
        mockMvc.perform(delete("/api/restaurants/999999/delete"))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(19)
    @WithMockUser(roles = {"OWNER"})
    void editDishAsOwnerReturns200AndUpdatesFields() throws Exception {
        Map<String, Object> body = Map.of(
                "name", "Updated Pizza", "description", "Extra cheese",
                "price", 12.5, "quantity", 8, "restaurantId", restaurant.getId());
        mockMvc.perform(put("/api/dishes/" + dish.getId() + "/edit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Pizza"))
                .andExpect(jsonPath("$.price").value(12.5))
                .andExpect(jsonPath("$.quantity").value(8));
    }

    @Test
    @Order(20)
    @WithMockUser(roles = {"OWNER"})
    void editDishNonExistingReturns404() throws Exception {
        Map<String, Object> body = Map.of(
                "name", "Ghost", "description", "Missing",
                "price", 1.0, "quantity", 1, "restaurantId", restaurant.getId());
        mockMvc.perform(put("/api/dishes/999999/edit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(21)
    @WithMockUser(roles = {"CUSTOMER"})
    void editDishAsCustomerReturns403() throws Exception {
        Map<String, Object> body = Map.of(
                "name", "Hack", "description", "Denied",
                "price", 1.0, "quantity", 1, "restaurantId", restaurant.getId());
        mockMvc.perform(put("/api/dishes/" + dish.getId() + "/edit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(22)
    @WithMockUser(roles = {"OWNER"})
    void deleteDishAsOwnerReturns200AndDeletesDish() throws Exception {
        mockMvc.perform(delete("/api/dishes/" + dish.getId() + "/delete"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Pizza"));
        assertThat(dishRepository.findById(dish.getId())).isEmpty();
    }

    @Test
    @Order(23)
    @WithMockUser(roles = {"OWNER"})
    void deleteDishNonExistingReturns404() throws Exception {
        mockMvc.perform(delete("/api/dishes/999999/delete"))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(24)
    @WithMockUser(roles = {"CUSTOMER"})
    void deleteDishAsCustomerReturns403() throws Exception {
        mockMvc.perform(delete("/api/dishes/" + dish.getId() + "/delete"))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(25)
    @WithMockUser(roles = {"CUSTOMER"})
    void getDishDetailsNonExistingReturns404() throws Exception {
        mockMvc.perform(get("/api/dishes/999999/details"))
                .andExpect(status().isNotFound());
    }
}