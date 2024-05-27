import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Market", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    expect(await info.market.appId()).eq(info.appId);
    expect(await info.market.totalPercent()).eq(await info.foundry.TOTAL_PERCENT());
    expect(await info.market.mortgageNFT()).eq(await info.mortgageNFT.getAddress());
    expect(await info.market.publicNFT()).eq(await info.publicNFT.getAddress());
    expect(await info.market.buyFee()).eq(info.buyFee);
    expect(await info.market.sellFee()).eq(info.sellFee);
    expect(await info.market.curve()).eq(await info.curve.getAddress());
    expect(await info.market.feeDenominator()).eq(await info.foundry.FEE_DENOMINATOR());
    expect(await info.market.foundry()).eq(await info.foundry.getAddress());
  });

  it("initialize", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    await expect(
      info.market.initialize(await info.publicNFT.getAddress(), await info.mortgageNFT.getAddress()),
    ).revertedWith("onlyFoundry");
  });

  it("getPayTokenAmount", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    expect(await info.market.getPayTokenAmount(100, 1000)).eq(await info.curve.curveMath(100, 1000));
  });

  it("getBuyPayTokenAmount tid not exist", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    expect(await info.market.getBuyPayTokenAmount("t123", 1000)).eq(await info.curve.curveMath(0, 1000));
  });

  it("getSellPayTokenAmount tid not exist", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    await expect(info.market.getSellPayTokenAmount("t123", 1)).revertedWithPanic();
  });

  it("totalSupply tid not exist", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    expect(await info.market.totalSupply("t123")).eq(0);
  });

  it("balanceOf tid not exist", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    expect(await info.market.balanceOf("t123", info.deployWallet.address)).eq(0);
  });
});
