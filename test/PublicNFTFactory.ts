import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("PublicNFTFactory", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    expect(await info.publicNFTFactory.foundry()).eq(await info.foundry.getAddress());
  });

  it("create", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    await expect(info.publicNFTFactory.create(info.appId, "123", info.userWallet.address)).revertedWith("onlyFoundry");
  });
});
