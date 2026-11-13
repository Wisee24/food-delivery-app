package mk.ukim.finki.fooddeliverybackend.unit;

import mk.ukim.finki.fooddeliverybackend.model.domain.Dish;
import mk.ukim.finki.fooddeliverybackend.model.domain.Order;
import mk.ukim.finki.fooddeliverybackend.model.domain.User;
import mk.ukim.finki.fooddeliverybackend.model.enums.OrderStatus;
import mk.ukim.finki.fooddeliverybackend.model.exceptions.EmptyOrderException;
import mk.ukim.finki.fooddeliverybackend.model.exceptions.UserNotFoundException;
import mk.ukim.finki.fooddeliverybackend.repository.DishRepository;
import mk.ukim.finki.fooddeliverybackend.repository.OrderRepository;
import mk.ukim.finki.fooddeliverybackend.repository.UserRepository;
import mk.ukim.finki.fooddeliverybackend.service.domain.impl.OrderServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DishRepository dishRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    private final User user = new User("john", "pass", "John", "Doe", "john@example.com");

    @Test
    void findPending_whenOrderExists_returnsPendingOrder() {
        Order order = new Order(user);
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));
        when(orderRepository.findByUserAndStatus(user, OrderStatus.PENDING))
                .thenReturn(Optional.of(order));

        Optional<Order> result = orderService.findPending("john");

        assertThat(result).contains(order);
        assertThat(result.orElseThrow().getStatus()).isEqualTo(OrderStatus.PENDING);
    }

    @Test
    void findPending_whenNoPendingOrder_returnsEmpty() {
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));
        when(orderRepository.findByUserAndStatus(user, OrderStatus.PENDING))
                .thenReturn(Optional.empty());

        Optional<Order> result = orderService.findPending("john");

        assertThat(result).isEmpty();
    }

    @Test
    void findPending_whenUnknownUser_throwsUserNotFoundException() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.findPending("ghost"))
                .isInstanceOf(UserNotFoundException.class);

        verify(orderRepository, never()).findByUserAndStatus(any(), any());
    }

    @Test
    void findOrCreatePending_whenPendingExists_returnsItWithoutSaving() {
        Order order = new Order(user);
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));
        when(orderRepository.findByUserAndStatus(user, OrderStatus.PENDING))
                .thenReturn(Optional.of(order));

        Order result = orderService.findOrCreatePending("john");

        assertThat(result).isSameAs(order);
        verify(orderRepository, never()).save(any());
    }

    @Test
    void findOrCreatePending_whenNoneExists_createsAndSavesNewOrder() {
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));
        when(orderRepository.findByUserAndStatus(user, OrderStatus.PENDING))
                .thenReturn(Optional.empty());
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Order result = orderService.findOrCreatePending("john");

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        assertThat(captor.getValue()).isSameAs(result);
        assertThat(result.getUser()).isSameAs(user);
        assertThat(result.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(result.getDishes()).isEmpty();
    }

    @Test
    void confirm_whenOrderHasDishes_setsConfirmedAndSaves() {
        Order order = new Order(user);
        order.getDishes().add(new Dish("Pizza", "Cheese", 10.0, 5, null));
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));
        when(orderRepository.findByUserAndStatus(user, OrderStatus.PENDING))
                .thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        Optional<Order> result = orderService.confirm("john");

        assertThat(result).contains(order);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        verify(orderRepository).save(order);
    }

    @Test
    void confirm_whenOrderIsEmpty_throwsEmptyOrderException() {
        Order order = new Order(user);
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));
        when(orderRepository.findByUserAndStatus(user, OrderStatus.PENDING))
                .thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.confirm("john"))
                .isInstanceOf(EmptyOrderException.class);

        verify(orderRepository, never()).save(any());
    }

    @Test
    void confirm_whenNoPendingOrder_returnsEmpty() {
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));
        when(orderRepository.findByUserAndStatus(user, OrderStatus.PENDING))
                .thenReturn(Optional.empty());

        Optional<Order> result = orderService.confirm("john");

        assertThat(result).isEmpty();
        verify(orderRepository, never()).save(any());
    }

    @Test
    void cancel_whenOrderHasDishes_setsCanceledAndSaves() {
        Order order = new Order(user);
        order.getDishes().add(new Dish("Pizza", "Cheese", 10.0, 5, null));
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));
        when(orderRepository.findByUserAndStatus(user, OrderStatus.PENDING))
                .thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        Optional<Order> result = orderService.cancel("john");

        assertThat(result).contains(order);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELED);
        verify(orderRepository).save(order);
    }

    @Test
    void cancel_whenOrderIsEmpty_throwsEmptyOrderException() {
        Order order = new Order(user);
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));
        when(orderRepository.findByUserAndStatus(user, OrderStatus.PENDING))
                .thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancel("john"))
                .isInstanceOf(EmptyOrderException.class);

        verify(orderRepository, never()).save(any());
    }

    @Test
    void cancel_whenNoPendingOrder_returnsEmpty() {
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));
        when(orderRepository.findByUserAndStatus(user, OrderStatus.PENDING))
                .thenReturn(Optional.empty());

        Optional<Order> result = orderService.cancel("john");

        assertThat(result).isEmpty();
        verify(orderRepository, never()).save(any());
    }

    @Test
    void confirm_whenUnknownUser_throwsUserNotFoundException() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.confirm("ghost"))
                .isInstanceOf(UserNotFoundException.class);

        verify(orderRepository, never()).save(any());
    }

    @Test
    void cancel_whenUnknownUser_throwsUserNotFoundException() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.cancel("ghost"))
                .isInstanceOf(UserNotFoundException.class);

        verify(orderRepository, never()).save(any());
    }
}