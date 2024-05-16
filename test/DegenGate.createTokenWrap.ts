import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deployAllContract, MAX_UINT256 } from "./shared/deploy";

describe("DegenGate.createTokenWrap", function () {
    it("signature sender error", async function () {
        const info = await loadFixture(deployAllContract);

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
                specialBegenAmount: 0
            },
            deadline: deadline,
            nftPrice: 0,
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );


        // createTokenWrap
        await expect(
            info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature)
        ).revertedWith("VSE");
    });

    it("signature info error", async function () {
        const info = await loadFixture(deployAllContract);

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
                specialBegenAmount: 0
            },
            deadline: deadline,
            nftPrice: 1,
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice - 1, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );


        // createTokenWrap
        await expect(
            info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature)
        ).revertedWith("VSE");
    });

    it("signatureAddress error", async function () {
        const info = await loadFixture(deployAllContract);

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
                specialBegenAmount: 0
            },
            deadline: deadline,
            nftPrice: 0,
        };
        let signature = await info.deployWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );


        // createTokenWrap
        await expect(
            info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature)
        ).revertedWith("VSE");

        await info.degenGate.setSignatureAddress(info.deployWallet.address)

        await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature)

    });

    it("deadline error", async function () {
        const info = await loadFixture(deployAllContract);

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp - 60 * 60

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
                specialBegenAmount: 0
            },
            deadline: deadline,
            nftPrice: 0,
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );


        // createTokenWrap
        await expect(
            info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature)
        ).revertedWith("CTE");
    });

    it("free | no input | tid == cid", async function () {
        const info = await loadFixture(deployAllContract);

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
                specialBegenAmount: 0
            },
            deadline: deadline,
            nftPrice: 0,
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );

        let deployWallet_begen_1 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_1 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_1 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(0)

        // createTokenWrap
        await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(2)

        expect(await info.publicNFT.ownerOf(1)).eq(info.deployWallet.address)
        expect(await info.publicNFT.ownerOf(2)).eq(info.deployWallet.address)

        let deployWallet_begen_2 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_2 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_2 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_2 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(deployWallet_begen_2).eq(deployWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(degenGateFundRecipientWallet_begen_2).eq(degenGateFundRecipientWallet_begen_1).eq(0)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(deployWallet_degen_2).eq(deployWallet_degen_1)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(degenGateFundRecipientWallet_degen_2).eq(degenGateFundRecipientWallet_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)

        await expect(
            info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature)
        ).revertedWith("TE");

    });

    it("free | no input | tid != cid", async function () {
        const info = await loadFixture(deployAllContract);

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        // create token
        let params = {
            info: {
                tid: "a",
                tName: "a",
                cid: "ac",
                cName: "ac",
                followers: 123,
                omf: 2212,
            },
            wrap: {
                degenAmount: 0,
                specialBegenAmount: 0
            },
            deadline: deadline,
            nftPrice: 0,
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );

        let deployWallet_begen_1 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_1 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_1 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(0)

        // createTokenWrap
        await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(2)

        expect(await info.publicNFT.ownerOf(1)).eq(info.deployWallet.address)
        expect(await info.publicNFT.ownerOf(2)).eq(await info.degenGateNFTClaim.getAddress())

        let info1 = await info.publicNFT.tokenIdToInfo(1)
        expect(info1.tid).eq(params.info.tid)
        expect(info1.percent).eq(5000)

        let info2 = await info.publicNFT.tokenIdToInfo(2)
        expect(info2.tid).eq(params.info.tid)
        expect(info2.percent).eq(95000)

        let deployWallet_begen_2 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_2 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_2 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_2 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(deployWallet_begen_2).eq(deployWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(degenGateFundRecipientWallet_begen_2).eq(degenGateFundRecipientWallet_begen_1).eq(0)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(deployWallet_degen_2).eq(deployWallet_degen_1)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(degenGateFundRecipientWallet_degen_2).eq(degenGateFundRecipientWallet_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)

        await expect(
            info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature)
        ).revertedWith("TE");

    });

    it("free | have input", async function () {
        const info = await loadFixture(deployAllContract);
        await info.degenGateVault.addApproveDegen();

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
                degenAmount: 123,
                specialBegenAmount: 456
            },
            deadline: deadline,
            nftPrice: 0,
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );

        let deployWallet_begen_1 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_1 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_1 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(0)

        // createTokenWrap
        await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(2)

        let deployWallet_begen_2 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_2 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_2 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_2 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(deployWallet_begen_2).eq(deployWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(degenGateFundRecipientWallet_begen_2).eq(degenGateFundRecipientWallet_begen_1).eq(0)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(deployWallet_degen_2).eq(deployWallet_degen_1)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(degenGateFundRecipientWallet_degen_2).eq(degenGateFundRecipientWallet_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("only degen | degen > need", async function () {
        const info = await loadFixture(deployAllContract);
        await info.degenGateVault.addApproveDegen();

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
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(101),
                specialBegenAmount: 0
            },
            deadline: deadline,
            nftPrice: BigInt(10) ** BigInt(18) * BigInt(100),
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );

        let deployWallet_begen_1 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_1 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_1 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(0)

        // createTokenWrap
        await info.mockDegen.approve(await info.degenGate.getAddress(), MAX_UINT256)
        await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

        expect(await info.begen.totalSupply()).eq(params.nftPrice);
        expect(await info.publicNFT.totalSupply()).eq(2)

        let deployWallet_begen_2 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_2 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_2 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_2 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(deployWallet_begen_2).eq(deployWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(degenGateFundRecipientWallet_begen_2).eq(degenGateFundRecipientWallet_begen_1 + params.nftPrice)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(deployWallet_degen_2).eq(deployWallet_degen_1 - params.nftPrice)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(degenGateFundRecipientWallet_degen_2).eq(degenGateFundRecipientWallet_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + params.nftPrice)
    });

    it("only degen | degen eq need", async function () {
        const info = await loadFixture(deployAllContract);
        await info.degenGateVault.addApproveDegen();

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
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(100),
                specialBegenAmount: 0
            },
            deadline: deadline,
            nftPrice: BigInt(10) ** BigInt(18) * BigInt(100),
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );

        let deployWallet_begen_1 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_1 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_1 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(0)

        // createTokenWrap
        await info.mockDegen.approve(await info.degenGate.getAddress(), MAX_UINT256)
        await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

        expect(await info.begen.totalSupply()).eq(params.nftPrice);
        expect(await info.publicNFT.totalSupply()).eq(2)

        let deployWallet_begen_2 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_2 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_2 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_2 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(deployWallet_begen_2).eq(deployWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(degenGateFundRecipientWallet_begen_2).eq(degenGateFundRecipientWallet_begen_1 + params.nftPrice)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(deployWallet_degen_2).eq(deployWallet_degen_1 - params.nftPrice)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(degenGateFundRecipientWallet_degen_2).eq(degenGateFundRecipientWallet_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + params.nftPrice)
    });

    it("only degen | degen < need", async function () {
        const info = await loadFixture(deployAllContract);
        await info.degenGateVault.addApproveDegen();

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
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(99),
                specialBegenAmount: 0
            },
            deadline: deadline,
            nftPrice: BigInt(10) ** BigInt(18) * BigInt(100),
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );

        // createTokenWrap
        await info.mockDegen.approve(await info.degenGate.getAddress(), MAX_UINT256)
        await expect(
            info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature)
        ).revertedWith("PE");
    });

    it("only spec begen | spec begen > need", async function () {
        const info = await loadFixture(deployAllContract);

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
                specialBegenAmount: BigInt(10) ** BigInt(18) * BigInt(101)
            },
            deadline: deadline,
            nftPrice: BigInt(10) ** BigInt(18) * BigInt(100),
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );

        let deployWallet_begen_1 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_1 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_1 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(0)

        // createTokenWrap
        await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

        expect(await info.begen.totalSupply()).eq(params.nftPrice);
        expect(await info.publicNFT.totalSupply()).eq(2)

        let deployWallet_begen_2 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_2 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_2 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_2 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(deployWallet_begen_2).eq(deployWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(degenGateFundRecipientWallet_begen_2).eq(degenGateFundRecipientWallet_begen_1 + params.nftPrice)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(deployWallet_degen_2).eq(deployWallet_degen_1)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(degenGateFundRecipientWallet_degen_2).eq(degenGateFundRecipientWallet_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("only spec begen | spec begen eq need", async function () {
        const info = await loadFixture(deployAllContract);

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
                specialBegenAmount: BigInt(10) ** BigInt(18) * BigInt(100)
            },
            deadline: deadline,
            nftPrice: BigInt(10) ** BigInt(18) * BigInt(100),
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );

        let deployWallet_begen_1 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_1 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_1 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(0)

        // createTokenWrap
        await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

        expect(await info.begen.totalSupply()).eq(params.nftPrice);
        expect(await info.publicNFT.totalSupply()).eq(2)

        let deployWallet_begen_2 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_2 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_2 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_2 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(deployWallet_begen_2).eq(deployWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(degenGateFundRecipientWallet_begen_2).eq(degenGateFundRecipientWallet_begen_1 + params.nftPrice)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(deployWallet_degen_2).eq(deployWallet_degen_1)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(degenGateFundRecipientWallet_degen_2).eq(degenGateFundRecipientWallet_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("only spec begen | spec begen < need", async function () {
        const info = await loadFixture(deployAllContract);

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
                specialBegenAmount: BigInt(10) ** BigInt(18) * BigInt(99)
            },
            deadline: deadline,
            nftPrice: BigInt(10) ** BigInt(18) * BigInt(100),
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );


        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(0)

        // createTokenWrap
        await expect(
            info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature)
        ).revertedWith("PE");

    });

    it("degen and spec begen | spec begen > need", async function () {
        const info = await loadFixture(deployAllContract);

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
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(10),
                specialBegenAmount: BigInt(10) ** BigInt(18) * BigInt(101)
            },
            deadline: deadline,
            nftPrice: BigInt(10) ** BigInt(18) * BigInt(100),
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );

        let deployWallet_begen_1 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_1 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_1 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(0)

        // createTokenWrap
        await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

        expect(await info.begen.totalSupply()).eq(params.nftPrice);
        expect(await info.publicNFT.totalSupply()).eq(2)

        let deployWallet_begen_2 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_2 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_2 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_2 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(deployWallet_begen_2).eq(deployWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(degenGateFundRecipientWallet_begen_2).eq(degenGateFundRecipientWallet_begen_1 + params.nftPrice)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(deployWallet_degen_2).eq(deployWallet_degen_1)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(degenGateFundRecipientWallet_degen_2).eq(degenGateFundRecipientWallet_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("degen and spec begen | spec begen eq need", async function () {
        const info = await loadFixture(deployAllContract);

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
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(10),
                specialBegenAmount: BigInt(10) ** BigInt(18) * BigInt(100)
            },
            deadline: deadline,
            nftPrice: BigInt(10) ** BigInt(18) * BigInt(100),
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );

        let deployWallet_begen_1 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_1 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_1 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(0)

        // createTokenWrap
        await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

        expect(await info.begen.totalSupply()).eq(params.nftPrice);
        expect(await info.publicNFT.totalSupply()).eq(2)

        let deployWallet_begen_2 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_2 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_2 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_2 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(deployWallet_begen_2).eq(deployWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(degenGateFundRecipientWallet_begen_2).eq(degenGateFundRecipientWallet_begen_1 + params.nftPrice)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(deployWallet_degen_2).eq(deployWallet_degen_1)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(degenGateFundRecipientWallet_degen_2).eq(degenGateFundRecipientWallet_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("degen and spec begen | spec begen < need | + degen > need", async function () {
        const info = await loadFixture(deployAllContract);

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
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(10),
                specialBegenAmount: BigInt(10) ** BigInt(18) * BigInt(91)
            },
            deadline: deadline,
            nftPrice: BigInt(10) ** BigInt(18) * BigInt(100),
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );

        let deployWallet_begen_1 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_1 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_1 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(0)

        // createTokenWrap
        await info.mockDegen.approve(await info.degenGate.getAddress(), MAX_UINT256)
        await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

        expect(await info.begen.totalSupply()).eq(params.nftPrice);
        expect(await info.publicNFT.totalSupply()).eq(2)

        let deployWallet_begen_2 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_2 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_2 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_2 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(deployWallet_begen_2).eq(deployWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(degenGateFundRecipientWallet_begen_2).eq(degenGateFundRecipientWallet_begen_1 + params.nftPrice)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(deployWallet_degen_2).eq(deployWallet_degen_1 - (params.nftPrice - params.wrap.specialBegenAmount))
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(degenGateFundRecipientWallet_degen_2).eq(degenGateFundRecipientWallet_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + (params.nftPrice - params.wrap.specialBegenAmount))
    });
    it("degen and spec begen | spec begen < need | + degen eq need", async function () {
        const info = await loadFixture(deployAllContract);

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
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(10),
                specialBegenAmount: BigInt(10) ** BigInt(18) * BigInt(90)
            },
            deadline: deadline,
            nftPrice: BigInt(10) ** BigInt(18) * BigInt(100),
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );

        let deployWallet_begen_1 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_1 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_1 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(0)

        // createTokenWrap
        await info.mockDegen.approve(await info.degenGate.getAddress(), MAX_UINT256)
        await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

        expect(await info.begen.totalSupply()).eq(params.nftPrice);
        expect(await info.publicNFT.totalSupply()).eq(2)

        let deployWallet_begen_2 = await info.begen.balanceOf(info.deployWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_begen_2 = await info.begen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let deployWallet_degen_2 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let degenGateFundRecipientWallet_degen_2 = await info.mockDegen.balanceOf(info.degenGateFundRecipientWallet.address);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(deployWallet_begen_2).eq(deployWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(degenGateFundRecipientWallet_begen_2).eq(degenGateFundRecipientWallet_begen_1 + params.nftPrice)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(deployWallet_degen_2).eq(deployWallet_degen_1 - (params.nftPrice - params.wrap.specialBegenAmount))
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(degenGateFundRecipientWallet_degen_2).eq(degenGateFundRecipientWallet_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + (params.nftPrice - params.wrap.specialBegenAmount))
    });

    it("degen and spec begen | spec begen < need | + degen < need", async function () {
        const info = await loadFixture(deployAllContract);

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
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(10),
                specialBegenAmount: BigInt(10) ** BigInt(18) * BigInt(89)
            },
            deadline: deadline,
            nftPrice: BigInt(10) ** BigInt(18) * BigInt(100),
        };
        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
                            "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );

        expect(await info.begen.totalSupply()).eq(0);
        expect(await info.publicNFT.totalSupply()).eq(0)

        // createTokenWrap
        await info.mockDegen.approve(await info.degenGate.getAddress(), MAX_UINT256)
        await expect(
            info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature)
        ).revertedWith("PE");

    });


});
