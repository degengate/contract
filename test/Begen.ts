import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deployAllContracts } from "./shared/deploy";

describe("Begen", function () {
    it("view", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        expect(await info.begen.vault()).eq(await info.degenGateVault.getAddress())
        expect(await info.begen.degenGate()).eq(await info.degenGate.getAddress())
    });

    it("burn error", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        expect(await info.begen.balanceOf(info.deployWallet.address)).eq(0)
        await expect(
            info.begen.connect(info.deployWallet).burnOrigin(1)
        ).revertedWithCustomError(info.begen, "ERC20InsufficientBalance")
        await expect(
            info.begen.connect(info.deployWallet).burnSender(1)
        ).revertedWithCustomError(info.begen, "ERC20InsufficientBalance")
    });

    it("burn success", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        expect(await info.begen.balanceOf(info.deployWallet.address)).eq(0)

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60
        // create token a
        let paramsA = {
            info: {
                tid: "a",
                tName: "a",
                cid: "a",
                cName: "a",
                followers: 123,
                omf: 2212,
            },
            deadline: deadline,
            nftPrice: 0,
        };

        let signatureA = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsA.info, paramsA.nftPrice, paramsA.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );

        await info.degenGate.connect(info.deployWallet).createToken(paramsA.info, paramsA.nftPrice, paramsA.deadline, signatureA);

        // multiply
        let bignumber = BigInt(10) ** BigInt(18) * BigInt(1000000);
        await info.mockDegen.connect(info.deployWallet).approve(await info.degenGate.getAddress(), bignumber)
        let paramsMultiply = {
            tid: paramsA.info.tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(10000),
            wrap: {
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(10000),
                specialBegenAmount: 0
            },
            deadline: deadline,
        }

        let paramsMultiplySignature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "string",
                            "uint256",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );

        await info.degenGate.connect(info.deployWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        // burn sender
        let deployWalletBegenAmount_1 = await info.begen.balanceOf(info.deployWallet.address);
        expect(deployWalletBegenAmount_1).gt(BigInt(10) ** BigInt(18) * BigInt(100))
        let begenTotalSupply_1 = await info.begen.totalSupply();

        let burnAmount_1 = BigInt(10) ** BigInt(18) * BigInt(10);
        await info.begen.connect(info.deployWallet).burnSender(burnAmount_1);
        let deployWalletBegenAmount_2 = await info.begen.balanceOf(info.deployWallet.address);
        let begenTotalSupply_2 = await info.begen.totalSupply();

        expect(deployWalletBegenAmount_2).eq(deployWalletBegenAmount_1 - burnAmount_1);
        expect(begenTotalSupply_2).eq(begenTotalSupply_1 - burnAmount_1);

        // burn tx origin
        let burnAmount_2 = BigInt(10) ** BigInt(18) * BigInt(21);
        await info.begen.connect(info.deployWallet).burnOrigin(burnAmount_2);
        let deployWalletBegenAmount_3 = await info.begen.balanceOf(info.deployWallet.address);
        let begenTotalSupply_3 = await info.begen.totalSupply();

        expect(deployWalletBegenAmount_3).eq(deployWalletBegenAmount_2 - burnAmount_2);
        expect(begenTotalSupply_3).eq(begenTotalSupply_2 - burnAmount_2);
    });

    it("mint error", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        await expect(
            info.begen.connect(info.deployWallet).mint(info.deployWallet.address, 1)
        ).revertedWith("SE")
    });
});
