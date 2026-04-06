package org.miniProjectTwo.DragonOfNorth.infrastructure.config;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GoogleOAuthConfigTest {

    private GoogleOAuthConfig config;

    @BeforeEach
    void setUp() {
        config = new GoogleOAuthConfig();
        config.setClientId("test-client-id.apps.googleusercontent.com");
    }

    @Test
    void googleIdTokenVerifier_shouldReturnNonNullVerifier() {
        GoogleIdTokenVerifier verifier = config.googleIdTokenVerifier();
        assertNotNull(verifier);
    }

    @Test
    void normalizedClientId_shouldTrimWhitespace() {
        config.setClientId("  my-client-id  ");
        assertEquals("my-client-id", config.normalizedClientId());
    }

    @Test
    void normalizedClientId_shouldReturnNull_whenClientIdIsNull() {
        config.setClientId(null);
        assertNull(config.normalizedClientId());
    }

    @Test
    void normalizedClientId_shouldReturnUnchanged_whenNoWhitespace() {
        config.setClientId("exact-client-id");
        assertEquals("exact-client-id", config.normalizedClientId());
    }
}
