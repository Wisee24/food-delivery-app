package mk.ukim.finki.fooddeliverybackend.unit;

import mk.ukim.finki.fooddeliverybackend.model.domain.Dish;
import mk.ukim.finki.fooddeliverybackend.model.domain.Order;
import mk.ukim.finki.fooddeliverybackend.model.domain.Restaurant;
import mk.ukim.finki.fooddeliverybackend.model.domain.User;
import mk.ukim.finki.fooddeliverybackend.model.exceptions.DishOutOfStockException;
import mk.ukim.finki.fooddeliverybackend.repository.DishRepository;
import mk.ukim.finki.fooddeliverybackend.repository.OrderRepository;
import mk.ukim.finki.fooddeliverybackend.service.domain.impl.DishServiceImpl;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DishServiceImplTest {

    @Mock
    private DishRepository dishRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private DishServiceImpl dishService;

    private User user() {
        return new User("john", "pass", "John", "Doe", "john@example.com");
    }

    @Test
    void findAll_returnsAllDishes() {
        Dish d1 = new Dish("Pizza", "Cheese", 10.0, 5, null);
        Dish d2 = new Dish("Burger", "Beef", 8.0, 3, null);
        when(dishRepository.findAll()).thenReturn(List.of(d1, d2));

        List<Dish> result = dishService.findAll();

        assertThat(result).containsExactly(d1, d2);
    }

    @Test
    void findById_whenPresent_returnsDish() {
        Dish dish = new Dish("Pizza", "Cheese", 10.0, 5, null);
        when(dishRepository.findById(1L)).thenReturn(Optional.of(dish));

        Optional<Dish> result = dishService.findById(1L);

        assertThat(result).contains(dish);
    }

    @Test
    void findById_whenMissing_returnsEmpty() {
        when(dishRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Dish> result = dishService.findById(99L);

        assertThat(result).isEmpty();
    }

    @Test
    void save_delegatesToRepository() {
        Dish dish = new Dish("Pizza", "Cheese", 10.0, 5, null);
        when(dishRepository.save(dish)).thenReturn(dish);

        Dish result = dishService.save(dish);

        assertThat(result).isSameAs(dish);
        verify(dishRepository).save(dish);
    }

    @Test
    void update_whenExists_setsAllFieldsAndSaves() {
        Restaurant restaurant = new Restaurant("R1", "Italian");
        Dish existing = new Dish("Old", "Old desc", 5.0, 2, null);
        Dish updated = new Dish("New", "New desc", 12.0, 7, restaurant);
        when(dishRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(dishRepository.save(existing)).thenReturn(existing);

        Optional<Dish> result = dishService.update(1L, updated);

        assertThat(result).contains(existing);
        assertThat(existing.getName()).isEqualTo("New");
        assertThat(existing.getDescription()).isEqualTo("New desc");
        assertThat(existing.getPrice()).isEqualTo(12.0);
        assertThat(existing.getQuantity()).isEqualTo(7);
        assertThat(existing.getRestaurant()).isSameAs(restaurant);
        verify(dishRepository).save(existing);
    }

    @Test
    void update_whenNotFound_returnsEmptyAndDoesNotSave() {
        when(dishRepository.findById(42L)).thenReturn(Optional.empty());

        Optional<Dish> result = dishService.update(42L, new Dish("N", "D", 1.0, 1, null));

        assertThat(result).isEmpty();
        verify(dishRepository, never()).save(any());
    }

    @Test
    void deleteById_whenExists_deletesAndReturnsDish() {
        Dish dish = new Dish("Pizza", "Cheese", 10.0, 5, null);
        when(dishRepository.findById(1L)).thenReturn(Optional.of(dish));

        Optional<Dish> result = dishService.deleteById(1L);

        assertThat(result).contains(dish);
        verify(dishRepository).delete(dish);
    }

    @Test
    void deleteById_whenNotFound_returnsEmptyAndDoesNotDelete() {
        when(dishRepository.findById(77L)).thenReturn(Optional.empty());

        Optional<Dish> result = dishService.deleteById(77L);

        assertThat(result).isEmpty();
        verify(dishRepository, never()).delete(any());
    }

    @Test
    void addToOrder_whenInStock_decreasesQuantityAndSavesBoth() {
        Dish dish = new Dish("Pizza", "Cheese", 10.0, 5, null);
        Order order = new Order(user());
        when(dishRepository.save(dish)).thenReturn(dish);
        when(orderRepository.save(order)).thenReturn(order);

        Order result = dishService.addToOrder(dish, order);

        assertThat(dish.getQuantity()).isEqualTo(4);
        assertThat(order.getDishes()).containsExactly(dish);
        assertThat(result).isSameAs(order);
        verify(dishRepository).save(dish);
        verify(orderRepository).save(order);
    }

    @Test
    void addToOrder_whenQuantityZero_throwsDishOutOfStockException() {
        Dish dish = new Dish("Pizza", "Cheese", 10.0, 0, null);
        Order order = new Order(user());

        assertThatThrownBy(() -> dishService.addToOrder(dish, order))
                .isInstanceOf(DishOutOfStockException.class);

        verify(dishRepository, never()).save(any());
        verify(orderRepository, never()).save(any());
        assertThat(order.getDishes()).isEmpty();
    }

    @Test
    void removeFromOrder_increasesQuantityRemovesDishAndSavesBoth() {
        Dish dish = new Dish("Pizza", "Cheese", 10.0, 4, null);
        Order order = new Order(user());
        order.getDishes().add(dish);
        when(dishRepository.save(dish)).thenReturn(dish);
        when(orderRepository.save(order)).thenReturn(order);

        Order result = dishService.removeFromOrder(dish, order);

        assertThat(dish.getQuantity()).isEqualTo(5);
        assertThat(order.getDishes()).doesNotContain(dish);
        assertThat(result).isSameAs(order);
        verify(dishRepository).save(dish);
        verify(orderRepository).save(order);
    }

    @Test
    void addToOrder_whenQuantityOne_succeedsAndSetsQuantityZero() {
        Dish dish = new Dish("Pizza", "Cheese", 10.0, 1, null);
        Order order = new Order(user());
        when(dishRepository.save(dish)).thenReturn(dish);
        when(orderRepository.save(order)).thenReturn(order);

        Order result = dishService.addToOrder(dish, order);

        assertThat(dish.getQuantity()).isZero();
        assertThat(result.getDishes()).containsExactly(dish);
    }

    @Test
    void removeFromOrder_whenDishNotInOrder_currentlyStillIncrementsQuantity_DEF01() {
        Dish dish = new Dish("Pizza", "Cheese", 10.0, 4, null);
        Order order = new Order(user());
        when(dishRepository.save(dish)).thenReturn(dish);
        when(orderRepository.save(order)).thenReturn(order);

        Order result = dishService.removeFromOrder(dish, order);

        // Characterization of DEF-01: quantity is incremented even when dish was never in the order
        assertThat(dish.getQuantity()).isEqualTo(5);
        assertThat(result.getDishes()).isEmpty();
    }
}