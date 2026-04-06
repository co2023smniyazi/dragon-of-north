package org.miniProjectTwo.DragonOfNorth.shared.exception;

import org.junit.jupiter.api.Test;
import org.miniProjectTwo.DragonOfNorth.shared.enums.ErrorCode;

import static org.junit.jupiter.api.Assertions.assertEquals;

class InvalidOAuthTokenExceptionTest {

    @Test
    void noArgConstructor_shouldUseInvalidOAuthTokenCode() {
        InvalidOAuthTokenException ex = new InvalidOAuthTokenException();
        assertEquals(ErrorCode.INVALID_OAUTH_TOKEN, ex.getErrorCode());
        assertEquals(ErrorCode.INVALID_OAUTH_TOKEN.getDefaultMessage(), ex.getMessage());
    }

    @Test
    void messageConstructor_shouldKeepDefaultMessage_whenFormatHasNoPlaceholders() {
        // INVALID_OAUTH_TOKEN has no format placeholders, so the message stays as the default
        InvalidOAuthTokenException ex = new InvalidOAuthTokenException("token expired");
        assertEquals(ErrorCode.INVALID_OAUTH_TOKEN, ex.getErrorCode());
        assertEquals(ErrorCode.INVALID_OAUTH_TOKEN.getDefaultMessage(), ex.getMessage());
    }
}
