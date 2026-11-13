package mk.ukim.finki.fooddeliverybackend.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.ServletException;
import mk.ukim.finki.fooddeliverybackend.constants.JwtConstants;
import mk.ukim.finki.fooddeliverybackend.helpers.JwtHelper;
import mk.ukim.finki.fooddeliverybackend.model.domain.User;
import mk.ukim.finki.fooddeliverybackend.model.enums.Role;
import mk.ukim.finki.fooddeliverybackend.model.exceptions.IncorrectPasswordException;
import mk.ukim.finki.fooddeliverybackend.model.exceptions.UsernameAlreadyExistsException;
import mk.ukim.finki.fooddeliverybackend.repository.OrderRepository;
import mk.ukim.finki.fooddeliverybackend.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class UserApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtHelper jwtHelper;

    private User customerUser;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
        userRepository.deleteAll();
        userRepository.save(new User("existinguser", passwordEncoder.encode("pass123"),
                "Exist", "Ing", "existing@email.com", Role.ROLE_CUSTOMER));
        customerUser = userRepository.save(new User("testcustomer", passwordEncoder.encode("pass123"),
                "Test", "Customer", "customer@email.com", Role.ROLE_CUSTOMER));
    }

    @Test
    @Order(1)
    void registerValidUserReturns200WithUserData() throws Exception {
        Map<String, String> body = Map.of(
                "username", "newuser", "password", "secret123",
                "name", "New", "surname", "User", "email", "new@email.com");

        mockMvc.perform(post("/api/user/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("newuser"))
                .andExpect(jsonPath("$.name").value("New"))
                .andExpect(jsonPath("$.surname").value("User"))
                .andExpect(jsonPath("$.email").value("new@email.com"));
    }

    @Test
    @Order(2)
    void registerDuplicateUsernameThrowsServletException() {
        Map<String, String> body = Map.of(
                "username", "existinguser", "password", "another",
                "name", "Dup", "surname", "User", "email", "dup@email.com");

        ServletException ex = assertThrows(ServletException.class, () ->
                mockMvc.perform(post("/api/user/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))));
        assertThat(ex.getCause()).isInstanceOf(UsernameAlreadyExistsException.class);
    }

    @Test
    @Order(3)
    void registerMissingPasswordThrowsIllegalArgumentException_DEF10() {
        Map<String, String> body = Map.of("username", "nofields");

        ServletException ex = assertThrows(ServletException.class, () ->
                mockMvc.perform(post("/api/user/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))));
        assertThat(ex.getCause()).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @Order(4)
    void loginWithValidCredentialsReturns200AndToken() throws Exception {
        Map<String, String> body = Map.of("username", "existinguser", "password", "pass123");

        mockMvc.perform(post("/api/user/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(not(emptyOrNullString())));
    }

    @Test
    @Order(5)
    void loginWithWrongPasswordThrowsServletException() {
        Map<String, String> body = Map.of("username", "existinguser", "password", "wrong-password");

        ServletException ex = assertThrows(ServletException.class, () ->
                mockMvc.perform(post("/api/user/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))));
        assertThat(ex.getCause()).isInstanceOf(IncorrectPasswordException.class);
    }

    @Test
    @Order(6)
    void loginWithUnknownUsernameReturns403() throws Exception {
        // UsernameNotFoundException extends AuthenticationException,
        // caught by ExceptionTranslationFilter → 403
        Map<String, String> body = Map.of("username", "ghost", "password", "whatever");

        mockMvc.perform(post("/api/user/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(7)
    @WithMockUser(roles = {"ADMIN"})
    void getExistingUserByUsernameAsAdminReturns200() throws Exception {
        mockMvc.perform(get("/api/user/testcustomer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testcustomer"))
                .andExpect(jsonPath("$.name").value("Test"));
    }

    @Test
    @Order(8)
    @WithMockUser(roles = {"CUSTOMER"})
    void getUserByUsernameAsCustomerReturns403() throws Exception {
        mockMvc.perform(get("/api/user/testcustomer"))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(9)
    @WithMockUser(roles = {"ADMIN"})
    void getNonExistingUserReturns404() throws Exception {
        mockMvc.perform(get("/api/user/nosuchuser"))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(10)
    void meWithValidJwtReturns200WithCurrentUser() throws Exception {
        String token = jwtHelper.generateToken(customerUser);

        mockMvc.perform(get("/api/user/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testcustomer"))
                .andExpect(jsonPath("$.email").value("customer@email.com"))
                .andExpect(jsonPath("$.role").value("ROLE_CUSTOMER"));
    }

    @Test
    @Order(11)
    void unauthenticatedAccessToMeReturns403() throws Exception {
        // No custom AuthenticationEntryPoint configured → 403 instead of 401 (DEF-09)
        mockMvc.perform(get("/api/user/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(12)
    void meWithInvalidJwtSignatureReturns401() throws Exception {
        Key wrongKey = Keys.hmacShaKeyFor(
                "wrong-secret-key-wrong-secret-key-wrong-secret-key-1234".getBytes(StandardCharsets.UTF_8));
        String badSigToken = Jwts.builder()
                .setSubject("testcustomer")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(wrongKey, SignatureAlgorithm.HS256)
                .compact();

        mockMvc.perform(get("/api/user/me")
                        .header("Authorization", "Bearer " + badSigToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("The token's signature is invalid."));
    }

    @Test
    @Order(13)
    void meWithExpiredJwtReturns401() throws Exception {
        Key signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(JwtConstants.SECRET_KEY));
        String expiredToken = Jwts.builder()
                .setSubject("testcustomer")
                .setIssuedAt(new Date(System.currentTimeMillis() - 120_000))
                .setExpiration(new Date(System.currentTimeMillis() - 60_000))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();

        mockMvc.perform(get("/api/user/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("The token has expired."));
    }

    @Test
    @Order(14)
    void meWithMalformedJwtReturns401() throws Exception {
        mockMvc.perform(get("/api/user/me")
                        .header("Authorization", "Bearer not.a.jwt"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("The token is invalid."));
    }
}
