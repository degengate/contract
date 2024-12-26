import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";


describe("Token", function () {
    it("market tid", async function () {
        const info = (await loadFixture(deployAllContracts));
        const xMemeAllContractInfo = info.xMemeAllContractInfo;
        const coreContractInfo = info.coreContractInfo;

        await xMemeAllContractInfo.xMeme.setSystemReady(true)

        let tid = "t1";
        let multiplyAmount = 100;

        await xMemeAllContractInfo.xMeme.connect(xMemeAllContractInfo.userWallet).createTokenAndMultiply(tid, multiplyAmount, { value: BigInt(10) ** BigInt(20) });

        let tokenAddr = await coreContractInfo.foundry.token(info.xMemeAllContractInfo.appId, tid);
        let token = await ethers.getContractAt("Token", tokenAddr);

        expect(await token.market()).eq(await xMemeAllContractInfo.market.getAddress());
        expect(await token.tid()).eq(tid);
    });

    it("marketMint marketBurn", async function () {
        const info = (await loadFixture(deployAllContracts));
        const xMemeAllContractInfo = info.xMemeAllContractInfo;
        const coreContractInfo = info.coreContractInfo;

        await xMemeAllContractInfo.xMeme.setSystemReady(true)

        let tid = "t1";
        let multiplyAmount = 100;

        await xMemeAllContractInfo.xMeme.connect(xMemeAllContractInfo.userWallet).createTokenAndMultiply(tid, multiplyAmount, { value: BigInt(10) ** BigInt(20) });

        let tokenAddr = await coreContractInfo.foundry.token(info.xMemeAllContractInfo.appId, tid);
        let token = await ethers.getContractAt("Token", tokenAddr);

        await expect(token.connect(xMemeAllContractInfo.userWallet).marketMint(100)).revertedWith("TSE");
        await expect(token.connect(xMemeAllContractInfo.userWallet).marketBurn(100)).revertedWith("TSE");

    });
});
