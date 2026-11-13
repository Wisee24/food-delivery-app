package mk.ukim.finki.fooddeliverybackend.unit;

import mk.ukim.finki.fooddeliverybackend.model.domain.Restaurant;
import mk.ukim.finki.fooddeliverybackend.repository.RestaurantRepository;
import mk.ukim.finki.fooddeliverybackend.service.domain.impl.RestaurantServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RestaurantServiceImplTest {

    @Mock
    private RestaurantRepository restaurantRepository;

    @InjectMocks
    private RestaurantServiceImpl restaurantService;

    @Test
    void findAll_returnsAllRestaurants() {
        Restaurant r1 = new Restaurant("Pizza Place", "Best pizza");
        Restaurant r2 = new Restaurant("Sushi Bar", "Fresh sushi");
        when(restaurantRepository.findAll()).thenReturn(List.of(r1, r2));

        List<Restaurant> result = restaurantService.findAll();

        assertThat(result).containsExactly(r1, r2);
        verify(restaurantRepository).findAll();
    }

    @Test
    void findById_whenExists_returnsRestaurant() {
        Restaurant restaurant = new Restaurant("Grill House", "Grilled dishes");
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));

        Optional<Restaurant> result = restaurantService.findById(1L);

        assertThat(result).containsSame(restaurant);
    }

    @Test
    void findById_whenMissing_returnsEmpty() {
        when(restaurantRepository.findById(99L)).thenReturn(Optional.empty());

        assertThat(restaurantService.findById(99L)).isEmpty();
    }

    @Test
    void save_delegatesToRepositoryAndReturnsSaved() {
        Restaurant restaurant = new Restaurant("New Place", "New description");
        when(restaurantRepository.save(restaurant)).thenReturn(restaurant);

        Restaurant result = restaurantService.save(restaurant);

        assertThat(result).isSameAs(restaurant);
        verify(restaurantRepository).save(restaurant);
    }

    @Test
    void update_whenExists_updatesFieldsAndSaves() {
        Restaurant existing = new Restaurant("Old Name", "Old description");
        Restaurant updates = new Restaurant("New Name", "New description");
        when(restaurantRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(restaurantRepository.save(existing)).thenReturn(existing);

        Optional<Restaurant> result = restaurantService.update(5L, updates);

        assertThat(result).containsSame(existing);
        assertThat(existing.getName()).isEqualTo("New Name");
        assertThat(existing.getDescription()).isEqualTo("New description");
        verify(restaurantRepository).save(existing);
    }

    @Test
    void update_whenNotFound_returnsEmptyAndDoesNotSave() {
        when(restaurantRepository.findById(42L)).thenReturn(Optional.empty());

        Optional<Restaurant> result = restaurantService.update(42L, new Restaurant("X", "Y"));

        assertThat(result).isEmpty();
        verify(restaurantRepository, never()).save(any());
    }

    @Test
    void deleteById_whenExists_deletesAndReturnsRestaurant() {
        Restaurant restaurant = new Restaurant("To Delete", "Gone soon");
        when(restaurantRepository.findById(7L)).thenReturn(Optional.of(restaurant));

        Optional<Restaurant> result = restaurantService.deleteById(7L);

        assertThat(result).containsSame(restaurant);
        verify(restaurantRepository).delete(restaurant);
    }

    @Test
    void deleteById_whenNotFound_returnsEmptyAndDoesNotDelete() {
        when(restaurantRepository.findById(77L)).thenReturn(Optional.empty());

        Optional<Restaurant> result = restaurantService.deleteById(77L);

        assertThat(result).isEmpty();
        verify(restaurantRepository, never()).delete(any());
    }
}
