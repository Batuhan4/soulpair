// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/SoulProfile.sol";

contract SoulProfileTest is Test {
    SoulProfile public profile;
    address user1 = makeAddr("user1");
    address user2 = makeAddr("user2");

    function setUp() public {
        profile = new SoulProfile();
    }

    function test_CreateProfile() public {
        vm.prank(user1);
        profile.createProfile("QmTestCID123456", "@alice", "@alice_ig", "alice-li");

        SoulProfile.Profile memory p = profile.getProfile(user1);
        assertEq(p.flirtMdCID, "QmTestCID123456");
        assertEq(p.twitterHandle, "@alice");
        assertTrue(p.isActive);
        assertEq(p.matchCount, 0);
        assertTrue(profile.profileExists(user1));
        assertEq(profile.getProfileCount(), 1);
    }

    function test_CannotCreateDuplicate() public {
        vm.startPrank(user1);
        profile.createProfile("QmCID1", "", "", "");
        vm.expectRevert("Profile exists");
        profile.createProfile("QmCID2", "", "", "");
        vm.stopPrank();
    }

    function test_CannotCreateEmptyCID() public {
        vm.prank(user1);
        vm.expectRevert("Empty CID");
        profile.createProfile("", "", "", "");
    }

    function test_UpdateProfile() public {
        vm.startPrank(user1);
        profile.createProfile("QmOldCID12345", "", "", "");
        profile.updateProfile("QmNewCID12345", "@newalice", "", "");
        vm.stopPrank();

        SoulProfile.Profile memory p = profile.getProfile(user1);
        assertEq(p.flirtMdCID, "QmNewCID12345");
        assertEq(p.twitterHandle, "@newalice");
    }

    function test_PauseResume() public {
        vm.startPrank(user1);
        profile.createProfile("QmTestPause1234", "", "", "");
        profile.pauseProfile();

        SoulProfile.Profile memory p1 = profile.getProfile(user1);
        assertFalse(p1.isActive);

        profile.resumeProfile();
        SoulProfile.Profile memory p2 = profile.getProfile(user1);
        assertTrue(p2.isActive);
        vm.stopPrank();
    }

    function test_SetMatchRegistry() public {
        address registry = makeAddr("registry");
        profile.setMatchRegistry(registry);
        assertEq(profile.matchRegistry(), registry);
    }

    function test_OnlyMatchRegistryCanIncrement() public {
        address registry = makeAddr("registry");
        profile.setMatchRegistry(registry);

        vm.prank(user1);
        profile.createProfile("QmTestIncrement", "", "", "");

        // Non-registry cannot increment
        vm.prank(user1);
        vm.expectRevert("Not match registry");
        profile.incrementMatchCount(user1);

        // Registry can increment
        vm.prank(registry);
        profile.incrementMatchCount(user1);

        SoulProfile.Profile memory p = profile.getProfile(user1);
        assertEq(p.matchCount, 1);
    }

    function test_TransferOwnership() public {
        address newOwner = makeAddr("newOwner");
        profile.transferOwnership(newOwner);
        assertEq(profile.owner(), newOwner);

        // Old owner can't act
        vm.expectRevert("Not owner");
        profile.setMatchRegistry(makeAddr("x"));
    }
}
