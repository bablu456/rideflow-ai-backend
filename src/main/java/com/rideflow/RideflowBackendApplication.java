package com.rideflow;

import com.rideflow.entity.Driver;
import com.rideflow.entity.User;
import com.rideflow.repository.DriverRepository;
import com.rideflow.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.Collections;
import java.util.TimeZone;

@SpringBootApplication
public class RideflowBackendApplication {

	public static void main(String[] args) {

        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));

		SpringApplication.run(RideflowBackendApplication.class, args);
	}

    @Bean
    public CommandLineRunner demoData(UserRepository userRepository, DriverRepository driverRepository){
        return  args -> {

            if(userRepository.count() == 0) {
                User rider = new User();
                rider.setName("Rahul Rider");
                rider.setEmail("rahul@gmail.com");
                rider.setPassword("password");
                rider.setPhone("8809537315");
                rider.setRoles(Collections.singleton("RIDER"));

                User savedRider = userRepository.save(rider);

                User driveUser = new User();
                driveUser.setName("Sandeep Driver");
                driveUser.setEmail("sandeep@gmail.com");
                driveUser.setPassword("password");
                driveUser.setRoles(Collections.singleton("DRIVER"));
                driveUser.setPhone("12345678910");

                User savedDriverUser = userRepository.save(driveUser);

                Driver driver = new Driver();
                driver.setUser(savedDriverUser);
                driver.setRating(4.8);
                driver.setLicenseNumber("MH12-AB-1234");
                driver.setAvailable(true);
                driver.setVehicleType("Car");

                driverRepository.save(driver);

                System.out.println(" Dummy Data Added: Rider ID= " + savedRider.getId() + ", Driver Available=True");

            }
        };
    }
}
