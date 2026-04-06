package org.miniProjectTwo.DragonOfNorth.security.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.miniProjectTwo.DragonOfNorth.shared.enums.ErrorCode;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.AuthenticationException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RestAuthenticationEntryPointTest {

    private RestAuthenticationEntryPoint entryPoint;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        entryPoint = new RestAuthenticationEntryPoint(objectMapper);
    }

    @Test
    void commence_shouldReturn401_withInvalidTokenCode() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        AuthenticationException authException = new AuthenticationException("not authenticated") {};

        entryPoint.commence(request, response, authException);

        assertEquals(ErrorCode.INVALID_TOKEN.getHttpStatus().value(), response.getStatus());
        assertEquals("application/json", response.getContentType());

        JsonNode json = objectMapper.readTree(response.getContentAsString());
        assertEquals("failed", json.get("apiResponseStatus").asText());
        assertEquals(ErrorCode.INVALID_TOKEN.getCode(), json.get("data").get("code").asText());
    }

    @Test
    void commence_shouldSkip_whenResponseAlreadyCommitted() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setCommitted(true);
        AuthenticationException authException = new AuthenticationException("not authenticated") {};

        entryPoint.commence(request, response, authException);

        // Response body should remain empty since we short-circuited
        assertEquals("", response.getContentAsString());
    }
}
