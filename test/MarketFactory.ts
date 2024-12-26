import { deployAllContracts, ZERO_ADDRESS } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MarketFactory", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts)).coreContractInfo;

    expect(await info.marketFactory.foundry()).eq(await info.foundry.getAddress());
  });

  it("create", async function () {
    const info = (await loadFixture(deployAllContracts));

    await expect(
      info.coreContractInfo.marketFactory.create(
        info.xMemeAllContractInfo.appId,
        await info.coreContractInfo.foundry.FEE_DENOMINATOR(),
        await info.coreContractInfo.foundry.TOTAL_PERCENT(),
        await info.xMemeAllContractInfo.curve.getAddress(),
        ZERO_ADDRESS
      ),
    ).revertedWith("onlyFoundry");
  });
});
