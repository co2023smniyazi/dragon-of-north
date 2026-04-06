package org.miniProjectTwo.DragonOfNorth.security.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.miniProjectTwo.DragonOfNorth.shared.enums.ErrorCode;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.InvalidCsrfTokenException;
import org.springframework.security.web.csrf.MissingCsrfTokenException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RestAccessDeniedHandlerTest {

    private RestAccessDeniedHandler handler;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        RestAuthenticationEntryPoint entryPoint = new RestAuthenticationEntryPoint(objectMapper);
        handler = new RestAccessDeniedHandler(objectMapper, entryPoint);
        SecurityContextHolder.clearContext();
    }

    @Test
    void handle_shouldReturn403CsrfInvalid_whenInvalidCsrfTokenException() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        CsrfToken expectedToken = mock(CsrfToken.class);
        when(expectedToken.getParameterName()).thenReturn("_csrf");
        InvalidCsrfTokenException csrfEx = new InvalidCsrfTokenException(expectedToken, "bad");

        handler.handle(request, response, csrfEx);

        assertEquals(ErrorCode.CSRF_INVALID.getHttpStatus().value(), response.getStatus());
        JsonNode json = objectMapper.readTree(response.getContentAsString());
        assertEquals(ErrorCode.CSRF_INVALID.getCode(), json.get("data").get("code").asText());
    }

    @Test
    void handle_shouldReturn403CsrfInvalid_whenMissingCsrfTokenException() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        MissingCsrfTokenException csrfEx = new MissingCsrfTokenException("csrf");

        handler.handle(request, response, csrfEx);

        assertEquals(ErrorCode.CSRF_INVALID.getHttpStatus().value(), response.getStatus());
        JsonNode json = objectMapper.readTree(response.getContentAsString());
        assertEquals(ErrorCode.CSRF_INVALID.getCode(), json.get("data").get("code").asText());
    }

    @Test
    void handle_shouldDelegate401_whenUnauthenticatedUser() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        SecurityContextHolder.clearContext();

        handler.handle(request, response, new AccessDeniedException("denied"));

        assertEquals(ErrorCode.INVALID_TOKEN.getHttpStatus().value(), response.getStatus());
    }

    @Test
    void handle_shouldDelegate401_whenAnonymousAuthentication() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        AnonymousAuthenticationToken anonToken = new AnonymousAuthenticationToken(
                "key", "anonymousUser", List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS")));
        SecurityContextHolder.getContext().setAuthentication(anonToken);

        handler.handle(request, response, new AccessDeniedException("denied"));

        assertEquals(ErrorCode.INVALID_TOKEN.getHttpStatus().value(), response.getStatus());
    }

    @Test
    void handle_shouldReturn403AccessDenied_whenAuthenticatedUser() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user", null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        handler.handle(request, response, new AccessDeniedException("forbidden"));

        assertEquals(ErrorCode.ACCESS_DENIED.getHttpStatus().value(), response.getStatus());
        JsonNode json = objectMapper.readTree(response.getContentAsString());
        assertEquals(ErrorCode.ACCESS_DENIED.getCode(), json.get("data").get("code").asText());
    }

    @Test
    void handle_shouldSkip_whenResponseAlreadyCommitted() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setCommitted(true);

        handler.handle(request, response, new AccessDeniedException("denied"));

        assertEquals("", response.getContentAsString());
    }
}
