package org.miniProjectTwo.DragonOfNorth.enums;

import org.miniProjectTwo.DragonOfNorth.dto.auth.response.AppUserStatusFinderResponse;
import org.miniProjectTwo.DragonOfNorth.serviceInterfaces.AuthenticationService;

/**
 * User account lifecycle states controlling authentication and authorization flows.
 * Status transitions drive verification requirements and access permissions. CREATED
 * requires OTP verification, VERIFIED enables full authentication, DELETED blocks
 * all access. Critical for security and user journey management.
 *
 * @see AuthenticationService for status-based routing
 * @see AppUserStatusFinderResponse for status reporting
 */
public enum AppUserStatus {
    ACTIVE,
    LOCKED,
    DELETED
}
