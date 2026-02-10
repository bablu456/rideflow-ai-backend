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

import java.util.Set;
import java.util.TimeZone;

@SpringBootApplication
public class RideflowBackendApplication {

    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(RideflowBackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner demoData(UserRepository userRepository, DriverRepository driverRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() == 0) {
                // Create a rider user
                User rider = new User();
                rider.setName("Rahul Rider");
                rider.setEmail("rahul@gmail.com");
                rider.setPassword(passwordEncoder.encode("password"));
                rider.setPhone("8809537315");
                rider.setRoles(Set.of("RIDER"));
                userRepository.save(rider);

                // Create a test user
                User testUser = User.builder()
                        .name("Test User")
                        .email("test@flow.com")
                        .password(passwordEncoder.encode("bablu123"))
                        .roles(Set.of("RIDER"))
                        .build();
                userRepository.save(testUser);
            }

            if (driverRepository.count() == 0) {
                User driverUser = userRepository.findByEmail("sandeep@gmail.com")
                        .orElseGet(() -> {
                            User newDriverUser = new User();
                            newDriverUser.setName("Sandeep Driver");
                            newDriverUser.setEmail("sandeep@gmail.com");
                            newDriverUser.setPassword(passwordEncoder.encode("password"));
                            newDriverUser.setPhone("12345678910");
                            newDriverUser.setRoles(Set.of("DRIVER"));
                            return userRepository.save(newDriverUser);
                        });

                // Create a driver profile linked to the driver user
                Driver driver = new Driver();
                driver.setUser(driverUser);
                driver.setIsAvailable(true);
                driver.setRating(4.8);
                driver.setLicenseNumber("MH12-AB-1234");
                driver.setVehicleType("Car");
                driver.setVehiclePlateNumber("MH-12-AB-1234");
                driver.setCurrentLatitude(12.97);
                driver.setCurrentLongitude(77.59);
                driverRepository.save(driver);
            }

            System.out.println("\n--- DATABASE SEEDED SUCCESSFULLY ---");
            userRepository.findAll().forEach(user -> {
                System.out.println("User: " + user.getEmail() + " | Roles: " + user.getRoles());
            });
            System.out.println("------------------------------------\n");
        };
    }
}
