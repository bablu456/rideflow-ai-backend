package com.rideflow.service;

import com.rideflow.dto.UserProfileDto;
import com.rideflow.dto.UserProfileUpdateRequest;
import com.rideflow.dto.WalletAddRequest;
import com.rideflow.dto.WalletAddResponse;

public interface UserService {

    UserProfileDto getCurrentUserProfile(String email);

    UserProfileDto updateCurrentUserProfile(String email, UserProfileUpdateRequest request);

    WalletAddResponse addMoneyToWallet(String email, WalletAddRequest request);
}
