package org.miniProjectTwo.DragonOfNorth.modules.profile.service;

import lombok.RequiredArgsConstructor;
import org.miniProjectTwo.DragonOfNorth.modules.profile.model.Profile;
import org.miniProjectTwo.DragonOfNorth.modules.profile.repo.ProfileRepository;
import org.miniProjectTwo.DragonOfNorth.modules.user.model.AppUser;
import org.miniProjectTwo.DragonOfNorth.shared.dto.oauth.OAuthUserInfo;
import org.miniProjectTwo.DragonOfNorth.shared.enums.ErrorCode;
import org.miniProjectTwo.DragonOfNorth.shared.exception.BusinessException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;

    public void createProfile(AppUser appUser, OAuthUserInfo userInfo) {
        if (profileRepository.findProfileByAppUser(appUser)) {
            throw new BusinessException(ErrorCode.PROFILE_ALREADY_EXISTS, "Profile already exists for user: " + appUser.getEmail());
        }
        Profile profile = new Profile();
        profile.setAppUser(appUser);
        if (userInfo != null) {
            profile.setDisplayName(userInfo.name());
            profile.setAvatarUrl(userInfo.picture());
            profile.setUsername(generateUniqueUsername(userInfo.name()));
        } else {
            profile.setDisplayName(appUser.getEmail());
            profile.setUsername(generateUniqueUsername(appUser.getEmail()));
        }
        profileRepository.save(profile);
    }

    private String generateUniqueUsername(String name) {
        String base = name.toLowerCase()
                .replaceAll("[^a-z0-9]", "")
                .trim();

        if (base.isBlank()) base = "user";

        String username;
        int attempts = 0;

        do {
            int rand = (int) (Math.random() * 10000);
            username = base + "_" + rand;
            attempts++;
        } while (usernameExists(username) && attempts < 5);

        if (usernameExists(username)) {
            username = base + "_" + System.currentTimeMillis();
        }

        return username;
    }

    private boolean usernameExists(String uniqueUsername) {
        return profileRepository.existsByUsernameIgnoreCase(uniqueUsername);
    }
}
