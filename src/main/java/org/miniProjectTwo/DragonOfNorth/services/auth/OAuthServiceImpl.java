package org.miniProjectTwo.DragonOfNorth.services.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.miniProjectTwo.DragonOfNorth.dto.OAuth.OAuthUserInfo;
import org.miniProjectTwo.DragonOfNorth.enums.AppUserStatus;
import org.miniProjectTwo.DragonOfNorth.enums.ErrorCode;
import org.miniProjectTwo.DragonOfNorth.enums.Provider;
import org.miniProjectTwo.DragonOfNorth.enums.RoleName;
import org.miniProjectTwo.DragonOfNorth.exception.BusinessException;
import org.miniProjectTwo.DragonOfNorth.model.AppUser;
import org.miniProjectTwo.DragonOfNorth.model.Role;
import org.miniProjectTwo.DragonOfNorth.model.UserAuthProvider;
import org.miniProjectTwo.DragonOfNorth.repositories.AppUserRepository;
import org.miniProjectTwo.DragonOfNorth.repositories.RoleRepository;
import org.miniProjectTwo.DragonOfNorth.repositories.UserAuthProviderRepository;
import org.miniProjectTwo.DragonOfNorth.serviceInterfaces.JwtServices;
import org.miniProjectTwo.DragonOfNorth.serviceInterfaces.OAuthService;
import org.miniProjectTwo.DragonOfNorth.serviceInterfaces.SessionService;
import org.miniProjectTwo.DragonOfNorth.services.GoogleTokenVerifierService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class OAuthServiceImpl implements OAuthService {

    private final GoogleTokenVerifierService tokenVerifierService;
    private final JwtServices jwtServices;
    private final SessionService sessionService;
    private final AppUserRepository appUserRepository;
    private final UserAuthProviderRepository userAuthProviderRepository;
    private final RoleRepository roleRepository;
    private final AuthCommonServiceImpl authCommonServiceImpl;

    @Override
    @Transactional
    public void authenticatedWithGoogle(String idToken, String deviceId, HttpServletRequest httpRequest, HttpServletResponse response) {
        OAuthUserInfo userInfo = tokenVerifierService.verifyToken(idToken);

        String ipAddress = httpRequest.getHeader("X-Forwarded-For");
        String userAgent = httpRequest.getHeader("User-Agent");

        AppUser appUser = findOrCreateUser(userInfo);
        updateLoginInfo(appUser);

        String accessToken = jwtServices.generateAccessToken(appUser.getId(), appUser.getRoles());
        String refreshToken = jwtServices.generateRefreshToken(appUser.getId());

        authCommonServiceImpl.setAccessToken(response, accessToken);
        authCommonServiceImpl.setRefreshToken(response, refreshToken);

        sessionService.createSession(appUser, refreshToken, ipAddress, deviceId, userAgent);
    }

    private AppUser findOrCreateUser(OAuthUserInfo userInfo) {
        Optional<UserAuthProvider> existingByProviderId = userAuthProviderRepository.findByProviderAndProviderId(Provider.GOOGLE, userInfo.sub());
        if (existingByProviderId.isPresent()) {
            return existingByProviderId.get().getUser();
        }
        return createNewUserWithRetry(userInfo);
    }

    private void updateLoginInfo(AppUser user) {
        user.setLastLoginAt(LocalDateTime.now());
        user.setFailedLoginAttempts(0);
        user.setAccountLocked(false);
        // Dirty checking will save within transaction
    }

    private AppUser createNewUserWithRetry(OAuthUserInfo userInfo) {
        try {
            AppUser newUser = new AppUser();
            newUser.setEmail(userInfo.email());
            newUser.setEmailVerified(true);
            newUser.setPassword(null);
            newUser.setAppUserStatus(AppUserStatus.ACTIVE);
            newUser.setFailedLoginAttempts(0);
            newUser.setAccountLocked(false);

            // Assign default USER role
            Role userRole = roleRepository.findByRoleName(RoleName.USER)
                    .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND, "USER role not found"));
            newUser.setRoles(Set.of(userRole));

            AppUser savedUser = appUserRepository.save(newUser);
            linkGoogleProvider(savedUser, userInfo.sub());
            return savedUser;

        } catch (DataIntegrityViolationException e) {
            log.warn("Race condition during user creation, refetching: {}", userInfo.sub());

            Optional<UserAuthProvider> byProviderId = userAuthProviderRepository.findByProviderAndProviderId(Provider.GOOGLE, userInfo.sub());
            if (byProviderId.isPresent()) {
                return byProviderId.get().getUser();
            }

            AppUser existingUser = appUserRepository.findByEmailForUpdate(userInfo.email())
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_CREATION_FAILED, "Failed to create user"));
            existingUser.setEmailVerified(true);
            linkGoogleProvider(existingUser, userInfo.sub());
            return existingUser;
        }
    }

    private void linkGoogleProvider(AppUser appUser, String providerId) {
        if (userAuthProviderRepository.existsByUserIdAndProvider(appUser.getId(), Provider.GOOGLE)) {
            return;
        }
        UserAuthProvider provider = new UserAuthProvider();
        provider.setUser(appUser);
        provider.setProvider(Provider.GOOGLE);
        provider.setProviderId(providerId);
        userAuthProviderRepository.save(provider);
    }

}
