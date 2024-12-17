import { ethers } from "hardhat";
import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { getTokenAmountWei, parseTokenURI, saveSVG } from "./shared/utils";
import { XMemeMortgageNFTView } from "../typechain-types";

const nft_name = "X-meme Option"
const nft_symbol = "XMO"

const nft_json_desc = "This NFT represents a collateral option within the X-meme.\n⚠️ DISCLAIMER: Always perform due diligence before purchasing this NFT. Verify that the image reflects the correct number of option in the collateral. Refresh cached images on trading platforms to ensure you have the latest data."

describe("XMeme.MortgageNFTView", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts)).xMemeAllContractInfo;

    let xMemeMortgageNFTView = (await (
      await ethers.getContractFactory("XMemeMortgageNFTView")
    ).deploy(
      await info.mortgageNFT.getAddress(),
    )) as XMemeMortgageNFTView;

    expect(await xMemeMortgageNFTView.mortgageNFT()).eq(await info.mortgageNFT.getAddress());
    expect(await xMemeMortgageNFTView.name()).eq(nft_name);
    expect(await xMemeMortgageNFTView.symbol()).eq(nft_symbol);
  });

  it("test", async function () {
    const info = (await loadFixture(deployAllContracts)).xMemeAllContractInfo;
    await info.xMeme.setSystemReady(true)

    let xMemeMortgageNFTView = (await (
      await ethers.getContractFactory("XMemeMortgageNFTView")
    ).deploy(
      await info.mortgageNFT.getAddress(),
    )) as XMemeMortgageNFTView;

    await info.mortgageNFT.connect(info.appOwnerWallet).setMortgageNFTView(await xMemeMortgageNFTView.getAddress());


    let user1 = info.wallets[info.nextWalletIndex + 1];
    let user2 = info.wallets[info.nextWalletIndex + 2];
    let user3 = info.wallets[info.nextWalletIndex + 3];

    let tid = "12345678";

    let multiplyResult1 = await info.xMeme.connect(user1).createTokenAndMultiply.staticCall(tid, getTokenAmountWei(12345), { value: ethers.parseEther("2345") });
    await info.xMeme.connect(user1).createTokenAndMultiply(tid, getTokenAmountWei(12345), { value: ethers.parseEther("2345") });

    expect(await info.mortgageNFT.name()).eq(nft_name);
    expect(await info.mortgageNFT.symbol()).eq(nft_symbol);

    const mnft1 = await info.mortgageNFT.tokenURI(multiplyResult1.mortgageNFTtokenId);
    const json1 = parseTokenURI(mnft1);
    expect(json1.name).eq(`${tid} - #1 - 12345`);
    expect(json1.description).eq(nft_json_desc);
    saveSVG("xmeme.mnft1", json1.image);

    let multiplyResult2 = await info.market.connect(user2).multiply.staticCall(tid, BigInt(10) ** BigInt(16) * BigInt(216789), { value: ethers.parseEther("2345") });
    await info.market.connect(user2).multiply(tid, BigInt(10) ** BigInt(16) * BigInt(216789), { value: ethers.parseEther("2345") });

    const mnft2 = await info.mortgageNFT.tokenURI(multiplyResult2.nftTokenId);
    const json2 = parseTokenURI(mnft2);
    expect(json2.name).eq(`${tid} - #2 - 2167`);
    expect(json2.description).eq(nft_json_desc);
    saveSVG("xmeme.mnft2", json2.image);

    let multiplyResult3 = await info.market.connect(user3).multiply.staticCall(tid, BigInt(10) ** BigInt(17) * BigInt(123), { value: ethers.parseEther("2345") });
    await info.market.connect(user3).multiply(tid, BigInt(10) ** BigInt(17) * BigInt(123), { value: ethers.parseEther("2345") });

    const mnft3 = await info.mortgageNFT.tokenURI(multiplyResult3.nftTokenId);
    const json3 = parseTokenURI(mnft3);
    expect(json3.name).eq(`${tid} - #3 - 12`);
    expect(json3.description).eq(nft_json_desc);
    saveSVG("xmeme.mnft3", json3.image);
  });
});
