import { ethers } from "hardhat";
import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { getTokenAmountWei, parseTokenURI, saveSVG } from "./shared/utils";
import { MortgageNFTView } from "../typechain-types";
import { DegenGateAllContractInfo } from "./shared/deploy_degen_gate";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const nft_name = "Castle Option"
const nft_symbol = "CO"

const nft_json_desc = "This NFT represents a collateral option within the Gate of Degen.\n⚠️ DISCLAIMER: Always perform due diligence before purchasing this NFT. Verify that the image reflects the correct number of option in the collateral. Refresh cached images on trading platforms to ensure you have the latest data."

async function multiply(tid: string, info: DegenGateAllContractInfo, multiplyAmount: bigint, userWallet: HardhatEthersSigner): Promise<{
  nftTokenId: bigint;
  payTokenAmount: bigint;
}> {
  const currentTimestamp = Math.floor(new Date().getTime() / 1000);
  const deadline = currentTimestamp + 60 * 60;

  let paramsMultiply = {
    tid: tid,
    multiplyAmount: multiplyAmount,
    wrap: {
      degenAmount: 0,
      specialBegenAmount: multiplyAmount * BigInt(10)
    },
    deadline: deadline,
  }

  let paramsMultiplySignature = await info.signatureWallet.signMessage(
    ethers.toBeArray(
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          [
            "string",
            "uint256",
            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
            "uint256",
            "address",
          ],
          [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, userWallet.address],
        ),
      ),
    ),
  );

  let result = await info.degenGate.connect(userWallet).multiply.staticCall(
    paramsMultiply.tid,
    paramsMultiply.multiplyAmount,
    paramsMultiply.wrap,
    paramsMultiply.deadline,
    paramsMultiplySignature
  )

  await info.degenGate.connect(userWallet).multiply(
    paramsMultiply.tid,
    paramsMultiply.multiplyAmount,
    paramsMultiply.wrap,
    paramsMultiply.deadline,
    paramsMultiplySignature
  )
  return result
}


describe("MortgageNFTView", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    let mortgageNFTView = (await (
      await ethers.getContractFactory("MortgageNFTView")
    ).deploy(
      await info.foundry.getAddress(),
      info.appId,
      await info.mortgageNFT.getAddress(),
      await info.degenGateNFTClaim.getAddress(),
    )) as MortgageNFTView;

    expect(await mortgageNFTView.appId()).eq(info.appId);
    expect(await mortgageNFTView.foundry()).eq(await info.foundry.getAddress());
    expect(await mortgageNFTView.nftClaim()).eq(await info.degenGateNFTClaim.getAddress());
    expect(await mortgageNFTView.mortgageNFT()).eq(await info.mortgageNFT.getAddress());
    expect(await mortgageNFTView.name()).eq(nft_name);
    expect(await mortgageNFTView.symbol()).eq(nft_symbol);
  });

  it("test", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    let mortgageNFTView = (await (
      await ethers.getContractFactory("MortgageNFTView")
    ).deploy(
      await info.foundry.getAddress(),
      info.appId,
      await info.mortgageNFT.getAddress(),
      await info.degenGateNFTClaim.getAddress(),
    )) as MortgageNFTView;

    await info.mortgageNFT.connect(info.degenGateOwnerWallet).setMortgageNFTView(await mortgageNFTView.getAddress());

    let bigNumber = BigInt(10) ** BigInt(20) * BigInt(8);

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    let user1 = info.wallets[info.nextWalletIndex + 1];
    let user2 = info.wallets[info.nextWalletIndex + 2];
    let user3 = info.wallets[info.nextWalletIndex + 3];

    // create token
    let params = {
      info: {
        tid: "12345678",
        tName: "degengate",
        cid: "87654321",
        cName: "tom",
        followers: 2567967,
        omf: "6123400000000000000",
      },
      wrap: {
        degenAmount: 0,
        specialBegenAmount: 0
      },
      deadline: deadline,
      nftPrice: 0,
    };
    let signature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.wrap, params.nftPrice, params.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    // createTokenWrap
    await info.degenGate.connect(info.userWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

    let multiplyResult1 = await multiply(params.info.tid, info, getTokenAmountWei(12345), user1)

    expect(await info.mortgageNFT.name()).eq(nft_name);
    expect(await info.mortgageNFT.symbol()).eq(nft_symbol);

    const mnft1 = await info.mortgageNFT.tokenURI(multiplyResult1.nftTokenId);
    const json1 = parseTokenURI(mnft1);
    expect(json1.name).eq("@degengate - #1 - 12345");
    expect(json1.description).eq(nft_json_desc);
    saveSVG("mnft1", json1.image);

    let multiplyResult2 = await multiply(params.info.tid, info, BigInt(10) ** BigInt(16) * BigInt(216789), user2)

    const mnft2 = await info.mortgageNFT.tokenURI(multiplyResult2.nftTokenId);
    const json2 = parseTokenURI(mnft2);
    expect(json2.name).eq("@degengate - #2 - 2167");
    expect(json2.description).eq(nft_json_desc);
    saveSVG("mnft2", json2.image);

    let multiplyResult3 = await multiply(params.info.tid, info, BigInt(10) ** BigInt(17) * BigInt(123), user3)

    const mnft3 = await info.mortgageNFT.tokenURI(multiplyResult3.nftTokenId);
    const json3 = parseTokenURI(mnft3);
    expect(json3.name).eq("@degengate - #3 - 12");
    expect(json3.description).eq(nft_json_desc);
    saveSVG("mnft3", json3.image);
  });
});
