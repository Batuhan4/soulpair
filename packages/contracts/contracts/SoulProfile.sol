// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SoulProfile
 * @notice On-chain dating profile for Soulpair protocol
 * @dev Stores minimal data on-chain, full profile on IPFS
 */
contract SoulProfile is Ownable, Pausable {

    struct Profile {
        string flirtMdCID;          // IPFS CID of flirt.md
        string twitterHandle;
        string instagramHandle;
        string linkedinHandle;
        uint256 matchCount;
        uint256 totalConversations;
        uint256 createdAt;
        bool isActive;
    }

    // wallet address => Profile
    mapping(address => Profile) public profiles;

    // track all registered addresses
    address[] public registeredUsers;
    mapping(address => bool) public isRegistered;

    // stats
    uint256 public totalProfiles;

    // Events
    event ProfileCreated(address indexed user, string flirtMdCID, uint256 timestamp);
    event ProfileUpdated(address indexed user, string flirtMdCID, uint256 timestamp);
    event ProfileDeactivated(address indexed user, uint256 timestamp);
    event ProfileReactivated(address indexed user, uint256 timestamp);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create a new soul profile
     * @param _flirtMdCID IPFS CID of the flirt.md file
     */
    function createProfile(
        string calldata _flirtMdCID,
        string calldata _twitterHandle,
        string calldata _instagramHandle,
        string calldata _linkedinHandle
    ) external whenNotPaused {
        require(!isRegistered[msg.sender], "Profile already exists");
        require(bytes(_flirtMdCID).length > 0, "flirtMdCID required");

        profiles[msg.sender] = Profile({
            flirtMdCID: _flirtMdCID,
            twitterHandle: _twitterHandle,
            instagramHandle: _instagramHandle,
            linkedinHandle: _linkedinHandle,
            matchCount: 0,
            totalConversations: 0,
            createdAt: block.timestamp,
            isActive: true
        });

        isRegistered[msg.sender] = true;
        registeredUsers.push(msg.sender);
        totalProfiles++;

        emit ProfileCreated(msg.sender, _flirtMdCID, block.timestamp);
    }

    /**
     * @notice Update profile's flirt.md CID
     */
    function updateFlirtMd(string calldata _flirtMdCID) external whenNotPaused {
        require(isRegistered[msg.sender], "Profile does not exist");
        require(bytes(_flirtMdCID).length > 0, "flirtMdCID required");

        profiles[msg.sender].flirtMdCID = _flirtMdCID;

        emit ProfileUpdated(msg.sender, _flirtMdCID, block.timestamp);
    }

    /**
     * @notice Toggle profile active status
     */
    function setActive(bool _isActive) external {
        require(isRegistered[msg.sender], "Profile does not exist");

        profiles[msg.sender].isActive = _isActive;

        if (_isActive) {
            emit ProfileReactivated(msg.sender, block.timestamp);
        } else {
            emit ProfileDeactivated(msg.sender, block.timestamp);
        }
    }

    /**
     * @notice Increment conversation count (called by MatchRegistry)
     */
    function incrementConversations(address _user) external onlyOwner {
        require(isRegistered[_user], "Profile does not exist");
        profiles[_user].totalConversations++;
    }

    /**
     * @notice Increment match count (called by MatchRegistry)
     */
    function incrementMatches(address _user) external onlyOwner {
        require(isRegistered[_user], "Profile does not exist");
        profiles[_user].matchCount++;
    }

    // ===== View Functions =====

    function getProfile(address _user) external view returns (Profile memory) {
        require(isRegistered[_user], "Profile does not exist");
        return profiles[_user];
    }

    function getSuccessRate(address _user) external view returns (uint256) {
        Profile memory p = profiles[_user];
        if (p.totalConversations == 0) return 0;
        return (p.matchCount * 100) / p.totalConversations;
    }

    function getTotalProfiles() external view returns (uint256) {
        return totalProfiles;
    }

    function getRegisteredUsers(uint256 _offset, uint256 _limit)
        external
        view
        returns (address[] memory)
    {
        uint256 end = _offset + _limit;
        if (end > registeredUsers.length) {
            end = registeredUsers.length;
        }
        uint256 length = end - _offset;
        address[] memory users = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            users[i] = registeredUsers[_offset + i];
        }
        return users;
    }

    // ===== Admin =====

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
