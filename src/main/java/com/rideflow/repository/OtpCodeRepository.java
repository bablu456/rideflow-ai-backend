package com.rideflow.repository;

import com.rideflow.entity.OtpCode;
import com.rideflow.entity.OtpPurpose;
import com.rideflow.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {

    List<OtpCode> findByUserAndPurposeAndUsedAtIsNull(User user, OtpPurpose purpose);

    Optional<OtpCode> findTopByUserAndPurposeAndUsedAtIsNullOrderByCreatedAtDesc(User user, OtpPurpose purpose);
}
