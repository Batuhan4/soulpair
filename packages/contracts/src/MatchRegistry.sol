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
    }

    SoulProfile public soulProfile;
    address public treasury;
    address public owner;

    uint256 public baseFee = 0.01 ether;       // 0.01 MON
    uint256 public treasuryFeePercent = 10;     // 10% to treasury
    uint256 public matchCount;

    mapping(uint256 => Match) public matches;
    mapping(address => uint256[]) public userMatches;

    event MatchCreated(uint256 indexed matchId, address indexed user1, address indexed user2, string conversationCID);
    event MatchApproved(uint256 indexed matchId, address indexed approver);
    event MatchConfirmed(uint256 indexed matchId, address user1, address user2);
    event MatchRejected(uint256 indexed matchId, address indexed rejector);
    event FeeCollected(uint256 indexed matchId, uint256 amount, uint256 treasuryAmount);
    event Refunded(uint256 indexed matchId, address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _soulProfile, address _treasury) {
        soulProfile = SoulProfile(_soulProfile);
        treasury = _treasury;
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
            feePaid: msg.value
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

            // Distribute fee
            uint256 treasuryAmount = (m.feePaid * treasuryFeePercent) / 100;
            if (treasuryAmount > 0) {
                (bool sent, ) = treasury.call{value: treasuryAmount}("");
                require(sent, "Treasury transfer failed");
            }

            emit MatchConfirmed(_matchId, m.user1, m.user2);
            emit FeeCollected(_matchId, m.feePaid, treasuryAmount);
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

    // Admin functions
    function setBaseFee(uint256 _fee) external onlyOwner {
        baseFee = _fee;
    }

    function setTreasuryFeePercent(uint256 _percent) external onlyOwner {
        require(_percent <= 100, "Invalid percent");
        treasuryFeePercent = _percent;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }
}
