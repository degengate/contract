import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";

describe("CPFCurveFactory", function () {
    it("deploy", async function () {
        const info = (await loadFixture(deployAllContracts)).coreContractInfo;

        expect(await info.cpfCurveFactory.foundry()).eq(await info.foundry.getAddress());
    });

    it("create", async function () {
        const info = (await loadFixture(deployAllContracts));

        let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "uint256"],
            [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
        )

        await expect(info.coreContractInfo.cpfCurveFactory.create(info.xMemeAllContractInfo.appId, curveParams)).revertedWith("onlyFoundry");
    });
});
