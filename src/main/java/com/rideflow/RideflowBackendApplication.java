package com.rideflow;

import com.rideflow.entity.Driver;
import com.rideflow.entity.User;
import com.rideflow.repository.DriverRepository;
import com.rideflow.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.TimeZone;

@SpringBootApplication
public class RideflowBackendApplication {

	public static void main(String[] args) {

        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));

		SpringApplication.run(RideflowBackendApplication.class, args);
	}

    @Bean
    public CommandLineRunner demoData(UserRepository userRepository, DriverRepository driverRepository, PasswordEncoder passwordEncoder){
        return  args -> {

           if(userRepository.count() == 0){
               User rider = new User();
               rider.setName("Rahul Rider");
               rider.setEmail("rahul@gmail.com");

               rider.setPassword(passwordEncoder.encode("password"));
               rider.setPhone("8809537315");
               User savedRider = userRepository.save(rider);

               User driverUser = new User();
               driverUser.setName("Sandeep Driver");
               driverUser.setEmail("sandeep@gmail.com");
               driverUser.setPassword(passwordEncoder.encode("password"));
               driverUser.setPhone("12345678910");
               driverUser.setRoles(Collections.singleton("DRIVER"));

               User saveDriver = userRepository.save(driverUser);

               Driver driver = new Driver();
               driver.setUser(saveDriver);
               driver.setAvailable(true);
               driver.setRating(4.8);
               driver.setLicenseNumber("MH12-AB-1234");
               driver.setVehicleType("Car");

            }
        };
    }
}
