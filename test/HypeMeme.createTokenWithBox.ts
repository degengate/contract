import { deployAllContracts } from "./shared/deploy";

import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";

describe("HypeMeme.createTokenWithBox", function () {
  it("createTokenWithBox | only degen", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60

    let params = {
      info: {
        name: "name_a",
        ticker: "ticker_a",
        description: "description_a",
        image: "image_a",
        twitterLink: "twitter_link_a",
        telegramLink: "telegram_link_a",
        warpcastLink: "warpcast_link_a",
        website: "website_a"
      },
      wrap: {
        degenAmount: info.hypeMemeNftPrice,
        specialPointAmount: 0
      },
      boxId: 1,
      boxTotalAmount: 0,
      deadline: deadline,
    };
    let tid = (await info.hypeMeme.nextTid()).toString()

    let signature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string name, string ticker, string description, string image, string twitterLink, string telegramLink, string warpcastLink, string website)",
              "tuple(uint256 degenAmount, uint256 specialPointAmount)",
              "uint256",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.wrap, params.boxId, params.boxTotalAmount, params.deadline, info.deployWallet.address],
          ),
        ),
      ),
    );


    let deployWallet_Degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
    let hypeMeme_Degen_1 = await info.mockDegen.balanceOf(await info.hypeMeme.getAddress());
    let hypeMemeFundRecipientWallet_Degen_1 = await info.mockDegen.balanceOf(info.hypeMemeFundRecipientWallet.address);
    let hypeMemeFundRecipientWallet_Point_1 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);

    await info.mockDegen.connect(info.deployWallet).approve(await info.hypeMeme.getAddress(), info.hypeMemeNftPrice);

    await info.hypeMeme
      .connect(info.deployWallet)
      .createTokenWithBox(params.info, params.wrap, params.boxId, params.boxTotalAmount, deadline, signature);

    let deployWallet_Degen_2 = await info.mockDegen.balanceOf(info.deployWallet.address);
    let hypeMeme_Degen_2 = await info.mockDegen.balanceOf(await info.hypeMeme.getAddress());
    let hypeMemeFundRecipientWallet_Degen_2 = await info.mockDegen.balanceOf(info.hypeMemeFundRecipientWallet.address);
    let hypeMemeFundRecipientWallet_Point_2 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);

    expect(await info.hypeMemePublicNFT.totalSupply()).eq(1)
    expect(await info.hypeMemePublicNFT.ownerOf(1)).eq(info.deployWallet.address);
    let info1 = await info.hypeMemePublicNFT.tokenIdToInfo(1)
    expect(info1.tid).eq(tid)
    expect(info1.percent).eq(100000)

    expect(deployWallet_Degen_2).eq(deployWallet_Degen_1 - info.hypeMemeNftPrice);
    expect(hypeMeme_Degen_2).eq(hypeMeme_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Degen_2).eq(hypeMemeFundRecipientWallet_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Point_2).eq(hypeMemeFundRecipientWallet_Point_1 + info.hypeMemeNftPrice);

  });

  it("createTokenWithBox | only point", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60

    let params = {
      info: {
        name: "name_a",
        ticker: "ticker_a",
        description: "description_a",
        image: "image_a",
        twitterLink: "twitter_link_a",
        telegramLink: "telegram_link_a",
        warpcastLink: "warpcast_link_a",
        website: "website_a"
      },
      wrap: {
        degenAmount: 0,
        specialPointAmount: info.hypeMemeNftPrice
      },
      boxId: 1,
      boxTotalAmount: info.hypeMemeNftPrice,
      deadline: deadline,
    };
    let tid = (await info.hypeMeme.nextTid()).toString()

    let signature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string name, string ticker, string description, string image, string twitterLink, string telegramLink, string warpcastLink, string website)",
              "tuple(uint256 degenAmount, uint256 specialPointAmount)",
              "uint256",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.wrap, params.boxId, params.boxTotalAmount, params.deadline, info.deployWallet.address],
          ),
        ),
      ),
    );


    let deployWallet_Degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
    let hypeMeme_Degen_1 = await info.mockDegen.balanceOf(await info.hypeMeme.getAddress());
    let hypeMemeFundRecipientWallet_Degen_1 = await info.mockDegen.balanceOf(info.hypeMemeFundRecipientWallet.address);
    let hypeMemeFundRecipientWallet_Point_1 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);

    await info.hypeMeme
      .connect(info.deployWallet)
      .createTokenWithBox(params.info, params.wrap, params.boxId, params.boxTotalAmount, deadline, signature);

    let deployWallet_Degen_2 = await info.mockDegen.balanceOf(info.deployWallet.address);
    let hypeMeme_Degen_2 = await info.mockDegen.balanceOf(await info.hypeMeme.getAddress());
    let hypeMemeFundRecipientWallet_Degen_2 = await info.mockDegen.balanceOf(info.hypeMemeFundRecipientWallet.address);
    let hypeMemeFundRecipientWallet_Point_2 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);

    expect(await info.hypeMemePublicNFT.totalSupply()).eq(1)
    expect(await info.hypeMemePublicNFT.ownerOf(1)).eq(info.deployWallet.address);
    let info1 = await info.hypeMemePublicNFT.tokenIdToInfo(1)
    expect(info1.tid).eq(tid)
    expect(info1.percent).eq(100000)

    expect(deployWallet_Degen_2 - deployWallet_Degen_1).eq(0)
    expect(hypeMeme_Degen_2).eq(hypeMeme_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Degen_2).eq(hypeMemeFundRecipientWallet_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Point_2).eq(hypeMemeFundRecipientWallet_Point_1 + info.hypeMemeNftPrice);

  });
});
