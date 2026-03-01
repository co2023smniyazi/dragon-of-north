package org.miniProjectTwo.DragonOfNorth.dto.OAuth;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OAuthLoginRequestTest {

    @Test
    void builder_shouldCreateRequestWithAllFields() {
        // act
        OAuthLoginRequest request = OAuthLoginRequest.builder()
                .idToken("sample-id-token-123456789")
                .deviceId("device-123")
                .build();

        // assert
        assertEquals("sample-id-token-123456789", request.idToken());
        assertEquals("device-123", request.deviceId());
    }

    @Test
    void record_shouldWorkCorrectly() {
        // arrange
        OAuthLoginRequest request = new OAuthLoginRequest("test-token", "test-device");

        // assert
        assertEquals("test-token", request.idToken());
        assertEquals("test-device", request.deviceId());
    }

    @Test
    void equals_shouldWorkCorrectly() {
        // arrange
        OAuthLoginRequest request1 = new OAuthLoginRequest("token", "device");
        OAuthLoginRequest request2 = new OAuthLoginRequest("token", "device");
        OAuthLoginRequest request3 = new OAuthLoginRequest("different-token", "device");

        // assert
        assertEquals(request1, request2);
        assertNotEquals(request1, request3);
    }

    @Test
    void hashCode_shouldWorkCorrectly() {
        // arrange
        OAuthLoginRequest request1 = new OAuthLoginRequest("token", "device");
        OAuthLoginRequest request2 = new OAuthLoginRequest("token", "device");

        // assert
        assertEquals(request1.hashCode(), request2.hashCode());
    }

    @Test
    void toString_shouldContainAllFields() {
        // arrange
        OAuthLoginRequest request = new OAuthLoginRequest("test-token", "test-device");

        // act
        String result = request.toString();

        // assert
        assertTrue(result.contains("test-token"));
        assertTrue(result.contains("test-device"));
    }
}
