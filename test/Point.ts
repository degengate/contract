import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deployAllContracts } from "./shared/deploy";

describe("Point", function () {
    it("view", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        expect(await info.point.name()).eq("Point")
        expect(await info.point.symbol()).eq("POINT")
        expect(await info.point.totalSupply()).eq(0)

        expect(await info.point.vault()).eq(await info.degenGateVault.getAddress())
        expect(await info.point.degenGate()).eq(await info.degenGate.getAddress())
        expect(await info.point.MAX_TOKEN_SUPPLY()).eq(BigInt(10) ** BigInt(18) * BigInt("36965935954"))
    });

    it("burn error", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        expect(await info.point.balanceOf(info.deployWallet.address)).eq(0)
        await expect(
            info.point.connect(info.deployWallet).burnOrigin(1)
        ).revertedWithCustomError(info.point, "ERC20InsufficientBalance")
        await expect(
            info.point.connect(info.deployWallet).burnSender(1)
        ).revertedWithCustomError(info.point, "ERC20InsufficientBalance")
    });

    it("burn success", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        expect(await info.point.balanceOf(info.deployWallet.address)).eq(0)

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
                specialPointAmount: 0
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
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
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
        let deployWalletPointAmount_1 = await info.point.balanceOf(info.deployWallet.address);
        expect(deployWalletPointAmount_1).gt(BigInt(10) ** BigInt(18) * BigInt(100))
        let pointTotalSupply_1 = await info.point.totalSupply();

        let burnAmount_1 = BigInt(10) ** BigInt(18) * BigInt(10);
        await info.point.connect(info.deployWallet).burnSender(burnAmount_1);
        let deployWalletPointAmount_2 = await info.point.balanceOf(info.deployWallet.address);
        let pointTotalSupply_2 = await info.point.totalSupply();

        expect(deployWalletPointAmount_2).eq(deployWalletPointAmount_1 - burnAmount_1);
        expect(pointTotalSupply_2).eq(pointTotalSupply_1 - burnAmount_1);

        // burn tx origin
        let burnAmount_2 = BigInt(10) ** BigInt(18) * BigInt(21);
        await info.point.connect(info.deployWallet).burnOrigin(burnAmount_2);
        let deployWalletPointAmount_3 = await info.point.balanceOf(info.deployWallet.address);
        let pointTotalSupply_3 = await info.point.totalSupply();

        expect(deployWalletPointAmount_3).eq(deployWalletPointAmount_2 - burnAmount_2);
        expect(pointTotalSupply_3).eq(pointTotalSupply_2 - burnAmount_2);
    });

    it("mint error", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        await expect(
            info.point.connect(info.deployWallet).mint(info.deployWallet.address, 1)
        ).revertedWith("SE")
    });

    it("mint eq MAX_TOKEN_SUPPLY", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        const MAX_TOKEN_SUPPLY = await info.point.MAX_TOKEN_SUPPLY();
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        // create token
        let params = {
            info: {
                tid: "a",
                tName: "a",
                cid: "a",
                cName: "a",
                followers: 123,
                omf: 2212,
            },
            wrap: {
                degenAmount: 0,
                specialPointAmount: MAX_TOKEN_SUPPLY
            },
            deadline: deadline,
            nftPrice: MAX_TOKEN_SUPPLY,
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );


        expect(await info.point.totalSupply()).eq(0);

        // createTokenWrap
        await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

        expect(await info.point.totalSupply()).eq(MAX_TOKEN_SUPPLY);

    });

    it("mint > MAX_TOKEN_SUPPLY", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        const MAX_TOKEN_SUPPLY = await info.point.MAX_TOKEN_SUPPLY();
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        // create token
        let params = {
            info: {
                tid: "a",
                tName: "a",
                cid: "a",
                cName: "a",
                followers: 123,
                omf: 2212,
            },
            wrap: {
                degenAmount: 0,
                specialPointAmount: MAX_TOKEN_SUPPLY + BigInt(1)
            },
            deadline: deadline,
            nftPrice: MAX_TOKEN_SUPPLY + BigInt(1),
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );


        expect(await info.point.totalSupply()).eq(0);

        // createTokenWrap
        await expect(
            info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature)
        ).revertedWith("MTSE")
    });
});
