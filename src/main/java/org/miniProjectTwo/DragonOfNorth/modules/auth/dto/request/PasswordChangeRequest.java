package org.miniProjectTwo.DragonOfNorth.modules.auth.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PasswordChangeRequest(
        @NotBlank
        @JsonProperty("oldPassword")
        @JsonAlias({"old_password", "currentPassword", "current_password"})
        String oldPassword,
        @NotBlank
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
                message = "Password must be at least 8 characters with letters and numbers"
        )
        @JsonProperty("newPassword")
        @JsonAlias({"new_password"})
        String newPassword
) {
}
