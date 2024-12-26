import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";

import { deployAllContracts } from "./shared/deploy";

import { ethers } from "hardhat";

describe("XMeme.claim", function () {
    it("claim revert", async function () {
        const baseInfo = (await loadFixture(deployAllContracts));
        const coreInfo = baseInfo.coreContractInfo;
        const info = baseInfo.xMemeAllContractInfo;

        await expect(
            info.xMeme.connect(info.userWallet).claim("1", "0x")
        ).revertedWith("SRE");

        await info.xMeme.setSystemReady(true)

        // signature is error
        const tid = "1"
        await expect(info.xMeme.connect(info.userWallet).claim(tid, "0x")).to.be.revertedWith("VSE");

        // signature is other user
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "string",
                            "address",
                        ],
                        [tid, await info.userWallet.getAddress()],
                    ),
                ),
            ),
        );
        await expect(info.xMeme.connect(info.deployWallet).claim(tid, signature)).to.be.revertedWith("VSE");

        await info.xMeme.connect(info.userWallet).claim(tid, signature)
        // is claimed
        await expect(info.xMeme.connect(info.userWallet).claim(tid, signature)).to.be.revertedWith("CE");
    });

    it("claim", async function () {
        const baseInfo = (await loadFixture(deployAllContracts));
        const coreInfo = baseInfo.coreContractInfo;
        const info = baseInfo.xMemeAllContractInfo;
        await info.xMeme.setSystemReady(true)

        const tid = "1"

        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "string",
                            "address",
                        ],
                        [tid, await info.userWallet.getAddress()],
                    ),
                ),
            ),
        );

        let user_1_eth = await ethers.provider.getBalance(info.userWallet.address);

        expect(await info.feeNFT.totalSupply()).eq(0)
        expect(await info.xMeme.isClaim(tid)).eq(false)
        let res = await info.xMeme.connect(info.userWallet).claim(tid, signature);
        let ress = await res.wait();
        let gas = ress!.gasPrice * ress!.gasUsed

        expect(await info.feeNFT.totalSupply()).eq(1)
        expect(await info.feeNFT.ownerOf(1)).eq(info.userWallet.address)
        expect(await info.xMeme.isClaim(tid)).eq(true)

        let user_2_eth = await ethers.provider.getBalance(info.userWallet.address);

        expect(user_1_eth - gas).eq(user_2_eth)
    });
});

