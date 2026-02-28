// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SoulProfile.sol";

/**
 * @title MatchRegistry
 * @notice Records matches and collects fees for Soulpair protocol
 */
contract MatchRegistry is Ownable, Pausable, ReentrancyGuard {

    struct MatchRecord {
        address user1;
        address user2;
        string conversationCID;     // IPFS CID of conversation log
        uint256 user1Fee;
        uint256 user2Fee;
        uint256 matchedAt;
        bool user1Approved;
        bool user2Approved;
        bool isFinalized;
    }

    SoulProfile public soulProfile;

    // Match ID => MatchRecord
    mapping(uint256 => MatchRecord) public matches;
    uint256 public matchCount;

    // User => match IDs
    mapping(address => uint256[]) public userMatches;

    // Fee config
    uint256 public baseFee = 0.01 ether; // 0.01 MON

    // Fee tiers: matchCount thresholds
    uint256 public constant TIER_NEW = 5;
    uint256 public constant TIER_ACTIVE = 20;
    uint256 public constant TIER_POPULAR = 50;

    // Multipliers (basis points: 10000 = 1.0x)
    uint256 public constant MULT_NEW = 5000;      // 0.5x
    uint256 public constant MULT_ACTIVE = 10000;   // 1.0x
    uint256 public constant MULT_POPULAR = 8000;   // 0.8x
    uint256 public constant MULT_STAR = 5000;      // 0.5x

    // Treasury
    address public treasury;
    uint256 public totalFeesCollected;

    // Events
    event MatchCreated(uint256 indexed matchId, address indexed user1, address indexed user2, string conversationCID);
    event MatchApproved(uint256 indexed matchId, address indexed user, bool approved);
    event MatchFinalized(uint256 indexed matchId, uint256 totalFee);
    event MatchRejected(uint256 indexed matchId, address indexed rejectedBy);
    event BaseFeeUpdated(uint256 oldFee, uint256 newFee);

    constructor(address _soulProfile, address _treasury) Ownable(msg.sender) {
        soulProfile = SoulProfile(_soulProfile);
        treasury = _treasury;
    }

    /**
     * @notice Create a match record (called by backend after agents agree)
     */
    function createMatch(
        address _user1,
        address _user2,
        string calldata _conversationCID
    ) external onlyOwner whenNotPaused returns (uint256) {
        require(_user1 != _user2, "Cannot match with self");
        require(soulProfile.isRegistered(_user1), "User1 not registered");
        require(soulProfile.isRegistered(_user2), "User2 not registered");

        uint256 matchId = matchCount++;

        matches[matchId] = MatchRecord({
            user1: _user1,
            user2: _user2,
            conversationCID: _conversationCID,
            user1Fee: calculateFee(_user1),
            user2Fee: calculateFee(_user2),
            matchedAt: block.timestamp,
            user1Approved: false,
            user2Approved: false,
            isFinalized: false
        });

        userMatches[_user1].push(matchId);
        userMatches[_user2].push(matchId);

        // Increment conversation counts
        soulProfile.incrementConversations(_user1);
        soulProfile.incrementConversations(_user2);

        emit MatchCreated(matchId, _user1, _user2, _conversationCID);
        return matchId;
    }

    /**
     * @notice Approve a match and pay fee
     */
    function approveMatch(uint256 _matchId) external payable whenNotPaused nonReentrant {
        MatchRecord storage m = matches[_matchId];
        require(!m.isFinalized, "Match already finalized");

        uint256 requiredFee;

        if (msg.sender == m.user1) {
            require(!m.user1Approved, "Already approved");
            requiredFee = m.user1Fee;
            require(msg.value >= requiredFee, "Insufficient fee");
            m.user1Approved = true;
        } else if (msg.sender == m.user2) {
            require(!m.user2Approved, "Already approved");
            requiredFee = m.user2Fee;
            require(msg.value >= requiredFee, "Insufficient fee");
            m.user2Approved = true;
        } else {
            revert("Not a participant");
        }

        emit MatchApproved(_matchId, msg.sender, true);

        // If both approved, finalize
        if (m.user1Approved && m.user2Approved) {
            m.isFinalized = true;
            uint256 totalFee = m.user1Fee + m.user2Fee;
            totalFeesCollected += totalFee;

            // Increment match counts
            soulProfile.incrementMatches(m.user1);
            soulProfile.incrementMatches(m.user2);

            // Transfer fees to treasury
            (bool sent, ) = treasury.call{value: totalFee}("");
            require(sent, "Fee transfer failed");

            emit MatchFinalized(_matchId, totalFee);
        }

        // Refund excess
        if (msg.value > requiredFee) {
            (bool refunded, ) = msg.sender.call{value: msg.value - requiredFee}("");
            require(refunded, "Refund failed");
        }
    }

    /**
     * @notice Reject a match
     */
    function rejectMatch(uint256 _matchId) external whenNotPaused {
        MatchRecord storage m = matches[_matchId];
        require(!m.isFinalized, "Match already finalized");
        require(
            msg.sender == m.user1 || msg.sender == m.user2,
            "Not a participant"
        );

        m.isFinalized = true;

        // Refund the other user if they already approved
        if (msg.sender == m.user1 && m.user2Approved) {
            (bool refunded, ) = m.user2.call{value: m.user2Fee}("");
            require(refunded, "Refund failed");
        } else if (msg.sender == m.user2 && m.user1Approved) {
            (bool refunded, ) = m.user1.call{value: m.user1Fee}("");
            require(refunded, "Refund failed");
        }

        emit MatchRejected(_matchId, msg.sender);
    }

    // ===== Fee Calculation =====

    function calculateFee(address _user) public view returns (uint256) {
        uint256 userMatchCount = soulProfile.getProfile(_user).matchCount;
        uint256 multiplier;

        if (userMatchCount < TIER_NEW) {
            multiplier = MULT_NEW;
        } else if (userMatchCount < TIER_ACTIVE) {
            multiplier = MULT_ACTIVE;
        } else if (userMatchCount < TIER_POPULAR) {
            multiplier = MULT_POPULAR;
        } else {
            multiplier = MULT_STAR;
        }

        return (baseFee * multiplier) / 10000;
    }

    // ===== View Functions =====

    function getMatch(uint256 _matchId) external view returns (MatchRecord memory) {
        return matches[_matchId];
    }

    function getUserMatches(address _user) external view returns (uint256[] memory) {
        return userMatches[_user];
    }

    function getUserMatchCount(address _user) external view returns (uint256) {
        return userMatches[_user].length;
    }

    // ===== Admin =====

    function setBaseFee(uint256 _newFee) external onlyOwner {
        uint256 oldFee = baseFee;
        baseFee = _newFee;
        emit BaseFeeUpdated(oldFee, _newFee);
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
