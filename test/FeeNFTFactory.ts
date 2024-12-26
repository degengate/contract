import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("FeeNFTFactory", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts)).coreContractInfo;

    expect(await info.feeNFTFactory.foundry()).eq(await info.foundry.getAddress());
  });

  it("create", async function () {
    const info = (await loadFixture(deployAllContracts));

    await expect(info.coreContractInfo.feeNFTFactory.create(info.xMemeAllContractInfo.appId, "123", info.xMemeAllContractInfo.deployWallet.address)).revertedWith("onlyFoundry");
  });
});
