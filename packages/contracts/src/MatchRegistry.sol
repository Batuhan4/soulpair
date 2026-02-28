// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./SoulProfile.sol";

/**
 * @title MatchRegistry
 * @notice Records matches, handles fees, and manages dual-approval flow
 */
contract MatchRegistry {
    enum MatchStatus { Pending, Approved, Rejected, Expired }

    struct Match {
        address user1;
        address user2;
        string conversationCID;    // IPFS CID of conversation log
        uint256 matchedAt;
        MatchStatus status;
        bool user1Approved;
        bool user2Approved;
        uint256 feePaid;
        uint256 dateTimestamp;
        string dateLocation;
    }

    SoulProfile public soulProfile;
    address public treasury;
    address public matchPool;
    address public ecosystemFund;
    address public owner;

    uint256 public baseFee = 0.01 ether;       // 0.01 MON
    uint256 public matchCount;

    mapping(uint256 => Match) public matches;
    mapping(address => uint256[]) public userMatches;

    event MatchCreated(uint256 indexed matchId, address indexed user1, address indexed user2, string conversationCID);
    event MatchApproved(uint256 indexed matchId, address indexed approver);
    event MatchConfirmed(uint256 indexed matchId, address user1, address user2);
    event MatchRejected(uint256 indexed matchId, address indexed rejector);
    event FeeCollected(uint256 indexed matchId, uint256 amount, uint256 treasuryAmount, uint256 matchPoolAmount, uint256 ecosystemAmount);
    event DateScheduled(uint256 indexed matchId, uint256 dateTimestamp, string dateLocation);
    event Refunded(uint256 indexed matchId, address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _soulProfile, address _treasury, address _matchPool, address _ecosystemFund) {
        soulProfile = SoulProfile(_soulProfile);
        treasury = _treasury;
        matchPool = _matchPool;
        ecosystemFund = _ecosystemFund;
        owner = msg.sender;
    }

    /**
     * @notice Create a match record after AI agents agree
     * @dev Called by backend/relayer with conversation proof
     */
    function createMatch(
        address _user1,
        address _user2,
        string calldata _conversationCID
    ) external payable {
        require(soulProfile.profileExists(_user1), "User1 no profile");
        require(soulProfile.profileExists(_user2), "User2 no profile");
        require(_user1 != _user2, "Cannot self-match");

        uint256 fee = calculateFee(_user1, _user2);
        require(msg.value >= fee, "Insufficient fee");

        uint256 matchId = matchCount++;

        matches[matchId] = Match({
            user1: _user1,
            user2: _user2,
            conversationCID: _conversationCID,
            matchedAt: block.timestamp,
            status: MatchStatus.Pending,
            user1Approved: false,
            user2Approved: false,
            feePaid: msg.value,
            dateTimestamp: 0,
            dateLocation: ""
        });

        userMatches[_user1].push(matchId);
        userMatches[_user2].push(matchId);

        // Increment conversation counts
        soulProfile.incrementConversationCount(_user1);
        soulProfile.incrementConversationCount(_user2);

        emit MatchCreated(matchId, _user1, _user2, _conversationCID);
    }

    /**
     * @notice Approve a pending match
     */
    function approveMatch(uint256 _matchId) external {
        Match storage m = matches[_matchId];
        require(m.matchedAt > 0, "Match not found");
        require(m.status == MatchStatus.Pending, "Not pending");
        require(msg.sender == m.user1 || msg.sender == m.user2, "Not participant");

        if (msg.sender == m.user1) {
            require(!m.user1Approved, "Already approved");
            m.user1Approved = true;
        } else {
            require(!m.user2Approved, "Already approved");
            m.user2Approved = true;
        }

        emit MatchApproved(_matchId, msg.sender);

        // Both approved → confirmed match
        if (m.user1Approved && m.user2Approved) {
            m.status = MatchStatus.Approved;

            soulProfile.incrementMatchCount(m.user1);
            soulProfile.incrementMatchCount(m.user2);
            soulProfile.updateSuccessRate(m.user1);
            soulProfile.updateSuccessRate(m.user2);

            // Distribute fee — 70% treasury, 20% match pool, 10% ecosystem
            uint256 treasuryAmount = (m.feePaid * 70) / 100;
            uint256 matchPoolAmount = (m.feePaid * 20) / 100;
            uint256 ecosystemAmount = m.feePaid - treasuryAmount - matchPoolAmount; // remainder to avoid rounding

            if (treasuryAmount > 0) {
                (bool sent1, ) = treasury.call{value: treasuryAmount}("");
                require(sent1, "Treasury transfer failed");
            }
            if (matchPoolAmount > 0) {
                (bool sent2, ) = matchPool.call{value: matchPoolAmount}("");
                require(sent2, "Match pool transfer failed");
            }
            if (ecosystemAmount > 0) {
                (bool sent3, ) = ecosystemFund.call{value: ecosystemAmount}("");
                require(sent3, "Ecosystem transfer failed");
            }

            emit MatchConfirmed(_matchId, m.user1, m.user2);
            emit FeeCollected(_matchId, m.feePaid, treasuryAmount, matchPoolAmount, ecosystemAmount);
        }
    }

    /**
     * @notice Reject a pending match — triggers refund
     */
    function rejectMatch(uint256 _matchId) external {
        Match storage m = matches[_matchId];
        require(m.matchedAt > 0, "Match not found");
        require(m.status == MatchStatus.Pending, "Not pending");
        require(msg.sender == m.user1 || msg.sender == m.user2, "Not participant");

        m.status = MatchStatus.Rejected;

        // Refund fee
        if (m.feePaid > 0) {
            // Refund to whoever paid (msg.sender of createMatch — we can't track, so refund to user1)
            (bool sent, ) = m.user1.call{value: m.feePaid}("");
            require(sent, "Refund failed");
            emit Refunded(_matchId, m.user1, m.feePaid);
        }

        emit MatchRejected(_matchId, msg.sender);
    }

    /**
     * @notice Calculate dynamic fee based on match counts
     */
    function calculateFee(address _user1, address _user2) public view returns (uint256) {
        SoulProfile.Profile memory p1 = soulProfile.getProfile(_user1);
        SoulProfile.Profile memory p2 = soulProfile.getProfile(_user2);

        uint256 avgMatches = (p1.matchCount + p2.matchCount) / 2;

        uint256 multiplier;
        if (avgMatches < 5) multiplier = 50;        // 0.5x — new users
        else if (avgMatches < 20) multiplier = 100;  // 1.0x — active
        else if (avgMatches < 50) multiplier = 80;   // 0.8x — popular
        else multiplier = 50;                        // 0.5x — stars

        return (baseFee * multiplier) / 100;
    }

    function getUserMatches(address user) external view returns (uint256[] memory) {
        return userMatches[user];
    }

    function getMatch(uint256 matchId) external view returns (Match memory) {
        return matches[matchId];
    }

    /**
     * @notice Set date details for an approved match
     */
    function setDateDetails(uint256 _matchId, uint256 _dateTimestamp, string calldata _dateLocation) external {
        Match storage m = matches[_matchId];
        require(m.status == MatchStatus.Approved, "Not approved");
        require(msg.sender == m.user1 || msg.sender == m.user2, "Not participant");
        m.dateTimestamp = _dateTimestamp;
        m.dateLocation = _dateLocation;
        emit DateScheduled(_matchId, _dateTimestamp, _dateLocation);
    }

    // Admin functions
    function setBaseFee(uint256 _fee) external onlyOwner {
        baseFee = _fee;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function setMatchPool(address _matchPool) external onlyOwner {
        matchPool = _matchPool;
    }

    function setEcosystemFund(address _ecosystemFund) external onlyOwner {
        ecosystemFund = _ecosystemFund;
    }
}
