import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat/";
import { DiceGame, RiggedRoll } from "../typechain-types";

const deployRiggedRoll: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const diceGame: DiceGame = await ethers.getContract("DiceGame");
  const diceGameAddress = await diceGame.getAddress();

  // Uncomment to deploy RiggedRoll contract
  await deploy("RiggedRoll", {
    from: deployer,
    log: true,
    args: [diceGameAddress],
    autoMine: true,
  });

  const riggedRoll: RiggedRoll = await ethers.getContract("RiggedRoll", deployer);

  // Set the frontend (player) address as the owner so it can call `withdraw`.
  // Preferred: set env var `FRONTEND_OWNER_ADDRESS` to your wallet address.
  // Fallback (localhost): uses Hardhat account #1.
  const signers = await ethers.getSigners();
  const fallbackOwner = signers[1]?.address;
  const newOwner = process.env.FRONTEND_OWNER_ADDRESS ?? fallbackOwner;

  if (!newOwner) {
    console.log("No owner address found. Set FRONTEND_OWNER_ADDRESS to enable withdraw from the frontend.");
    return;
  }

  try {
    const currentOwner = await riggedRoll.owner();
    if (currentOwner.toLowerCase() !== newOwner.toLowerCase()) {
      const tx = await riggedRoll.transferOwnership(newOwner);
      await tx.wait();
      console.log(`RiggedRoll ownership transferred to ${newOwner}`);
    }
  } catch (err) {
    console.log(err);
  }
};

export default deployRiggedRoll;

deployRiggedRoll.tags = ["RiggedRoll"];
