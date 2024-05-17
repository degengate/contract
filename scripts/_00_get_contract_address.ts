import { ethers } from "hardhat";
import { getAllContractAddress } from "../test/shared/deploy_degen_gate";

async function main() {
  const wallets = await ethers.getSigners();
  const deployWallet = wallets[0];
  const info = await getAllContractAddress(deployWallet);

  let degenGatePublicNFT = ethers.getCreateAddress({
    from: info.publicNFTFactory,
    nonce: 1,
  });
  let degenGateMortgageNFT = ethers.getCreateAddress({
    from: info.mortgageNFTFactory,
    nonce: 1,
  });
  let degenGateMarket = ethers.getCreateAddress({
    from: info.marketFactory,
    nonce: 1,
  });


  let pk: string = process.env.SIGN_PRIVATE_KEY || "";
  if (pk.length === 0) {
    throw new Error("SIGN_PRIVATE_KEY is empty");
  }

  let sign_wallet = new ethers.Wallet(pk, deployWallet.provider)
  let sig_address = sign_wallet.address;

  let mw_address: string = process.env.MW_ADDRESS || "";
  if (mw_address.length === 0) {
    throw new Error("MW_ADDRESS is empty");
  }

  let degen_address: string = process.env.DEGEN_ADDRESS || "";
  if (degen_address.length === 0) {
    throw new Error("DEGEN_ADDRESS is empty");
  }

  const output = {
    appid: 1,
    mortgageFee: 100,
    buySellFee: 1000,
    degenAddress: degen_address,
    mortgageFeeWalletAddress: mw_address,
    degenGateFundRecipientWalletAddress: mw_address,
    signatureWalletAddress: sig_address,
    degenGateOwnerWalletAddress: mw_address,
    degenGateNFTClaimOwnerWalletAddress: mw_address,
    degenGateAppOwnerWalletAddress: mw_address,
    foundryOwnerWalletAddress: mw_address,
    degenGatePublicNFTOwnerWalletAddress: mw_address,
    degenGateMortgageNFTOwnerWalletAddress: mw_address,
    foundryAddress: info.foundry,
    publicNFTFactoryAddress: info.publicNFTFactory,
    mortgageNFTFactoryAddress: info.mortgageNFTFactory,
    marketFactoryAddress: info.marketFactory,
    curveAddress: info.curve,
    begenAddress: info.begen,
    degenGateAddress: info.degenGate,
    degenGateNFTClaimAddress: info.degenGateNFTClaim,
    degenGateVaultAddress: info.degenGateVault,
    degenGatePublicNFTAddress: degenGatePublicNFT,
    degenGateMortgageNFTAddress: degenGateMortgageNFT,
    degenGateMarketAddress: degenGateMarket,
  };
  console.log("=== params.json start ===");
  console.log(output);
  console.log("=== params.json end ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
