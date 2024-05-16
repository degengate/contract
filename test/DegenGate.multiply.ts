import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { AllContractInfo, deployAllContract, MAX_UINT256 } from "./shared/deploy";


async function createToken(info: AllContractInfo): Promise<string> {
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

    // createTokenWrap
    await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

    return params.info.tid;
}

const multiply_1000_BegenAmount = BigInt("11001100110011001100");

describe("DegenGate.multiply", function () {

    it("signature sender error", async function () {
        const info = await loadFixture(deployAllContract);

        const tid = await createToken(info)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: 0,
                specialBegenAmount: multiply_1000_BegenAmount * BigInt(2)
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


        await expect(info.degenGate.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )).revertedWith("VSE");

    });

    it("signature info error", async function () {
        const info = await loadFixture(deployAllContract);

        const tid = await createToken(info)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: 0,
                specialBegenAmount: multiply_1000_BegenAmount * BigInt(2)
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
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount + BigInt(10), paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );


        await expect(info.degenGate.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )).revertedWith("VSE");

    });

    it("signatureAddress error", async function () {
        const info = await loadFixture(deployAllContract);

        const tid = await createToken(info)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: 0,
                specialBegenAmount: multiply_1000_BegenAmount * BigInt(2)
            },
            deadline: deadline,
        }

        let paramsMultiplySignature = await info.deployWallet.signMessage(
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
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );


        await expect(info.degenGate.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )).revertedWith("VSE");

        await info.degenGate.setSignatureAddress(info.deployWallet.address);
        await info.degenGate.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )
    });

    it("deadline error", async function () {
        const info = await loadFixture(deployAllContract);

        const tid = await createToken(info)

        // multiply
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp - 60 * 60

        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: 0,
                specialBegenAmount: multiply_1000_BegenAmount * BigInt(2)
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
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );


        await expect(info.degenGate.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )).revertedWith("CTE");

    });

    it("only spec begen | > need", async function () {
        const info = await loadFixture(deployAllContract);

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
                specialBegenAmount: multiply_1000_BegenAmount * BigInt(2)
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
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_begen_1 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_1 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_1 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_1 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_BegenAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        let userWallet_begen_2 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_2 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_2 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_2 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_begen_2).eq(userWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(market_begen_2).eq(market_begen_1).eq(0)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1) + (nftOnwer_begen_2 - nftOnwer_begen_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1).eq(0)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("only spec begen | eq need", async function () {
        const info = await loadFixture(deployAllContract);

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
                specialBegenAmount: multiply_1000_BegenAmount
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
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_begen_1 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_1 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_1 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_1 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_BegenAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        let userWallet_begen_2 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_2 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_2 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_2 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_begen_2).eq(userWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(market_begen_2).eq(market_begen_1).eq(0)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1) + (nftOnwer_begen_2 - nftOnwer_begen_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1).eq(0)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("only spec begen | < need", async function () {
        const info = await loadFixture(deployAllContract);

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
                specialBegenAmount: multiply_1000_BegenAmount - BigInt(1)
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
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        expect(await info.begen.totalSupply()).eq(0);

        await expect(
            info.degenGate.connect(info.userWallet).multiply(
                paramsMultiply.tid,
                paramsMultiply.multiplyAmount,
                paramsMultiply.wrap,
                paramsMultiply.deadline,
                paramsMultiplySignature
            )
        ).revertedWith("ERC20: transfer amount exceeds balance");

    });

    it("only degen | > need", async function () {
        const info = await loadFixture(deployAllContract);
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
                degenAmount: multiply_1000_BegenAmount * BigInt(2),
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
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_begen_1 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_1 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_1 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_1 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_BegenAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        let userWallet_begen_2 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_2 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_2 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_2 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_begen_2).eq(userWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(market_begen_2).eq(market_begen_1).eq(0)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1) + (nftOnwer_begen_2 - nftOnwer_begen_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1 - multiplyResult.payTokenAmount)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + multiplyResult.payTokenAmount)
    });

    it("only degen | eq need", async function () {
        const info = await loadFixture(deployAllContract);
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
                degenAmount: multiply_1000_BegenAmount,
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
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_begen_1 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_1 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_1 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_1 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_BegenAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        let userWallet_begen_2 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_2 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_2 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_2 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_begen_2).eq(userWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(market_begen_2).eq(market_begen_1).eq(0)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1) + (nftOnwer_begen_2 - nftOnwer_begen_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1 - multiplyResult.payTokenAmount)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + multiplyResult.payTokenAmount)
    });

    it("only degen | < need", async function () {
        const info = await loadFixture(deployAllContract);
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
                degenAmount: multiply_1000_BegenAmount - BigInt(1),
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
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        expect(await info.begen.totalSupply()).eq(0);

        await expect(info.degenGate.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )).revertedWith("ERC20: transfer amount exceeds balance")


    });

    it("have spec begen and degen | spec begen > need", async function () {
        const info = await loadFixture(deployAllContract);
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
                degenAmount: multiply_1000_BegenAmount / BigInt(3),
                specialBegenAmount: multiply_1000_BegenAmount * BigInt(2)
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
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_begen_1 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_1 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_1 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_1 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_BegenAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        let userWallet_begen_2 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_2 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_2 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_2 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_begen_2).eq(userWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(market_begen_2).eq(market_begen_1).eq(0)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1) + (nftOnwer_begen_2 - nftOnwer_begen_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("have spec begen and degen | spec begen eq need", async function () {
        const info = await loadFixture(deployAllContract);
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
                degenAmount: multiply_1000_BegenAmount / BigInt(3),
                specialBegenAmount: multiply_1000_BegenAmount
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
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_begen_1 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_1 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_1 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_1 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_BegenAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        let userWallet_begen_2 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_2 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_2 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_2 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_begen_2).eq(userWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(market_begen_2).eq(market_begen_1).eq(0)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1) + (nftOnwer_begen_2 - nftOnwer_begen_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("have spec begen and degen | spec begen < need | + degen > need", async function () {
        const info = await loadFixture(deployAllContract);
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
                specialBegenAmount: multiply_1000_BegenAmount - BigInt(10) ** BigInt(18) * BigInt(1)
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
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_begen_1 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_1 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_1 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_1 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_BegenAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        let userWallet_begen_2 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_2 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_2 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_2 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_begen_2).eq(userWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(market_begen_2).eq(market_begen_1).eq(0)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1) + (nftOnwer_begen_2 - nftOnwer_begen_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1 - (multiplyResult.payTokenAmount - paramsMultiply.wrap.specialBegenAmount))
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + (multiplyResult.payTokenAmount - paramsMultiply.wrap.specialBegenAmount))
    });

    it("have spec begen and degen | spec begen < need | + degen eq need", async function () {
        const info = await loadFixture(deployAllContract);
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
                specialBegenAmount: multiply_1000_BegenAmount - BigInt(10) ** BigInt(18) * BigInt(1)
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
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        let userWallet_begen_1 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_1 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_1 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_1 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_1 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(0);

        await info.degenGate.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_BegenAmount)
        expect(multiplyResult.nftTokenId).eq(1)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        let userWallet_begen_2 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_2 = await info.begen.balanceOf(await info.market.getAddress());
        let nftOnwer_begen_2 = await info.begen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_begen_2 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let nftOnwer_degen_2 = await info.mockDegen.balanceOf(nftOnwer);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_begen_2).eq(userWallet_begen_1).eq(0)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(market_begen_2).eq(market_begen_1).eq(0)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1) + (nftOnwer_begen_2 - nftOnwer_begen_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1 - (multiplyResult.payTokenAmount - paramsMultiply.wrap.specialBegenAmount))
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + (multiplyResult.payTokenAmount - paramsMultiply.wrap.specialBegenAmount))
    });

    it("have spec begen and degen | spec begen < need | + degen < need", async function () {
        const info = await loadFixture(deployAllContract);
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
                specialBegenAmount: multiply_1000_BegenAmount - BigInt(10) ** BigInt(18) * BigInt(2)
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
                        [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        expect(await info.begen.totalSupply()).eq(0);

        await expect(info.degenGate.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.deadline,
            paramsMultiplySignature
        )).revertedWith("ERC20: transfer amount exceeds balance")

    });
});

