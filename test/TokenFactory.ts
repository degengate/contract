import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("TokenFactory", function () {
    it("deploy", async function () {
        const info = (await loadFixture(deployAllContracts)).coreContractInfo;

        expect(await info.tokenFactory.foundry()).eq(await info.foundry.getAddress());
    });

    it("create", async function () {
        const info = (await loadFixture(deployAllContracts));

        await expect(
            info.coreContractInfo.tokenFactory.create(
                info.xMemeAllContractInfo.appId,
                "123"
            ),
        ).revertedWith("onlyFoundry");
    });
});
