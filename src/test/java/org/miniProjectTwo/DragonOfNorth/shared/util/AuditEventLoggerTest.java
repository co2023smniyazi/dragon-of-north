package org.miniProjectTwo.DragonOfNorth.shared.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@ExtendWith(MockitoExtension.class)
class AuditEventLoggerTest {

    @InjectMocks
    private AuditEventLogger auditEventLogger;

    @Test
    void log_shouldNotThrow_whenAllParametersProvided() {
        assertDoesNotThrow(() -> auditEventLogger.log(
                "LOGIN",
                UUID.randomUUID(),
                "device-123",
                "192.168.0.1",
                "SUCCESS",
                "Valid credentials",
                UUID.randomUUID().toString()
        ));
    }

    @Test
    void log_shouldNotThrow_whenOptionalParametersAreNull() {
        assertDoesNotThrow(() -> auditEventLogger.log(
                "OTP_VERIFY",
                null,
                null,
                null,
                "FAILURE",
                null,
                null
        ));
    }
}
