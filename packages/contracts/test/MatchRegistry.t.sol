// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/SoulProfile.sol";
import "../src/MatchRegistry.sol";

contract MatchRegistryTest is Test {
    SoulProfile public soulProfile;
    MatchRegistry public registry;
    address user1 = makeAddr("user1");
    address user2 = makeAddr("user2");
    address treasury = makeAddr("treasury");
    address matchPool = makeAddr("matchPool");
    address ecosystemFund = makeAddr("ecosystemFund");
    address relayer = makeAddr("relayer");

    function setUp() public {
        soulProfile = new SoulProfile();
        registry = new MatchRegistry(address(soulProfile), treasury, matchPool, ecosystemFund);
        soulProfile.setMatchRegistry(address(registry));

        // Create profiles
        vm.prank(user1);
        soulProfile.createProfile("QmUser1CID12345", "@user1", "", "");
        vm.prank(user2);
        soulProfile.createProfile("QmUser2CID12345", "@user2", "", "");
    }

    function test_CreateMatch() public {
        uint256 fee = registry.calculateFee(user1, user2);
        vm.deal(relayer, 1 ether);

        vm.prank(relayer);
        registry.createMatch{value: fee}(user1, user2, "QmConversationLog1");

        MatchRegistry.Match memory m = registry.getMatch(0);
        assertEq(m.user1, user1);
        assertEq(m.user2, user2);
        assertEq(m.conversationCID, "QmConversationLog1");
        assertTrue(m.status == MatchRegistry.MatchStatus.Pending);
        assertFalse(m.user1Approved);
        assertFalse(m.user2Approved);
    }

    function test_DualApproval() public {
        uint256 fee = registry.calculateFee(user1, user2);
        vm.deal(relayer, 1 ether);

        vm.prank(relayer);
        registry.createMatch{value: fee}(user1, user2, "QmConvCID");

        // User1 approves
        vm.prank(user1);
        registry.approveMatch(0);

        MatchRegistry.Match memory m1 = registry.getMatch(0);
        assertTrue(m1.user1Approved);
        assertFalse(m1.user2Approved);
        assertTrue(m1.status == MatchRegistry.MatchStatus.Pending);

        // User2 approves → match confirmed
        vm.prank(user2);
        registry.approveMatch(0);

        MatchRegistry.Match memory m2 = registry.getMatch(0);
        assertTrue(m2.user1Approved);
        assertTrue(m2.user2Approved);
        assertTrue(m2.status == MatchRegistry.MatchStatus.Approved);

        // Match counts incremented
        assertEq(soulProfile.getProfile(user1).matchCount, 1);
        assertEq(soulProfile.getProfile(user2).matchCount, 1);
    }

    function test_FeeDistribution_70_20_10() public {
        uint256 fee = registry.calculateFee(user1, user2);
        vm.deal(relayer, 1 ether);

        vm.prank(relayer);
        registry.createMatch{value: fee}(user1, user2, "QmConvCID");

        uint256 treasuryBefore = treasury.balance;
        uint256 matchPoolBefore = matchPool.balance;
        uint256 ecosystemBefore = ecosystemFund.balance;

        vm.prank(user1);
        registry.approveMatch(0);
        vm.prank(user2);
        registry.approveMatch(0);

        uint256 expectedTreasury = (fee * 70) / 100;
        uint256 expectedMatchPool = (fee * 20) / 100;
        uint256 expectedEcosystem = fee - expectedTreasury - expectedMatchPool;

        assertEq(treasury.balance - treasuryBefore, expectedTreasury, "Treasury should get 70%");
        assertEq(matchPool.balance - matchPoolBefore, expectedMatchPool, "Match pool should get 20%");
        assertEq(ecosystemFund.balance - ecosystemBefore, expectedEcosystem, "Ecosystem fund should get 10%");
    }

    function test_RejectAndRefund() public {
        uint256 fee = registry.calculateFee(user1, user2);
        vm.deal(relayer, 1 ether);

        vm.prank(relayer);
        registry.createMatch{value: fee}(user1, user2, "QmConvCID");

        uint256 user1Before = user1.balance;

        vm.prank(user2);
        registry.rejectMatch(0);

        MatchRegistry.Match memory m = registry.getMatch(0);
        assertTrue(m.status == MatchRegistry.MatchStatus.Rejected);

        // Fee refunded to user1
        assertEq(user1.balance - user1Before, fee);
    }

    function test_CannotSelfMatch() public {
        vm.deal(relayer, 1 ether);
        vm.prank(relayer);
        vm.expectRevert("Cannot self-match");
        registry.createMatch{value: 0.01 ether}(user1, user1, "QmSelfMatch");
    }

    function test_CannotApproveNonParticipant() public {
        uint256 fee = registry.calculateFee(user1, user2);
        vm.deal(relayer, 1 ether);

        vm.prank(relayer);
        registry.createMatch{value: fee}(user1, user2, "QmConvCID");

        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        vm.expectRevert("Not participant");
        registry.approveMatch(0);
    }

    function test_CalculateFee_NewUsers() public view {
        // Both users have 0 matches → 0.5x multiplier
        uint256 fee = registry.calculateFee(user1, user2);
        assertEq(fee, 0.005 ether); // 0.01 * 0.5 = 0.005
    }

    function test_InsufficientFee() public {
        vm.deal(relayer, 1 ether);
        vm.prank(relayer);
        vm.expectRevert("Insufficient fee");
        registry.createMatch{value: 0.001 ether}(user1, user2, "QmConvCID");
    }

    function test_UserMatches() public {
        uint256 fee = registry.calculateFee(user1, user2);
        vm.deal(relayer, 1 ether);

        vm.prank(relayer);
        registry.createMatch{value: fee}(user1, user2, "QmConvCID");

        uint256[] memory u1matches = registry.getUserMatches(user1);
        assertEq(u1matches.length, 1);
        assertEq(u1matches[0], 0);
    }

    function test_AdminFunctions() public {
        registry.setBaseFee(0.02 ether);
        assertEq(registry.baseFee(), 0.02 ether);

        address newTreasury = makeAddr("newTreasury");
        registry.setTreasury(newTreasury);
        assertEq(registry.treasury(), newTreasury);

        address newMatchPool = makeAddr("newMatchPool");
        registry.setMatchPool(newMatchPool);
        assertEq(registry.matchPool(), newMatchPool);

        address newEcosystem = makeAddr("newEcosystem");
        registry.setEcosystemFund(newEcosystem);
        assertEq(registry.ecosystemFund(), newEcosystem);
    }

    function test_SetDateDetails() public {
        uint256 fee = registry.calculateFee(user1, user2);
        vm.deal(relayer, 1 ether);

        vm.prank(relayer);
        registry.createMatch{value: fee}(user1, user2, "QmConvCID");

        // Both approve first
        vm.prank(user1);
        registry.approveMatch(0);
        vm.prank(user2);
        registry.approveMatch(0);

        // User1 sets date details
        uint256 dateTime = block.timestamp + 7 days;
        vm.prank(user1);
        registry.setDateDetails(0, dateTime, "Istanbul, Kadikoy");

        MatchRegistry.Match memory m = registry.getMatch(0);
        assertEq(m.dateTimestamp, dateTime);
        assertEq(m.dateLocation, "Istanbul, Kadikoy");
    }

    function test_SetDateDetails_NotApproved() public {
        uint256 fee = registry.calculateFee(user1, user2);
        vm.deal(relayer, 1 ether);

        vm.prank(relayer);
        registry.createMatch{value: fee}(user1, user2, "QmConvCID");

        // Try to set date details on a pending match
        vm.prank(user1);
        vm.expectRevert("Not approved");
        registry.setDateDetails(0, block.timestamp + 1 days, "Somewhere");
    }

    function test_SetDateDetails_NotParticipant() public {
        uint256 fee = registry.calculateFee(user1, user2);
        vm.deal(relayer, 1 ether);

        vm.prank(relayer);
        registry.createMatch{value: fee}(user1, user2, "QmConvCID");

        vm.prank(user1);
        registry.approveMatch(0);
        vm.prank(user2);
        registry.approveMatch(0);

        // Stranger tries to set date
        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        vm.expectRevert("Not participant");
        registry.setDateDetails(0, block.timestamp + 1 days, "Somewhere");
    }

    function test_SuccessRateUpdatedOnApproval() public {
        uint256 fee = registry.calculateFee(user1, user2);
        vm.deal(relayer, 1 ether);

        vm.prank(relayer);
        registry.createMatch{value: fee}(user1, user2, "QmConvCID");

        vm.prank(user1);
        registry.approveMatch(0);
        vm.prank(user2);
        registry.approveMatch(0);

        // After 1 conversation and 1 match, successRate should be 100
        SoulProfile.Profile memory p1 = soulProfile.getProfile(user1);
        assertEq(p1.successRate, 100);
        SoulProfile.Profile memory p2 = soulProfile.getProfile(user2);
        assertEq(p2.successRate, 100);
    }
}
