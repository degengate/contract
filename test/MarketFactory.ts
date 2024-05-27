import { deployAllContracts, ZERO_ADDRESS } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MarketFactory", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    expect(await info.marketFactory.foundry()).eq(await info.foundry.getAddress());
  });

  it("create", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    await expect(
      info.marketFactory.create(
        info.appId,
        await info.foundry.FEE_DENOMINATOR(),
        await info.foundry.TOTAL_PERCENT(),
        await info.curve.getAddress(),
        ZERO_ADDRESS,
        info.buyFee,
        info.sellFee,
      ),
    ).revertedWith("onlyFoundry");
  });
});
