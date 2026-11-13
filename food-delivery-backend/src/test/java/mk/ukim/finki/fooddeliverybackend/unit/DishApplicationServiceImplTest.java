package mk.ukim.finki.fooddeliverybackend.unit;

import mk.ukim.finki.fooddeliverybackend.dto.domain.CreateDishDto;
import mk.ukim.finki.fooddeliverybackend.dto.domain.DisplayDishDetailsDto;
import mk.ukim.finki.fooddeliverybackend.dto.domain.DisplayDishDto;
import mk.ukim.finki.fooddeliverybackend.dto.domain.DisplayOrderDto;
import mk.ukim.finki.fooddeliverybackend.model.domain.Dish;
import mk.ukim.finki.fooddeliverybackend.model.domain.Order;
import mk.ukim.finki.fooddeliverybackend.model.domain.Restaurant;
import mk.ukim.finki.fooddeliverybackend.model.domain.User;
import mk.ukim.finki.fooddeliverybackend.model.exceptions.DishNotFoundException;
import mk.ukim.finki.fooddeliverybackend.model.exceptions.RestaurantNotFoundException;
import mk.ukim.finki.fooddeliverybackend.service.application.impl.DishApplicationServiceImpl;
import mk.ukim.finki.fooddeliverybackend.service.domain.DishService;
import mk.ukim.finki.fooddeliverybackend.service.domain.OrderService;
import mk.ukim.finki.fooddeliverybackend.service.domain.RestaurantService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DishApplicationServiceImplTest {

    @Mock
    private DishService dishService;

    @Mock
    private RestaurantService restaurantService;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private DishApplicationServiceImpl dishApplicationService;

    private Restaurant restaurant(Long id) {
        Restaurant r = new Restaurant("Bistro", "Cozy bistro");
        r.setId(id);
        return r;
    }

    private Dish dish(Long id, Restaurant restaurant) {
        Dish d = new Dish("Pizza", "Cheese pizza", 10.0, 5, restaurant);
        d.setId(id);
        return d;
    }

    @Test
    void findAll_mapsAllDishesToDtos() {
        Restaurant r = restaurant(1L);
        when(dishService.findAll()).thenReturn(List.of(dish(10L, r)));

        List<DisplayDishDto> result = dishApplicationService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Pizza");
        assertThat(result.get(0).restaurantId()).isEqualTo(1L);
    }

    @Test
    void findByIdWithDetails_whenPresent_returnsDetailsDtoWithRestaurant() {
        Restaurant r = restaurant(1L);
        when(dishService.findById(10L)).thenReturn(Optional.of(dish(10L, r)));

        Optional<DisplayDishDetailsDto> result = dishApplicationService.findByIdWithDetails(10L);

        assertThat(result).isPresent();
        assertThat(result.get().restaurant().name()).isEqualTo("Bistro");
    }

    @Test
    void save_whenRestaurantExists_savesAndReturnsDto() {
        Restaurant r = restaurant(1L);
        CreateDishDto dto = new CreateDishDto("Pasta", "Creamy", 12.0, 8, 1L);
        Dish saved = dish(20L, r);
        saved.setName("Pasta");
        when(restaurantService.findById(1L)).thenReturn(Optional.of(r));
        when(dishService.save(any(Dish.class))).thenReturn(saved);

        DisplayDishDto result = dishApplicationService.save(dto);

        assertThat(result.id()).isEqualTo(20L);
        assertThat(result.name()).isEqualTo("Pasta");
        assertThat(result.restaurantId()).isEqualTo(1L);
    }

    @Test
    void save_whenRestaurantMissing_throwsRestaurantNotFoundException() {
        CreateDishDto dto = new CreateDishDto("Pasta", "Creamy", 12.0, 8, 999L);
        when(restaurantService.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dishApplicationService.save(dto))
                .isInstanceOf(RestaurantNotFoundException.class);

        verifyNoInteractions(dishService);
    }

    @Test
    void update_whenRestaurantAndDishExist_updatesAndReturnsDto() {
        Restaurant r = restaurant(1L);
        CreateDishDto dto = new CreateDishDto("Updated", "New desc", 15.0, 3, 1L);
        Dish updated = dish(10L, r);
        updated.setName("Updated");
        when(restaurantService.findById(1L)).thenReturn(Optional.of(r));
        when(dishService.update(eq(10L), any(Dish.class))).thenReturn(Optional.of(updated));

        Optional<DisplayDishDto> result = dishApplicationService.update(10L, dto);

        assertThat(result).isPresent();
        assertThat(result.get().name()).isEqualTo("Updated");
    }

    @Test
    void update_whenRestaurantMissing_throwsRestaurantNotFoundException() {
        CreateDishDto dto = new CreateDishDto("Updated", "New desc", 15.0, 3, 999L);
        when(restaurantService.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dishApplicationService.update(10L, dto))
                .isInstanceOf(RestaurantNotFoundException.class);

        verifyNoInteractions(dishService);
    }

    @Test
    void update_whenDishMissing_returnsEmpty() {
        Restaurant r = restaurant(1L);
        CreateDishDto dto = new CreateDishDto("Updated", "New desc", 15.0, 3, 1L);
        when(restaurantService.findById(1L)).thenReturn(Optional.of(r));
        when(dishService.update(eq(999L), any(Dish.class))).thenReturn(Optional.empty());

        assertThat(dishApplicationService.update(999L, dto)).isEmpty();
    }

    @Test
    void addToOrder_whenDishExists_delegatesAndMapsOrder() {
        Restaurant r = restaurant(1L);
        Dish d = dish(10L, r);
        User user = new User("john", "pass", "John", "Doe", "john@example.com");
        Order order = new Order(user);
        order.getDishes().add(d);

        when(dishService.findById(10L)).thenReturn(Optional.of(d));
        when(orderService.findOrCreatePending("john")).thenReturn(order);
        when(dishService.addToOrder(d, order)).thenReturn(order);

        DisplayOrderDto result = dishApplicationService.addToOrder(10L, "john");

        assertThat(result.username()).isEqualTo("john");
        assertThat(result.dishes()).hasSize(1);
    }

    @Test
    void addToOrder_whenDishMissing_throwsDishNotFoundException() {
        when(dishService.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dishApplicationService.addToOrder(999L, "john"))
                .isInstanceOf(DishNotFoundException.class);

        verifyNoInteractions(orderService);
    }

    @Test
    void removeFromOrder_whenDishMissing_throwsDishNotFoundException() {
        when(dishService.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dishApplicationService.removeFromOrder(999L, "john"))
                .isInstanceOf(DishNotFoundException.class);

        verifyNoInteractions(orderService);
    }
}
