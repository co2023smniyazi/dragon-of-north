package org.miniProjectTwo.DragonOfNorth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@EnableAsync
@SpringBootApplication
@EnableScheduling
public class DragonOfNorthApplication {

    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
        SpringApplication.run(DragonOfNorthApplication.class, args);
    }

}
//todo bug if user is signed up but email not verified and tries to sign in then it should show email not verified instead of invalid credentials
// fixes 1. add a field in user entity to check if email is verified or not
// 2. in the authentication process check if email is verified or not and return appropriate message
// basically if user is not verified then return email not verified message instead of invalid credentials message and link to sign up page or redirect to sign up page
//check if user exists in db for forgot password