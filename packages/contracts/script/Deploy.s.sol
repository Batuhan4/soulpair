// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/SoulProfile.sol";
import "../src/MatchRegistry.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        // 1. Deploy SoulProfile
        SoulProfile soulProfile = new SoulProfile();
        console.log("SoulProfile deployed to:", address(soulProfile));

        // 2. Deploy MatchRegistry (treasury = deployer for now)
        MatchRegistry matchRegistry = new MatchRegistry(address(soulProfile), msg.sender);
        console.log("MatchRegistry deployed to:", address(matchRegistry));

        // 3. Set MatchRegistry on SoulProfile
        soulProfile.setMatchRegistry(address(matchRegistry));
        console.log("MatchRegistry set on SoulProfile");

        vm.stopBroadcast();

        console.log("\n=== Deployment Complete ===");
        console.log("Update packages/shared/src/constants.ts with:");
        console.log("  SoulProfile:", address(soulProfile));
        console.log("  MatchRegistry:", address(matchRegistry));
    }
}
