package org.miniProjectTwo.DragonOfNorth.modules.auth.model;

import org.junit.jupiter.api.Test;
import org.miniProjectTwo.DragonOfNorth.modules.user.model.AppUser;
import org.miniProjectTwo.DragonOfNorth.shared.enums.Provider;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class UserAuthProviderTest {

    @Test
    void settersAndGetters_shouldWork() {
        UserAuthProvider uap = new UserAuthProvider();

        UUID id = UUID.randomUUID();
        AppUser user = new AppUser();
        user.setId(id);

        uap.setId(id);
        uap.setUser(user);
        uap.setProvider(Provider.LOCAL);
        uap.setProviderId("local-provider-id");

        assertEquals(id, uap.getId());
        assertEquals(user, uap.getUser());
        assertEquals(Provider.LOCAL, uap.getProvider());
        assertEquals("local-provider-id", uap.getProviderId());
    }

    @Test
    void defaultConstructor_shouldCreateInstance() {
        UserAuthProvider uap = new UserAuthProvider();
        assertNotNull(uap);
        assertNull(uap.getId());
        assertNull(uap.getProvider());
        assertNull(uap.getProviderId());
    }

    @Test
    void setProvider_shouldAcceptGoogleProvider() {
        UserAuthProvider uap = new UserAuthProvider();
        uap.setProvider(Provider.GOOGLE);
        assertEquals(Provider.GOOGLE, uap.getProvider());
    }
}
