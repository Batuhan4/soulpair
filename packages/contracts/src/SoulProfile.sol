// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title SoulProfile
 * @notice On-chain dating profile registry for Soulpair protocol
 * @dev Stores profile metadata CIDs (flirt.md on IPFS), social handles, and match stats
 */
contract SoulProfile {
    struct Profile {
        string flirtMdCID;        // IPFS CID of flirt.md
        string twitterHandle;
        string instagramHandle;
        string linkedinHandle;
        uint256 matchCount;
        uint256 totalConversations;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }

    mapping(address => Profile) public profiles;
    address[] public profileList;
    address public owner;
    address public matchRegistry;

    event ProfileCreated(address indexed user, string flirtMdCID);
    event ProfileUpdated(address indexed user, string flirtMdCID);
    event ProfilePaused(address indexed user);
    event ProfileResumed(address indexed user);
    event MatchRegistrySet(address indexed registry);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyMatchRegistry() {
        require(msg.sender == matchRegistry, "Not match registry");
        _;
    }

    modifier onlyProfileOwner() {
        require(profiles[msg.sender].createdAt > 0, "No profile");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setMatchRegistry(address _registry) external onlyOwner {
        matchRegistry = _registry;
        emit MatchRegistrySet(_registry);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }

    function createProfile(
        string calldata _flirtMdCID,
        string calldata _twitter,
        string calldata _instagram,
        string calldata _linkedin
    ) external {
        require(profiles[msg.sender].createdAt == 0, "Profile exists");
        require(bytes(_flirtMdCID).length > 0, "Empty CID");

        profiles[msg.sender] = Profile({
            flirtMdCID: _flirtMdCID,
            twitterHandle: _twitter,
            instagramHandle: _instagram,
            linkedinHandle: _linkedin,
            matchCount: 0,
            totalConversations: 0,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        profileList.push(msg.sender);
        emit ProfileCreated(msg.sender, _flirtMdCID);
    }

    function updateProfile(
        string calldata _flirtMdCID,
        string calldata _twitter,
        string calldata _instagram,
        string calldata _linkedin
    ) external onlyProfileOwner {
        Profile storage p = profiles[msg.sender];
        if (bytes(_flirtMdCID).length > 0) p.flirtMdCID = _flirtMdCID;
        p.twitterHandle = _twitter;
        p.instagramHandle = _instagram;
        p.linkedinHandle = _linkedin;
        p.updatedAt = block.timestamp;

        emit ProfileUpdated(msg.sender, p.flirtMdCID);
    }

    function pauseProfile() external onlyProfileOwner {
        profiles[msg.sender].isActive = false;
        emit ProfilePaused(msg.sender);
    }

    function resumeProfile() external onlyProfileOwner {
        profiles[msg.sender].isActive = true;
        emit ProfileResumed(msg.sender);
    }

    function incrementMatchCount(address user) external onlyMatchRegistry {
        profiles[user].matchCount++;
    }

    function incrementConversationCount(address user) external onlyMatchRegistry {
        profiles[user].totalConversations++;
    }

    function getProfile(address user) external view returns (Profile memory) {
        return profiles[user];
    }

    function profileExists(address user) external view returns (bool) {
        return profiles[user].createdAt > 0;
    }

    function getProfileCount() external view returns (uint256) {
        return profileList.length;
    }
}
