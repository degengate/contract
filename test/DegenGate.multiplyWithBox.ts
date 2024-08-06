import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { DegenGateAllContractInfo } from "./shared/deploy_degen_gate";
import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";

async function createToken(info: DegenGateAllContractInfo): Promise<string> {
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
            specialPointAmount: 0
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

    // createTokenWrap
    await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

    return params.info.tid;
}

const multiply_1000_PointAmount = BigInt("11001100110011001100");

describe("DegenGate.multiplyWithBox", function () {

    it("signature sender error", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        const tid = await createToken(info)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: 0,
                specialPointAmount: multiply_1000_PointAmount * BigInt(2)
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(2),
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
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.deployWallet.address],
                    ),
                ),
            ),
        );


        await expect(info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )).revertedWith("VSE");

    });

    it("signature info error", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        const tid = await createToken(info)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: 0,
                specialPointAmount: multiply_1000_PointAmount * BigInt(2)
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(2),
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
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount + BigInt(10), paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );


        await expect(info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount * BigInt(2),
            paramsMultiply.deadline,
            paramsMultiplySignature
        )).revertedWith("VSE");

    });

    it("signatureAddress error", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        const tid = await createToken(info)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: 0,
                specialPointAmount: multiply_1000_PointAmount * BigInt(2)
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(2),
            deadline: deadline,
        }

        let paramsMultiplySignature = await info.deployWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "string",
                            "uint256",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );


        await expect(info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )).revertedWith("VSE");

        await info.degenGate.setSignatureAddress(info.deployWallet.address);
        await info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )
    });

    it("deadline error", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        const tid = await createToken(info)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp - 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: 0,
                specialPointAmount: multiply_1000_PointAmount * BigInt(2)
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(2),
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
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );


        await expect(info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )).revertedWith("CTE");

    });

    it("only spec point | > need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        const tid = await createToken(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: 0,
                specialPointAmount: multiply_1000_PointAmount * BigInt(2)
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(2),
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
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiplyWithBox.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_point_1 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_1 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_1 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_1 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_1 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_1 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.point.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_PointAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect((await info.mortgageNFT.info(1)).amount).eq(paramsMultiply.multiplyAmount)
        expect(await info.mortgageNFT.ownerOf(1)).eq(info.userWallet.address);

        expect(await info.point.totalSupply()).eq(multiply_1000_PointAmount);

        let userWallet_point_2 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_2 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_2 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_2 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_2 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_2 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_point_2).eq(userWallet_point_1).eq(0)
        expect(degenGate_point_2).eq(degenGate_point_1).eq(0)
        expect(market_point_2).eq(market_point_1).eq(0)
        expect(degenGateVault_point_2).eq(degenGateVault_point_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_point_2 - nftOnwer_point_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) + (nftOnwer_point_2 - nftOnwer_point_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1).eq(0)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("only spec point | eq need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        const tid = await createToken(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: 0,
                specialPointAmount: multiply_1000_PointAmount
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(2),
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
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiplyWithBox.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_point_1 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_1 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_1 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_1 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_1 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_1 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.point.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_PointAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect(await info.point.totalSupply()).eq(multiply_1000_PointAmount);

        let userWallet_point_2 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_2 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_2 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_2 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_2 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_2 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_point_2).eq(userWallet_point_1).eq(0)
        expect(degenGate_point_2).eq(degenGate_point_1).eq(0)
        expect(market_point_2).eq(market_point_1).eq(0)
        expect(degenGateVault_point_2).eq(degenGateVault_point_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_point_2 - nftOnwer_point_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) + (nftOnwer_point_2 - nftOnwer_point_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1).eq(0)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("only spec point | < need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        const tid = await createToken(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: 0,
                specialPointAmount: multiply_1000_PointAmount - BigInt(1)
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(2),
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
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        expect(await info.point.totalSupply()).eq(0);

        await expect(
            info.degenGate.connect(info.userWallet).multiplyWithBox(
                paramsMultiply.tid,
                paramsMultiply.multiplyAmount,
                paramsMultiply.wrap,
                paramsMultiply.boxId,
                paramsMultiply.boxTotalAmount,
                paramsMultiply.deadline,
                paramsMultiplySignature
            )
        ).revertedWithCustomError(info.point, "ERC20InsufficientBalance")

    });

    it("only degen | > need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const tid = await createToken(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: multiply_1000_PointAmount * BigInt(2),
                specialPointAmount: 0
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(2),
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
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiplyWithBox.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_point_1 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_1 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_1 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_1 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_1 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_1 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.point.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_PointAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect(await info.point.totalSupply()).eq(multiply_1000_PointAmount);

        let userWallet_point_2 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_2 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_2 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_2 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_2 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_2 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_point_2).eq(userWallet_point_1).eq(0)
        expect(degenGate_point_2).eq(degenGate_point_1).eq(0)
        expect(market_point_2).eq(market_point_1).eq(0)
        expect(degenGateVault_point_2).eq(degenGateVault_point_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_point_2 - nftOnwer_point_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) + (nftOnwer_point_2 - nftOnwer_point_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1 - multiplyResult.payTokenAmount)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + multiplyResult.payTokenAmount)
    });

    it("only degen | eq need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const tid = await createToken(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: multiply_1000_PointAmount,
                specialPointAmount: 0
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(2),
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
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiplyWithBox.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_point_1 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_1 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_1 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_1 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_1 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_1 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.point.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_PointAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect(await info.point.totalSupply()).eq(multiply_1000_PointAmount);

        let userWallet_point_2 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_2 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_2 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_2 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_2 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_2 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_point_2).eq(userWallet_point_1).eq(0)
        expect(degenGate_point_2).eq(degenGate_point_1).eq(0)
        expect(market_point_2).eq(market_point_1).eq(0)
        expect(degenGateVault_point_2).eq(degenGateVault_point_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_point_2 - nftOnwer_point_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) + (nftOnwer_point_2 - nftOnwer_point_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1 - multiplyResult.payTokenAmount)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + multiplyResult.payTokenAmount)
    });

    it("only degen | < need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const tid = await createToken(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: multiply_1000_PointAmount - BigInt(1),
                specialPointAmount: 0
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(2),
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
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        expect(await info.point.totalSupply()).eq(0);

        await expect(info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )).revertedWithCustomError(info.mockDegen, "ERC20InsufficientBalance")


    });

    it("have spec point and degen | spec point > need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const tid = await createToken(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: multiply_1000_PointAmount / BigInt(3),
                specialPointAmount: multiply_1000_PointAmount * BigInt(2)
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(2),
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
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiplyWithBox.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_point_1 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_1 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_1 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_1 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_1 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_1 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.point.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_PointAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect(await info.point.totalSupply()).eq(multiply_1000_PointAmount);

        let userWallet_point_2 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_2 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_2 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_2 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_2 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_2 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_point_2).eq(userWallet_point_1).eq(0)
        expect(degenGate_point_2).eq(degenGate_point_1).eq(0)
        expect(market_point_2).eq(market_point_1).eq(0)
        expect(degenGateVault_point_2).eq(degenGateVault_point_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_point_2 - nftOnwer_point_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) + (nftOnwer_point_2 - nftOnwer_point_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("have spec point and degen | spec point eq need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const tid = await createToken(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: multiply_1000_PointAmount / BigInt(3),
                specialPointAmount: multiply_1000_PointAmount
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(2),
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
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiplyWithBox.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_point_1 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_1 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_1 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_1 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_1 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_1 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.point.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_PointAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect(await info.point.totalSupply()).eq(multiply_1000_PointAmount);

        let userWallet_point_2 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_2 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_2 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_2 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_2 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_2 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_point_2).eq(userWallet_point_1).eq(0)
        expect(degenGate_point_2).eq(degenGate_point_1).eq(0)
        expect(market_point_2).eq(market_point_1).eq(0)
        expect(degenGateVault_point_2).eq(degenGateVault_point_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_point_2 - nftOnwer_point_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) + (nftOnwer_point_2 - nftOnwer_point_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("have spec point and degen | spec point < need | + degen > need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const tid = await createToken(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(2),
                specialPointAmount: multiply_1000_PointAmount - BigInt(10) ** BigInt(18) * BigInt(1)
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(2),
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
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiplyWithBox.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_point_1 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_1 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_1 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_1 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_1 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_1 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.point.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_PointAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect(await info.point.totalSupply()).eq(multiply_1000_PointAmount);

        let userWallet_point_2 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_2 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_2 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_2 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_2 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_2 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_point_2).eq(userWallet_point_1).eq(0)
        expect(degenGate_point_2).eq(degenGate_point_1).eq(0)
        expect(market_point_2).eq(market_point_1).eq(0)
        expect(degenGateVault_point_2).eq(degenGateVault_point_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_point_2 - nftOnwer_point_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) + (nftOnwer_point_2 - nftOnwer_point_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1 - (multiplyResult.payTokenAmount - paramsMultiply.wrap.specialPointAmount))
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + (multiplyResult.payTokenAmount - paramsMultiply.wrap.specialPointAmount))
    });

    it("have spec point and degen | spec point < need | + degen eq need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const tid = await createToken(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(1),
                specialPointAmount: multiply_1000_PointAmount - BigInt(10) ** BigInt(18) * BigInt(1)
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(2),
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
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiplyWithBox.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_point_1 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_1 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_1 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_1 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_1 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_1 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.point.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_PointAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect(await info.point.totalSupply()).eq(multiply_1000_PointAmount);

        let userWallet_point_2 = await info.point.balanceOf(info.userWallet.address);
        let degenGate_point_2 = await info.point.balanceOf(await info.degenGate.getAddress());
        let market_point_2 = await info.point.balanceOf(await info.market.getAddress());
        let nftOnwer_point_2 = await info.point.balanceOf(nftOnwer);
        let mortgageFeeRecipient_point_2 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_2 = await info.point.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_point_2).eq(userWallet_point_1).eq(0)
        expect(degenGate_point_2).eq(degenGate_point_1).eq(0)
        expect(market_point_2).eq(market_point_1).eq(0)
        expect(degenGateVault_point_2).eq(degenGateVault_point_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_point_2 - nftOnwer_point_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) + (nftOnwer_point_2 - nftOnwer_point_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1 - (multiplyResult.payTokenAmount - paramsMultiply.wrap.specialPointAmount))
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + (multiplyResult.payTokenAmount - paramsMultiply.wrap.specialPointAmount))
    });

    it("have spec point and degen | spec point < need | + degen < need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const tid = await createToken(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(1),
                specialPointAmount: multiply_1000_PointAmount - BigInt(10) ** BigInt(18) * BigInt(2)
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(2),
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
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        expect(await info.point.totalSupply()).eq(0);

        await expect(info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )).revertedWithCustomError(info.point, "ERC20InsufficientBalance")

    });

    it("only spec point | box", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        const tid = await createToken(info)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
            wrap: {
                degenAmount: 0,
                specialPointAmount: multiply_1000_PointAmount
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(3),
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
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(await info.degenGate.boxUsed(paramsMultiply.boxId)).eq(paramsMultiply.wrap.specialPointAmount)

        // multiply 2
        const currentTimestamp2 = Math.floor(new Date().getTime() / 1000);
        const deadline2 = currentTimestamp2 + 60 * 60

        let paramsMultiply2 = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
            wrap: {
                degenAmount: 0,
                specialPointAmount: multiply_1000_PointAmount
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(3),
            deadline: deadline2,
        }

        let paramsMultiplySignature2 = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "string",
                            "uint256",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply2.tid, paramsMultiply2.multiplyAmount, paramsMultiply2.wrap, paramsMultiply2.boxId, paramsMultiply2.boxTotalAmount, paramsMultiply2.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.degenGate.connect(info.userWallet).multiplyWithBox(
            paramsMultiply2.tid,
            paramsMultiply2.multiplyAmount,
            paramsMultiply2.wrap,
            paramsMultiply2.boxId,
            paramsMultiply2.boxTotalAmount,
            paramsMultiply2.deadline,
            paramsMultiplySignature2
        )

        expect(await info.degenGate.boxUsed(paramsMultiply.boxId)).eq(
            paramsMultiply.wrap.specialPointAmount + paramsMultiply2.wrap.specialPointAmount
        )


        // multiply 3
        const currentTimestamp3 = Math.floor(new Date().getTime() / 1000);
        const deadline3 = currentTimestamp3 + 60 * 60

        let paramsMultiply3 = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
            wrap: {
                degenAmount: 0,
                specialPointAmount: multiply_1000_PointAmount + BigInt(1)
            },
            boxId: 100,
            boxTotalAmount: multiply_1000_PointAmount * BigInt(3),
            deadline: deadline3,
        }

        let paramsMultiplySignature3 = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "string",
                            "uint256",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply3.tid, paramsMultiply3.multiplyAmount, paramsMultiply3.wrap, paramsMultiply2.boxId, paramsMultiply3.boxTotalAmount, paramsMultiply3.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await expect(
            info.degenGate.connect(info.userWallet).multiplyWithBox(
                paramsMultiply3.tid,
                paramsMultiply3.multiplyAmount,
                paramsMultiply3.wrap,
                paramsMultiply3.boxId,
                paramsMultiply3.boxTotalAmount,
                paramsMultiply3.deadline,
                paramsMultiplySignature3
            )
        ).revertedWith("BE")

        expect(await info.degenGate.boxUsed(paramsMultiply.boxId)).eq(
            paramsMultiply.wrap.specialPointAmount + paramsMultiply2.wrap.specialPointAmount
        )
    });
});

