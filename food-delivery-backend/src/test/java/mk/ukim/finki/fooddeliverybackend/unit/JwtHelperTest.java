package mk.ukim.finki.fooddeliverybackend.unit;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import mk.ukim.finki.fooddeliverybackend.helpers.JwtHelper;
import mk.ukim.finki.fooddeliverybackend.model.domain.User;
import mk.ukim.finki.fooddeliverybackend.model.enums.Role;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtHelperTest {

    private final JwtHelper jwtHelper = new JwtHelper();

    @Test
    void generateToken_extractsUsernameAndNotExpired() {
        User user = new User("alice", "encoded", "Alice", "Smith", "alice@example.com", Role.ROLE_CUSTOMER);

        String token = jwtHelper.generateToken(user);

        assertThat(token).isNotBlank();
        assertThat(jwtHelper.extractUsername(token)).isEqualTo("alice");
        assertThat(jwtHelper.extractExpiration(token)).isAfter(new Date());
        assertThat(jwtHelper.isExpired(token)).isFalse();
    }

    @Test
    void extractUsername_withInvalidSignature_throwsSignatureException() {
        Key wrongKey = Keys.hmacShaKeyFor(
                "wrong-secret-key-wrong-secret-key-wrong-secret-key-1234".getBytes(StandardCharsets.UTF_8)
        );
        String forged = Jwts.builder()
                .setSubject("admin")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(wrongKey, SignatureAlgorithm.HS256)
                .compact();

        assertThatThrownBy(() -> jwtHelper.extractUsername(forged))
                .isInstanceOf(SignatureException.class);
    }

    @Test
    void extractUsername_withMalformedToken_throwsMalformedJwtException() {
        assertThatThrownBy(() -> jwtHelper.extractUsername("not.a.jwt"))
                .isInstanceOf(MalformedJwtException.class);
    }
}
