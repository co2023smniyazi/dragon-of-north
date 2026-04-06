package org.miniProjectTwo.DragonOfNorth.shared.exception;

import org.junit.jupiter.api.Test;
import org.miniProjectTwo.DragonOfNorth.shared.enums.ErrorCode;

import static org.junit.jupiter.api.Assertions.*;

class BusinessExceptionTest {

    @Test
    void constructor_shouldSetErrorCode() {
        BusinessException ex = new BusinessException(ErrorCode.USER_NOT_FOUND);
        assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void constructor_shouldUseDefaultMessage_whenNoArgs() {
        BusinessException ex = new BusinessException(ErrorCode.USER_NOT_FOUND);
        assertEquals(ErrorCode.USER_NOT_FOUND.getDefaultMessage(), ex.getMessage());
    }

    @Test
    void constructor_shouldFormatMessage_whenArgsProvided() {
        BusinessException ex = new BusinessException(ErrorCode.USER_OPERATION_NOT_ALLOWED, "LOCAL_LOGIN", "LOCKED");
        String msg = ex.getMessage();
        assertTrue(msg.contains("LOCAL_LOGIN"), "message should contain operation name");
        assertTrue(msg.contains("LOCKED"), "message should contain status");
    }

    @Test
    void constructor_shouldReturnRawMessage_whenFormattingFails() {
        // ROLE_NOT_FOUND has one %s placeholder; passing no args triggers the format fallback
        BusinessException ex = new BusinessException(ErrorCode.ROLE_NOT_FOUND);
        assertEquals(ErrorCode.ROLE_NOT_FOUND.getDefaultMessage(), ex.getMessage());
    }

    @Test
    void constructor_shouldStoreArgs() {
        Object[] args = {"arg1", "arg2"};
        BusinessException ex = new BusinessException(ErrorCode.USER_OPERATION_NOT_ALLOWED, args);
        assertArrayEquals(args, ex.getArgs());
    }

    @Test
    void constructor_shouldHandleNullArgs_gracefully() {
        BusinessException ex = new BusinessException(ErrorCode.USER_NOT_FOUND, (Object[]) null);
        assertEquals(ErrorCode.USER_NOT_FOUND.getDefaultMessage(), ex.getMessage());
    }
}
