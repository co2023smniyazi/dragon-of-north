package org.miniProjectTwo.DragonOfNorth.modules.profile.dto.response;

import org.miniProjectTwo.DragonOfNorth.shared.enums.Provider;

public record GetProfileResponse(
        String username,
        String displayName,
        String bio,
        String avatarUrl,
        Provider authProvider
) {
}
