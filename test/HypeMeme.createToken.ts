import { deployAllContracts } from "./shared/deploy";

import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("HypeMeme.createToken", function () {
  it("createToken success", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.hypeMeme.setSystemReady(true)
    await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, 1000)

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
      }
    };

    let tid = params.info.ticker

    let deployWallet_Degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
    let hypeMeme_Degen_1 = await info.mockDegen.balanceOf(await info.hypeMeme.getAddress());
    let hypeMemeFundRecipientWallet_Degen_1 = await info.mockDegen.balanceOf(info.hypeMemeFundRecipientWallet.address);
    let hypeMemeFundRecipientWallet_Point_1 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);

    await info.mockDegen.connect(info.deployWallet).approve(await info.hypeMeme.getAddress(), info.hypeMemeNftPrice);

    await info.hypeMeme
      .connect(info.deployWallet)
      .createToken(params.info);

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

    let params2 = {
      info: {
        name: "name_b",
        ticker: "ticker_a",
        description: "description_a",
        image: "image_a",
        twitterLink: "twitter_link_a",
        telegramLink: "telegram_link_a",
        warpcastLink: "warpcast_link_a",
        website: "website_a"
      }
    };

    await expect(info.hypeMeme
      .connect(info.deployWallet)
      .createToken(params2.info)).revertedWith("TE")
  });

  it("createToken fail, degen input < need", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.hypeMeme.setSystemReady(true)
    await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, 1000)

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
      }
    };

    await info.mockDegen.connect(info.deployWallet).approve(await info.hypeMeme.getAddress(), info.hypeMemeNftPrice - BigInt(1));

    await expect(
      info.hypeMeme
        .connect(info.deployWallet)
        .createToken(params.info)
    ).revertedWithCustomError(info.mockDegen, "ERC20InsufficientAllowance")

  });

  it("createToken fail, input info have empty", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.hypeMeme.setSystemReady(true)
    await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, 1000)

    await info.mockDegen.connect(info.deployWallet).approve(await info.hypeMeme.getAddress(), info.hypeMemeNftPrice);

    await expect(
      info.hypeMeme
        .connect(info.deployWallet)
        .createToken({
          name: "",
          ticker: "ticker_a",
          description: "description_a",
          image: "image_a",
          twitterLink: "twitter_link_a",
          telegramLink: "telegram_link_a",
          warpcastLink: "warpcast_link_a",
          website: "website_a"
        })
    ).revertedWith("INE")

    await expect(
      info.hypeMeme
        .connect(info.deployWallet)
        .createToken({
          name: "name_a",
          ticker: "",
          description: "description_a",
          image: "image_a",
          twitterLink: "twitter_link_a",
          telegramLink: "telegram_link_a",
          warpcastLink: "warpcast_link_a",
          website: "website_a"
        })
    ).revertedWith("ITE")

    await expect(
      info.hypeMeme
        .connect(info.deployWallet)
        .createToken({
          name: "name_a",
          ticker: "ticker_a",
          description: "description_a",
          image: "",
          twitterLink: "twitter_link_a",
          telegramLink: "telegram_link_a",
          warpcastLink: "warpcast_link_a",
          website: "website_a"
        })
    ).revertedWith("IIE")

  })
});
