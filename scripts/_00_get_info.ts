import { ethers } from "hardhat";

async function main() {
  const wallets = await ethers.getSigners();
  const deployWallet = wallets[0];

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

  const output = {
    appName: "XMeme",
    appid: 1,
    appOwnerMortgageFee: 300,
    platformMortgageFee: 100,
    appOwnerBuyFee: 600,
    appOwnerSellFee: 600,
    feeNFTBuyFee: 1000,
    feeNFTSellFee: 1000,
    firstBuyFee: "10000000000000000",
    sig_address: sig_address,
    mw_address: mw_address,
    foundryDataAddress: "",
    foundryAddress: "",
    feeNFTFactoryAddress: "",
    mortgageNFTFactoryAddress: "",
    marketFactoryAddress: "",
    tokenFactoryAddress: "",
    cPFCurveFactoryAddress: "",
    feeNFTAddress: "",
    mortgageNFTAddress: "",
    marketAddress: "",
    curveAddress: "",
    xMemeAddress: "",
    feeNFTViewAddress: "",
    mortgageNFTViewAddress: "",
  };

  console.log("=== params.json start ===");
  console.log(output);
  console.log("=== params.json end ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
