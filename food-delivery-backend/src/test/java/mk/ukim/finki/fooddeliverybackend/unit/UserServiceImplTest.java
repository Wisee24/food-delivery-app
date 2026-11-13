package mk.ukim.finki.fooddeliverybackend.unit;

import mk.ukim.finki.fooddeliverybackend.model.domain.User;
import mk.ukim.finki.fooddeliverybackend.model.exceptions.IncorrectPasswordException;
import mk.ukim.finki.fooddeliverybackend.model.exceptions.UsernameAlreadyExistsException;
import mk.ukim.finki.fooddeliverybackend.repository.UserRepository;
import mk.ukim.finki.fooddeliverybackend.service.domain.impl.UserServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void register_whenUsernameAvailable_encodesPasswordAndSaves() {
        User input = new User("alice", "plain-pass", "Alice", "Smith", "alice@example.com");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("plain-pass")).thenReturn("encoded-pass");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.register(input);

        verify(passwordEncoder).encode("plain-pass");
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getUsername()).isEqualTo("alice");
        assertThat(saved.getPassword()).isEqualTo("encoded-pass");
        assertThat(saved.getName()).isEqualTo("Alice");
        assertThat(saved.getSurname()).isEqualTo("Smith");
        assertThat(saved.getEmail()).isEqualTo("alice@example.com");
        assertThat(result).isSameAs(saved);
    }

    @Test
    void register_whenUsernameExists_throwsUsernameAlreadyExistsException() {
        User input = new User("bob", "pass", "Bob", "Jones", "bob@example.com");
        when(userRepository.findByUsername("bob"))
                .thenReturn(Optional.of(new User("bob", "old", "Old", "User", "old@example.com")));

        assertThatThrownBy(() -> userService.register(input))
                .isInstanceOf(UsernameAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void login_whenPasswordMatches_returnsUser() {
        User user = new User("carol", "encoded", "Carol", "White", "carol@example.com");
        when(userRepository.findByUsername("carol")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "encoded")).thenReturn(true);

        User result = userService.login("carol", "secret");

        assertThat(result).isSameAs(user);
        verify(passwordEncoder).matches("secret", "encoded");
    }

    @Test
    void login_whenPasswordWrong_throwsIncorrectPasswordException() {
        User user = new User("dave", "encoded", "Dave", "Black", "dave@example.com");
        when(userRepository.findByUsername("dave")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        assertThatThrownBy(() -> userService.login("dave", "wrong"))
                .isInstanceOf(IncorrectPasswordException.class);
    }

    @Test
    void login_whenUsernameUnknown_throwsUsernameNotFoundException() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.login("ghost", "any"))
                .isInstanceOf(UsernameNotFoundException.class);

        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void findByUsername_whenPresent_returnsOptionalWithUser() {
        User user = new User("erin", "pw", "Erin", "Green", "erin@example.com");
        when(userRepository.findByUsername("erin")).thenReturn(Optional.of(user));

        Optional<User> result = userService.findByUsername("erin");

        assertThat(result).containsSame(user);
    }

    @Test
    void findByUsername_whenMissing_returnsEmptyOptional() {
        when(userRepository.findByUsername("missing")).thenReturn(Optional.empty());

        assertThat(userService.findByUsername("missing")).isEmpty();
    }

    @Test
    void loadUserByUsername_whenPresent_returnsUserDetails() {
        User user = new User("frank", "pw", "Frank", "Brown", "frank@example.com");
        when(userRepository.findByUsername("frank")).thenReturn(Optional.of(user));

        UserDetails details = userService.loadUserByUsername("frank");

        assertThat(details).isSameAs(user);
        assertThat(details.getUsername()).isEqualTo("frank");
    }

    @Test
    void loadUserByUsername_whenMissing_throwsUsernameNotFoundException() {
        when(userRepository.findByUsername("nobody")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.loadUserByUsername("nobody"))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
