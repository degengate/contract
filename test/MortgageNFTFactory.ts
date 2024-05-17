import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MortgageNFTFactory", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    expect(await info.mortgageNFTFactory.foundry()).eq(await info.foundry.getAddress());
  });

  it("create", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    await expect(info.mortgageNFTFactory.create(info.appId, "123", info.userWallet.address)).revertedWith("onlyFoundry");
  });
});
