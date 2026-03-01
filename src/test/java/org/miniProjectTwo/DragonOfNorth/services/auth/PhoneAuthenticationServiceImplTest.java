package org.miniProjectTwo.DragonOfNorth.services.auth;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.miniProjectTwo.DragonOfNorth.components.AuditEventLogger;
import org.miniProjectTwo.DragonOfNorth.dto.auth.request.AppUserSignUpRequest;
import org.miniProjectTwo.DragonOfNorth.dto.auth.response.AppUserStatusFinderResponse;
import org.miniProjectTwo.DragonOfNorth.enums.AppUserStatus;
import org.miniProjectTwo.DragonOfNorth.enums.IdentifierType;
import org.miniProjectTwo.DragonOfNorth.exception.BusinessException;
import org.miniProjectTwo.DragonOfNorth.model.AppUser;
import org.miniProjectTwo.DragonOfNorth.repositories.AppUserRepository;
import org.miniProjectTwo.DragonOfNorth.serviceInterfaces.AuthCommonServices;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.miniProjectTwo.DragonOfNorth.enums.AppUserStatus.ACTIVE;
import static org.miniProjectTwo.DragonOfNorth.enums.IdentifierType.PHONE;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PhoneAuthenticationServiceImplTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthCommonServices authCommonServices;
    @Mock
    private MeterRegistry meterRegistry;
    @Mock
    private Counter counter;
    @Mock
    private AuditEventLogger auditEventLogger;


    @InjectMocks
    private PhoneAuthenticationServiceImpl phoneAuthenticationService;


    private final String phoneNumber = "9838291289";

    @Test
    void supports_ShouldReturnPHONE_WhenCalled() {
        // act
        IdentifierType type = phoneAuthenticationService.supports();

        // assert
        assertEquals(PHONE, type, "PhoneAuthenticationServiceImpl should support PHONE identifier type");

    }

    @Test
    void getUserStatus_ShouldReturnStatus_WhenUserExists() {

        when(meterRegistry.counter(anyString())).thenReturn(counter);
        //arrange
        AppUserStatus expectedStatus = ACTIVE;

        when(appUserRepository.findAppUserStatusByPhone(phoneNumber)).thenReturn(Optional.of(expectedStatus));

        //act
        AppUserStatusFinderResponse response = phoneAuthenticationService.getUserStatus(phoneNumber);

        //assert
        assertNotNull(response, "status should be returned upon calling this method");
        assertEquals(expectedStatus, response.appUserStatus(), "user status should be ACTIVE");

        //verify
        verify(appUserRepository).findAppUserStatusByPhone(phoneNumber);

    }

    @Test
    void getUserStatus_ShouldReturnNull_WhenUserDoesNotExists() {

        when(meterRegistry.counter(anyString())).thenReturn(counter);
        //arrange
        when(appUserRepository.findAppUserStatusByPhone(phoneNumber)).thenReturn(Optional.empty());

        //act
        AppUserStatusFinderResponse response = phoneAuthenticationService.getUserStatus(phoneNumber);

        //assert
        assertNotNull(response, "status should be returned upon calling this method");
        assertNull(response.appUserStatus(), "should return null for user that does not exists");

        //verify
        verify(appUserRepository).findAppUserStatusByPhone(phoneNumber);

    }


    //Use ArgumentCaptor ONLY when ALL 3 are true
    //
    //A method receives an object
    //
    //Your code mutates/builds that object
    //
    //You must verify what’s inside that object

    @Test
    void signUpUser_ShouldReturnStatusACTIVE_AndSaveUser_WhenCalled() {

        when(meterRegistry.counter(anyString())).thenReturn(counter);
        //arrange
        String password = "encoded@Password123";
        AppUserSignUpRequest request = new AppUserSignUpRequest(phoneNumber, PHONE, password);

        AppUser appUser = new AppUser();
        appUser.setPhone(request.identifier());
        appUser.setPassword(request.password());
        appUser.setAppUserStatus(ACTIVE);

        when(passwordEncoder.encode(request.password())).thenReturn("encodedPassword");
        when(appUserRepository.findAppUserStatusByPhone(request.identifier())).thenReturn(Optional.of(ACTIVE));
        when(appUserRepository.save(any(AppUser.class))).thenReturn(appUser);

        //act
        AppUserStatusFinderResponse response = phoneAuthenticationService.signUpUser(request);

        //assert
        assertNotNull(response, "response should not be null");
        assertEquals(ACTIVE, response.appUserStatus(), "user status should be ACTIVE");

        //verify
        verify(passwordEncoder).encode(request.password());

        // user ArgumentCaptor when the data/Object that is passed needs to be varified.
        // the object is created in the current method.
        // don't use when a method returns an expected result / dependencies need not be checked.
        ArgumentCaptor<AppUser> userArgumentCaptor = ArgumentCaptor.forClass(AppUser.class);
        verify(appUserRepository).save(userArgumentCaptor.capture());

        AppUser capturedUser = userArgumentCaptor.getValue();
        assertEquals(request.identifier(), capturedUser.getPhone(), "phone number should match");
        assertEquals("encodedPassword", capturedUser.getPassword(), "password should be encoded");
        assertEquals(ACTIVE, capturedUser.getAppUserStatus(), "Status should be created");

        verify(appUserRepository).findAppUserStatusByPhone(request.identifier());

        verify(auditEventLogger).log("auth.signup", null, null, null, "success", "identifier_type=PHONE", null);
        verify(auditEventLogger, never()).log(eq("auth.signup"), isNull(), isNull(), isNull(), eq("failure"), anyString(), isNull());

    }

    @Test
    void completeSignUp_shouldSetEmailVerifiedTrue_andAssignDefaultUSER_whenCalledWithValidPhoneNumber() {

        when(meterRegistry.counter(anyString())).thenReturn(counter);
        //arrange
        AppUser appUser = new AppUser();
        appUser.setPhone(phoneNumber);
        appUser.setAppUserStatus(ACTIVE);

        when(appUserRepository.findByPhone(phoneNumber)).thenReturn(Optional.of(appUser));
        when(appUserRepository.findAppUserStatusByPhone(phoneNumber)).thenReturn(Optional.of(ACTIVE));

        //act
        AppUserStatusFinderResponse response = phoneAuthenticationService.completeSignUp(phoneNumber);

        //assert
        assertEquals(ACTIVE, response.appUserStatus(), "method should return status ACTIVE for valid input (i.e. valid phone number, user exists and user status is ACTIVE");

        //verify
        verify(authCommonServices).updateUserStatus(appUser.getAppUserStatus(), appUser);
        verify(authCommonServices).assignDefaultRole(appUser);
        verify(appUserRepository).save(appUser);
        verify(appUserRepository).findAppUserStatusByPhone(phoneNumber);

        verify(auditEventLogger).log("auth.signup.complete", appUser.getId(), null, null, "success", "identifier_type=PHONE", null);
    }

    @Test
    void completeSignUp_returnUSER_NOT_FOUND_whenCalledWithInvalidPhoneNumber() {

        when(meterRegistry.counter(anyString())).thenReturn(counter);
        //arrange
        when(appUserRepository.findByPhone(phoneNumber)).thenReturn(Optional.empty());

        assertThrows(
                BusinessException.class,
                () -> phoneAuthenticationService.completeSignUp(phoneNumber)
        );

        //verify
        verify(appUserRepository, never()).save(any());
        verify(authCommonServices, never()).assignDefaultRole(any());

        verify(auditEventLogger).log(eq("auth.signup.complete"), isNull(), isNull(), isNull(), eq("failure"), anyString(), isNull());
    }
}
