import { deployAllContracts } from "./shared/deploy";

import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("HypeMeme.onlyOwner", function () {
  it("setSystemReady", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;

    await expect(
      info.hypeMeme.connect(info.userWallet).setSystemReady(true)
    ).revertedWithCustomError(info.hypeMeme, "OwnableUnauthorizedAccount")

    expect(await info.hypeMeme.isSystemReady()).eq(false)
    await info.hypeMeme.setSystemReady(true)
    expect(await info.hypeMeme.isSystemReady()).eq(true)
    await info.hypeMeme.setSystemReady(false)
    expect(await info.hypeMeme.isSystemReady()).eq(false)
  });

  it("setNftPrice", async function () {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;

    await expect(
      info.hypeMeme.connect(info.userWallet).setNftPrice(1)
    ).revertedWithCustomError(info.hypeMeme, "OwnableUnauthorizedAccount")

    expect(await info.hypeMeme.nftPrice()).eq(info.hypeMemeNftPrice)
    await info.hypeMeme.setNftPrice(1)
    expect(await info.hypeMeme.nftPrice()).eq(1)
    await info.hypeMeme.setNftPrice(2)
    expect(await info.hypeMeme.nftPrice()).eq(2)
  });
});
