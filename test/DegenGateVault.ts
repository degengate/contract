import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deployAllContract } from "./shared/deploy";

describe("DegenGateVault", function () {
    it("view", async function () {
        const info = await loadFixture(deployAllContract);

        expect(await info.degenGateVault.begen()).eq(await info.begen.getAddress())
        expect(await info.degenGateVault.degen()).eq(await info.mockDegen.getAddress())
        expect(await info.degenGateVault.degenGate()).eq(await info.degenGate.getAddress())
    });

    it("addApproveDegen", async function () {
        const info = await loadFixture(deployAllContract);

        await expect(
            info.degenGateVault.connect(info.userWallet).addApproveDegen()
        ).revertedWith("Ownable: caller is not the owner");

        expect(await info.degenGateVault.owner()).eq(info.deployWallet.address)
        await info.degenGateVault.connect(info.deployWallet).addApproveDegen()
    });

    it("collectAll", async function () {
        const info = await loadFixture(deployAllContract);
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

        // collectAll
        let deployWalletBegenAmount_1 = await info.begen.balanceOf(info.deployWallet.address);
        let deployWalletDegenAmount_1 = await info.mockDegen.balanceOf(info.deployWallet.address);

        expect(deployWalletBegenAmount_1).gt(BigInt(10) ** BigInt(18) * BigInt(100))
        let begenTotalSupply_1 = await info.begen.totalSupply();

        await info.degenGateVault.connect(info.deployWallet).collectAll("0x");

        let deployWalletBegenAmount_2 = await info.begen.balanceOf(info.deployWallet.address);
        let deployWalletDegenAmount_2 = await info.mockDegen.balanceOf(info.deployWallet.address);

        let begenTotalSupply_2 = await info.begen.totalSupply();

        expect(deployWalletBegenAmount_2).eq(0);
        expect(begenTotalSupply_1 - begenTotalSupply_2).eq(deployWalletBegenAmount_1);
        expect(
            deployWalletDegenAmount_2 - deployWalletDegenAmount_1
        ).eq(deployWalletBegenAmount_1)

        await expect(
            info.degenGateVault.connect(info.deployWallet).collectAll("0x")
        ).revertedWith("BE");

    });

    it("collect", async function () {
        const info = await loadFixture(deployAllContract);
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

        // collect
        let deployWalletBegenAmount_1 = await info.begen.balanceOf(info.deployWallet.address);
        let deployWalletDegenAmount_1 = await info.mockDegen.balanceOf(info.deployWallet.address);

        expect(deployWalletBegenAmount_1).gt(BigInt(10) ** BigInt(18) * BigInt(100))
        let begenTotalSupply_1 = await info.begen.totalSupply();

        let collectAmount = BigInt(10) ** BigInt(18) * BigInt(11)
        await info.degenGateVault.connect(info.deployWallet).collect(collectAmount, "0x");

        let deployWalletBegenAmount_2 = await info.begen.balanceOf(info.deployWallet.address);
        let deployWalletDegenAmount_2 = await info.mockDegen.balanceOf(info.deployWallet.address);

        let begenTotalSupply_2 = await info.begen.totalSupply();

        expect(deployWalletBegenAmount_2).eq(deployWalletBegenAmount_1 - collectAmount);
        expect(begenTotalSupply_1 - begenTotalSupply_2).eq(collectAmount);
        expect(
            deployWalletDegenAmount_2 - deployWalletDegenAmount_1
        ).eq(collectAmount)

        await expect(
            info.degenGateVault.connect(info.deployWallet).collect(deployWalletBegenAmount_2 + BigInt(1), "0x")
        ).revertedWith("BE");
    });
});
