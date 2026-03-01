package org.miniProjectTwo.DragonOfNorth.repositories;

import org.miniProjectTwo.DragonOfNorth.enums.Provider;
import org.miniProjectTwo.DragonOfNorth.model.UserAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserAuthProviderRepository extends JpaRepository<UserAuthProvider, UUID> {
    Optional<UserAuthProvider> findByProviderAndProviderId(Provider provider, String providerId);

    boolean existsByUserIdAndProvider(UUID userId, Provider provider);

    List<UserAuthProvider> findAllByUserId(UUID userId);
}
