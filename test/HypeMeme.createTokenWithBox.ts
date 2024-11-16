import { deployAllContracts } from "./shared/deploy";

import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";

describe("HypeMeme.createTokenWithBox", function () {
  it("createTokenWithBox | only degen | eq", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.hypeMeme.setSystemReady(true)
    await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

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
    let tid = params.info.ticker

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

    expect(await info.hypeMemePublicNFT.totalSupply()).eq(2)
    expect(await info.hypeMemePublicNFT.ownerOf(1)).eq(info.deployWallet.address);
    expect(await info.hypeMemePublicNFT.ownerOf(2)).eq(info.hypeMemeFundRecipientWallet.address);

    let info1 = await info.hypeMemePublicNFT.tokenIdToInfo(1)
    expect(info1.tid).eq(tid)
    expect(info1.percent).eq(62500)

    let info2 = await info.hypeMemePublicNFT.tokenIdToInfo(2)
    expect(info2.tid).eq(tid)
    expect(info2.percent).eq(37500)

    expect(deployWallet_Degen_2).eq(deployWallet_Degen_1 - info.hypeMemeNftPrice);
    expect(hypeMeme_Degen_2).eq(hypeMeme_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Degen_2).eq(hypeMemeFundRecipientWallet_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Point_2).eq(hypeMemeFundRecipientWallet_Point_1 + info.hypeMemeNftPrice);

    expect(await info.point.totalSupply()).eq(info.hypeMemeNftPrice)

  });

  it("createTokenWithBox | only degen | input > need", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.hypeMeme.setSystemReady(true)
    await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60

    let gt = BigInt(10) ** BigInt(18) * BigInt(123)
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
        degenAmount: info.hypeMemeNftPrice + gt,
        specialPointAmount: 0
      },
      boxId: 1,
      boxTotalAmount: 0,
      deadline: deadline,
    };
    let tid = params.info.ticker

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

    expect(await info.hypeMemePublicNFT.totalSupply()).eq(2)
    expect(await info.hypeMemePublicNFT.ownerOf(1)).eq(info.deployWallet.address);
    expect(await info.hypeMemePublicNFT.ownerOf(2)).eq(info.hypeMemeFundRecipientWallet.address);

    let info1 = await info.hypeMemePublicNFT.tokenIdToInfo(1)
    expect(info1.tid).eq(tid)
    expect(info1.percent).eq(62500)

    let info2 = await info.hypeMemePublicNFT.tokenIdToInfo(2)
    expect(info2.tid).eq(tid)
    expect(info2.percent).eq(37500)

    expect(deployWallet_Degen_2).eq(deployWallet_Degen_1 - info.hypeMemeNftPrice);
    expect(hypeMeme_Degen_2).eq(hypeMeme_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Degen_2).eq(hypeMemeFundRecipientWallet_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Point_2).eq(hypeMemeFundRecipientWallet_Point_1 + info.hypeMemeNftPrice);

    expect(await info.point.totalSupply()).eq(info.hypeMemeNftPrice)

  });

  it("createTokenWithBox | only degen | input < need", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.hypeMeme.setSystemReady(true)
    await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60

    let lt = BigInt(10) ** BigInt(18) * BigInt(123)

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
        degenAmount: info.hypeMemeNftPrice - lt,
        specialPointAmount: 0
      },
      boxId: 1,
      boxTotalAmount: 0,
      deadline: deadline,
    };
    let tid = params.info.ticker

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

    await info.mockDegen.connect(info.deployWallet).approve(await info.hypeMeme.getAddress(), info.hypeMemeNftPrice);

    await expect(
      info.hypeMeme
        .connect(info.deployWallet)
        .createTokenWithBox(params.info, params.wrap, params.boxId, params.boxTotalAmount, deadline, signature)
    ).revertedWith("PE");


  });

  it("createTokenWithBox | only point | eq", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
    await info.hypeMeme.setSystemReady(true)
    await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

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
    let tid = params.info.ticker

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

    expect(await info.hypeMemePublicNFT.totalSupply()).eq(2)
    expect(await info.hypeMemePublicNFT.ownerOf(1)).eq(info.deployWallet.address);
    expect(await info.hypeMemePublicNFT.ownerOf(2)).eq(info.hypeMemeFundRecipientWallet.address);

    let info1 = await info.hypeMemePublicNFT.tokenIdToInfo(1)
    expect(info1.tid).eq(tid)
    expect(info1.percent).eq(62500)

    let info2 = await info.hypeMemePublicNFT.tokenIdToInfo(2)
    expect(info2.tid).eq(tid)
    expect(info2.percent).eq(37500)

    expect(deployWallet_Degen_2 - deployWallet_Degen_1).eq(0)
    expect(hypeMeme_Degen_2).eq(hypeMeme_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Degen_2).eq(hypeMemeFundRecipientWallet_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Point_2).eq(hypeMemeFundRecipientWallet_Point_1 + info.hypeMemeNftPrice);
    expect(await info.point.totalSupply()).eq(info.hypeMemeNftPrice)

  });

  it("createTokenWithBox | only point | input > need", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
    await info.hypeMeme.setSystemReady(true)
    await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60
    let gt = BigInt(10) ** BigInt(18) * BigInt(123)
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
        specialPointAmount: info.hypeMemeNftPrice + gt
      },
      boxId: 1,
      boxTotalAmount: info.hypeMemeNftPrice + gt,
      deadline: deadline,
    };
    let tid = params.info.ticker

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

    expect(await info.hypeMemePublicNFT.totalSupply()).eq(2)
    expect(await info.hypeMemePublicNFT.ownerOf(1)).eq(info.deployWallet.address);
    expect(await info.hypeMemePublicNFT.ownerOf(2)).eq(info.hypeMemeFundRecipientWallet.address);

    let info1 = await info.hypeMemePublicNFT.tokenIdToInfo(1)
    expect(info1.tid).eq(tid)
    expect(info1.percent).eq(62500)

    let info2 = await info.hypeMemePublicNFT.tokenIdToInfo(2)
    expect(info2.tid).eq(tid)
    expect(info2.percent).eq(37500)

    expect(deployWallet_Degen_2 - deployWallet_Degen_1).eq(0)
    expect(hypeMeme_Degen_2).eq(hypeMeme_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Degen_2).eq(hypeMemeFundRecipientWallet_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Point_2).eq(hypeMemeFundRecipientWallet_Point_1 + info.hypeMemeNftPrice);
    expect(await info.point.totalSupply()).eq(info.hypeMemeNftPrice)

  });

  it("createTokenWithBox | only point | input < need", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
    await info.hypeMeme.setSystemReady(true)
    await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60
    let lt = BigInt(10) ** BigInt(18) * BigInt(123)
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
        specialPointAmount: info.hypeMemeNftPrice - lt
      },
      boxId: 1,
      boxTotalAmount: info.hypeMemeNftPrice - lt,
      deadline: deadline,
    };
    let tid = params.info.ticker

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

    await expect(
      info.hypeMeme
        .connect(info.deployWallet)
        .createTokenWithBox(params.info, params.wrap, params.boxId, params.boxTotalAmount, deadline, signature)
    ).revertedWith("PE");

  });

  it("createTokenWithBox | degen and point | eq", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
    await info.hypeMeme.setSystemReady(true)
    await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60

    const degenAmount = BigInt(10) ** BigInt(18) * BigInt(123)
    const specialPointAmount = info.hypeMemeNftPrice - degenAmount

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
        degenAmount: degenAmount,
        specialPointAmount: specialPointAmount
      },
      boxId: 1,
      boxTotalAmount: info.hypeMemeNftPrice,
      deadline: deadline,
    };
    let tid = params.info.ticker

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

    expect(await info.hypeMemePublicNFT.totalSupply()).eq(2)
    expect(await info.hypeMemePublicNFT.ownerOf(1)).eq(info.deployWallet.address);
    expect(await info.hypeMemePublicNFT.ownerOf(2)).eq(info.hypeMemeFundRecipientWallet.address);

    let info1 = await info.hypeMemePublicNFT.tokenIdToInfo(1)
    expect(info1.tid).eq(tid)
    expect(info1.percent).eq(62500)

    let info2 = await info.hypeMemePublicNFT.tokenIdToInfo(2)
    expect(info2.tid).eq(tid)
    expect(info2.percent).eq(37500)

    expect(deployWallet_Degen_2).eq(deployWallet_Degen_1 - degenAmount);
    expect(hypeMeme_Degen_2).eq(hypeMeme_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Degen_2).eq(hypeMemeFundRecipientWallet_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Point_2).eq(hypeMemeFundRecipientWallet_Point_1 + info.hypeMemeNftPrice);

    expect(await info.point.totalSupply()).eq(info.hypeMemeNftPrice)

  });

  it("createTokenWithBox | degen and point | input > need | point > need", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
    await info.hypeMeme.setSystemReady(true)
    await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60

    const degenAmount = BigInt(10) ** BigInt(18) * BigInt(123)
    const specialPointAmount = info.hypeMemeNftPrice + BigInt(10) ** BigInt(18) * BigInt(100)

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
        degenAmount: degenAmount,
        specialPointAmount: specialPointAmount
      },
      boxId: 1,
      boxTotalAmount: specialPointAmount,
      deadline: deadline,
    };
    let tid = params.info.ticker

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

    expect(await info.hypeMemePublicNFT.totalSupply()).eq(2)
    expect(await info.hypeMemePublicNFT.ownerOf(1)).eq(info.deployWallet.address);
    expect(await info.hypeMemePublicNFT.ownerOf(2)).eq(info.hypeMemeFundRecipientWallet.address);

    let info1 = await info.hypeMemePublicNFT.tokenIdToInfo(1)
    expect(info1.tid).eq(tid)
    expect(info1.percent).eq(62500)

    let info2 = await info.hypeMemePublicNFT.tokenIdToInfo(2)
    expect(info2.tid).eq(tid)
    expect(info2.percent).eq(37500)

    expect(deployWallet_Degen_2).eq(deployWallet_Degen_1);
    expect(hypeMeme_Degen_2).eq(hypeMeme_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Degen_2).eq(hypeMemeFundRecipientWallet_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Point_2).eq(hypeMemeFundRecipientWallet_Point_1 + info.hypeMemeNftPrice);

    expect(await info.point.totalSupply()).eq(info.hypeMemeNftPrice)

  });

  it("createTokenWithBox | degen and point | input > need | point == need", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
    await info.hypeMeme.setSystemReady(true)
    await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60

    const degenAmount = BigInt(10) ** BigInt(18) * BigInt(123)
    const specialPointAmount = info.hypeMemeNftPrice

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
        degenAmount: degenAmount,
        specialPointAmount: specialPointAmount
      },
      boxId: 1,
      boxTotalAmount: specialPointAmount,
      deadline: deadline,
    };
    let tid = params.info.ticker

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

    expect(await info.hypeMemePublicNFT.totalSupply()).eq(2)
    expect(await info.hypeMemePublicNFT.ownerOf(1)).eq(info.deployWallet.address);
    expect(await info.hypeMemePublicNFT.ownerOf(2)).eq(info.hypeMemeFundRecipientWallet.address);

    let info1 = await info.hypeMemePublicNFT.tokenIdToInfo(1)
    expect(info1.tid).eq(tid)
    expect(info1.percent).eq(62500)

    let info2 = await info.hypeMemePublicNFT.tokenIdToInfo(2)
    expect(info2.tid).eq(tid)
    expect(info2.percent).eq(37500)

    expect(deployWallet_Degen_2).eq(deployWallet_Degen_1);
    expect(hypeMeme_Degen_2).eq(hypeMeme_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Degen_2).eq(hypeMemeFundRecipientWallet_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Point_2).eq(hypeMemeFundRecipientWallet_Point_1 + info.hypeMemeNftPrice);

    expect(await info.point.totalSupply()).eq(info.hypeMemeNftPrice)

  });

  it("createTokenWithBox | degen and point | input > need | point < need", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
    await info.hypeMeme.setSystemReady(true)
    await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60

    const input = info.hypeMemeNftPrice + BigInt(10) ** BigInt(18) * BigInt(123)
    const specialPointAmount = info.hypeMemeNftPrice - BigInt(10) ** BigInt(18) * BigInt(100)
    const degenAmount = input - specialPointAmount

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
        degenAmount: degenAmount,
        specialPointAmount: specialPointAmount
      },
      boxId: 1,
      boxTotalAmount: specialPointAmount,
      deadline: deadline,
    };
    let tid = params.info.ticker

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

    expect(await info.hypeMemePublicNFT.totalSupply()).eq(2)
    expect(await info.hypeMemePublicNFT.ownerOf(1)).eq(info.deployWallet.address);
    expect(await info.hypeMemePublicNFT.ownerOf(2)).eq(info.hypeMemeFundRecipientWallet.address);

    let info1 = await info.hypeMemePublicNFT.tokenIdToInfo(1)
    expect(info1.tid).eq(tid)
    expect(info1.percent).eq(62500)

    let info2 = await info.hypeMemePublicNFT.tokenIdToInfo(2)
    expect(info2.tid).eq(tid)
    expect(info2.percent).eq(37500)

    expect(info.hypeMemeNftPrice - specialPointAmount).lt(degenAmount)
    expect(deployWallet_Degen_2).eq(deployWallet_Degen_1 - (info.hypeMemeNftPrice - specialPointAmount));
    expect(hypeMeme_Degen_2).eq(hypeMeme_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Degen_2).eq(hypeMemeFundRecipientWallet_Degen_1).eq(0);
    expect(hypeMemeFundRecipientWallet_Point_2).eq(hypeMemeFundRecipientWallet_Point_1 + info.hypeMemeNftPrice);

    expect(await info.point.totalSupply()).eq(info.hypeMemeNftPrice)

  });

  it("createTokenWithBox | degen and point | input < need", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
    await info.hypeMeme.setSystemReady(true)
    await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60

    const degenAmount = BigInt(10) ** BigInt(18) * BigInt(123)
    const specialPointAmount = info.hypeMemeNftPrice - degenAmount - BigInt(1)

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
        degenAmount: degenAmount,
        specialPointAmount: specialPointAmount
      },
      boxId: 1,
      boxTotalAmount: specialPointAmount,
      deadline: deadline,
    };
    let tid = params.info.ticker

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

    await info.mockDegen.connect(info.deployWallet).approve(await info.hypeMeme.getAddress(), info.hypeMemeNftPrice);

    await expect(
      info.hypeMeme
        .connect(info.deployWallet)
        .createTokenWithBox(params.info, params.wrap, params.boxId, params.boxTotalAmount, deadline, signature)
    ).revertedWith("PE");


  });

  it("createTokenWithBox | input info have empty", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.hypeMeme.setSystemReady(true)
    await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

    async function create(_info: any, error: string) {
      const currentTimestamp = Math.floor(new Date().getTime() / 1000);
      const deadline = currentTimestamp + 60 * 60

      let lt = BigInt(10) ** BigInt(18) * BigInt(123)

      let params = {
        info: _info,
        wrap: {
          degenAmount: info.hypeMemeNftPrice - lt,
          specialPointAmount: 0
        },
        boxId: 1,
        boxTotalAmount: 0,
        deadline: deadline,
      };

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

      await info.mockDegen.connect(info.deployWallet).approve(await info.hypeMeme.getAddress(), info.hypeMemeNftPrice);

      await expect(
        info.hypeMeme
          .connect(info.deployWallet)
          .createTokenWithBox(params.info, params.wrap, params.boxId, params.boxTotalAmount, deadline, signature)
      ).revertedWith(error);

    }

    await create({
      name: "",
      ticker: "ticker_a",
      description: "description_a",
      image: "image_a",
      twitterLink: "twitter_link_a",
      telegramLink: "telegram_link_a",
      warpcastLink: "warpcast_link_a",
      website: "website_a"
    }, "INE")

    await create({
      name: "name_a",
      ticker: "",
      description: "description_a",
      image: "image_a",
      twitterLink: "twitter_link_a",
      telegramLink: "telegram_link_a",
      warpcastLink: "warpcast_link_a",
      website: "website_a"
    }, "ITE")

    await create({
      name: "name_a",
      ticker: "ticker_a",
      description: "description_a",
      image: "",
      twitterLink: "twitter_link_a",
      telegramLink: "telegram_link_a",
      warpcastLink: "warpcast_link_a",
      website: "website_a"
    }, "IIE")

  });
});
