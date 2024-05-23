import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { DegenGateAllContractInfo } from "./shared/deploy_degen_gate";
import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";

const multiply_1000_BegenAmount = BigInt("11001100110011001100");
const b1000_multiplyAdd_1000_BegenAmount = BigInt("11003300770165034105")

async function createTokenAndMultiply_1000(info: DegenGateAllContractInfo): Promise<{ tid: string, tokenId: bigint }> {
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

    // multiply
    let paramsMultiply = {
        tid: params.info.tid,
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

    const result = await info.degenGate.connect(info.userWallet).multiply.staticCall(
        paramsMultiply.tid,
        paramsMultiply.multiplyAmount,
        paramsMultiply.wrap,
        paramsMultiply.deadline,
        paramsMultiplySignature
    )

    await info.degenGate.connect(info.userWallet).multiply(
        paramsMultiply.tid,
        paramsMultiply.multiplyAmount,
        paramsMultiply.wrap,
        paramsMultiply.deadline,
        paramsMultiplySignature
    )

    return {
        tid: params.info.tid,
        tokenId: result.nftTokenId,
    };
}

describe("DegenGate.multiply.exists", function () {
    it("only spec begen | > need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        const cm_info = await createTokenAndMultiply_1000(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiplyAdd
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiplyAdd = {
            tid: cm_info.tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: 0,
                specialBegenAmount: b1000_multiplyAdd_1000_BegenAmount * BigInt(2)
            },
            deadline: deadline,
        }

        let paramsMultiplyAddSignature = await info.signatureWallet.signMessage(
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
                        [cm_info.tid, paramsMultiplyAdd.multiplyAmount, paramsMultiplyAdd.wrap, paramsMultiplyAdd.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        let multiplyAddResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
        )
        expect(multiplyAddResult.nftTokenId).eq(cm_info.tokenId);

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

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        let oldAmount = (await info.mortgageNFT.info(cm_info.tokenId)).amount;
        expect(oldAmount).gt(0)

        await info.degenGate.connect(info.userWallet).multiply(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
        )

        expect(multiplyAddResult.payTokenAmount).eq(b1000_multiplyAdd_1000_BegenAmount)

        expect((await info.mortgageNFT.info(cm_info.tokenId)).amount).eq(
            oldAmount + paramsMultiplyAdd.multiplyAmount
        )

        expect(await info.mortgageNFT.ownerOf(cm_info.tokenId)).eq(info.userWallet.address);

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount + b1000_multiplyAdd_1000_BegenAmount);

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

        expect(paramsMultiplyAdd.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiplyAdd.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyAddResult.payTokenAmount).eq(
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
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        const cm_info = await createTokenAndMultiply_1000(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiplyAdd
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiplyAdd = {
            tid: cm_info.tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: 0,
                specialBegenAmount: b1000_multiplyAdd_1000_BegenAmount
            },
            deadline: deadline,
        }

        let paramsMultiplyAddSignature = await info.signatureWallet.signMessage(
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
                        [cm_info.tid, paramsMultiplyAdd.multiplyAmount, paramsMultiplyAdd.wrap, paramsMultiplyAdd.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        let multiplyAddResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
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

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        await info.degenGate.connect(info.userWallet).multiply(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
        )

        expect(multiplyAddResult.payTokenAmount).eq(b1000_multiplyAdd_1000_BegenAmount)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount + b1000_multiplyAdd_1000_BegenAmount);

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

        expect(paramsMultiplyAdd.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiplyAdd.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyAddResult.payTokenAmount).eq(
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
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        const cm_info = await createTokenAndMultiply_1000(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiplyAdd
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiplyAdd = {
            tid: cm_info.tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: 0,
                specialBegenAmount: b1000_multiplyAdd_1000_BegenAmount - BigInt(1)
            },
            deadline: deadline,
        }

        let paramsMultiplyAddSignature = await info.signatureWallet.signMessage(
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
                        [cm_info.tid, paramsMultiplyAdd.multiplyAmount, paramsMultiplyAdd.wrap, paramsMultiplyAdd.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        await expect(info.degenGate.connect(info.userWallet).multiply(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
        )).revertedWithCustomError(info.begen, "ERC20InsufficientBalance")

    });

    it("only degen | > need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const cm_info = await createTokenAndMultiply_1000(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiplyAdd
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiplyAdd = {
            tid: cm_info.tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: b1000_multiplyAdd_1000_BegenAmount * BigInt(2),
                specialBegenAmount: 0
            },
            deadline: deadline,
        }

        let paramsMultiplyAddSignature = await info.signatureWallet.signMessage(
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
                        [cm_info.tid, paramsMultiplyAdd.multiplyAmount, paramsMultiplyAdd.wrap, paramsMultiplyAdd.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiplyAdd.wrap.degenAmount);
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyAddResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
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

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        await info.degenGate.connect(info.userWallet).multiply(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
        )

        expect(multiplyAddResult.payTokenAmount).eq(b1000_multiplyAdd_1000_BegenAmount)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount + b1000_multiplyAdd_1000_BegenAmount);

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

        expect(paramsMultiplyAdd.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiplyAdd.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyAddResult.payTokenAmount).eq(
            (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1) + (nftOnwer_begen_2 - nftOnwer_begen_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1 - multiplyAddResult.payTokenAmount)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + multiplyAddResult.payTokenAmount)
    });

    it("only degen | eq need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const cm_info = await createTokenAndMultiply_1000(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiplyAdd
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiplyAdd = {
            tid: cm_info.tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: b1000_multiplyAdd_1000_BegenAmount,
                specialBegenAmount: 0
            },
            deadline: deadline,
        }

        let paramsMultiplyAddSignature = await info.signatureWallet.signMessage(
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
                        [cm_info.tid, paramsMultiplyAdd.multiplyAmount, paramsMultiplyAdd.wrap, paramsMultiplyAdd.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiplyAdd.wrap.degenAmount);
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyAddResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
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

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        await info.degenGate.connect(info.userWallet).multiply(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
        )

        expect(multiplyAddResult.payTokenAmount).eq(b1000_multiplyAdd_1000_BegenAmount)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount + b1000_multiplyAdd_1000_BegenAmount);

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

        expect(paramsMultiplyAdd.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiplyAdd.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyAddResult.payTokenAmount).eq(
            (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1) + (nftOnwer_begen_2 - nftOnwer_begen_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1 - multiplyAddResult.payTokenAmount)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + multiplyAddResult.payTokenAmount)
    });

    it("only degen | < need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const cm_info = await createTokenAndMultiply_1000(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiplyAdd
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiplyAdd = {
            tid: cm_info.tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: b1000_multiplyAdd_1000_BegenAmount - BigInt(1),
                specialBegenAmount: 0
            },
            deadline: deadline,
        }

        let paramsMultiplyAddSignature = await info.signatureWallet.signMessage(
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
                        [cm_info.tid, paramsMultiplyAdd.multiplyAmount, paramsMultiplyAdd.wrap, paramsMultiplyAdd.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiplyAdd.wrap.degenAmount);
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        await expect(info.degenGate.connect(info.userWallet).multiply(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
        )).revertedWithCustomError(info.begen, "ERC20InsufficientBalance")

    });

    it("have spec begen and degen | spec begen > need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const cm_info = await createTokenAndMultiply_1000(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiplyAdd
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiplyAdd = {
            tid: cm_info.tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(12),
                specialBegenAmount: b1000_multiplyAdd_1000_BegenAmount * BigInt(2)
            },
            deadline: deadline,
        }

        let paramsMultiplyAddSignature = await info.signatureWallet.signMessage(
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
                        [cm_info.tid, paramsMultiplyAdd.multiplyAmount, paramsMultiplyAdd.wrap, paramsMultiplyAdd.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiplyAdd.wrap.degenAmount);
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyAddResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
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

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        await info.degenGate.connect(info.userWallet).multiply(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
        )

        expect(multiplyAddResult.payTokenAmount).eq(b1000_multiplyAdd_1000_BegenAmount)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount + b1000_multiplyAdd_1000_BegenAmount);

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

        expect(paramsMultiplyAdd.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiplyAdd.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyAddResult.payTokenAmount).eq(
            (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1) + (nftOnwer_begen_2 - nftOnwer_begen_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1)
    });

    it("have spec begen and degen | spec begen eq need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const cm_info = await createTokenAndMultiply_1000(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiplyAdd
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiplyAdd = {
            tid: cm_info.tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(12),
                specialBegenAmount: b1000_multiplyAdd_1000_BegenAmount
            },
            deadline: deadline,
        }

        let paramsMultiplyAddSignature = await info.signatureWallet.signMessage(
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
                        [cm_info.tid, paramsMultiplyAdd.multiplyAmount, paramsMultiplyAdd.wrap, paramsMultiplyAdd.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiplyAdd.wrap.degenAmount);
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyAddResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
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

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        await info.degenGate.connect(info.userWallet).multiply(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
        )

        expect(multiplyAddResult.payTokenAmount).eq(b1000_multiplyAdd_1000_BegenAmount)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount + b1000_multiplyAdd_1000_BegenAmount);

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

        expect(paramsMultiplyAdd.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiplyAdd.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyAddResult.payTokenAmount).eq(
            (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1) + (nftOnwer_begen_2 - nftOnwer_begen_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1)
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1)
    });

    it("have spec begen and degen | spec begen < need | + degen > need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const cm_info = await createTokenAndMultiply_1000(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiplyAdd
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiplyAdd = {
            tid: cm_info.tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(2),
                specialBegenAmount: b1000_multiplyAdd_1000_BegenAmount - BigInt(10) ** BigInt(18) * BigInt(1)
            },
            deadline: deadline,
        }

        let paramsMultiplyAddSignature = await info.signatureWallet.signMessage(
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
                        [cm_info.tid, paramsMultiplyAdd.multiplyAmount, paramsMultiplyAdd.wrap, paramsMultiplyAdd.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiplyAdd.wrap.degenAmount);
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyAddResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
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

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        await info.degenGate.connect(info.userWallet).multiply(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
        )

        expect(multiplyAddResult.payTokenAmount).eq(b1000_multiplyAdd_1000_BegenAmount)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount + b1000_multiplyAdd_1000_BegenAmount);

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

        expect(paramsMultiplyAdd.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiplyAdd.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyAddResult.payTokenAmount).eq(
            (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1) + (nftOnwer_begen_2 - nftOnwer_begen_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1 - (multiplyAddResult.payTokenAmount - paramsMultiplyAdd.wrap.specialBegenAmount))
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + (multiplyAddResult.payTokenAmount - paramsMultiplyAdd.wrap.specialBegenAmount))
    });

    it("have spec begen and degen | spec begen < need | + degen eq need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const cm_info = await createTokenAndMultiply_1000(info)
        const nftOnwer = await info.publicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

        // multiplyAdd
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiplyAdd = {
            tid: cm_info.tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(1),
                specialBegenAmount: b1000_multiplyAdd_1000_BegenAmount - BigInt(10) ** BigInt(18) * BigInt(1)
            },
            deadline: deadline,
        }

        let paramsMultiplyAddSignature = await info.signatureWallet.signMessage(
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
                        [cm_info.tid, paramsMultiplyAdd.multiplyAmount, paramsMultiplyAdd.wrap, paramsMultiplyAdd.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiplyAdd.wrap.degenAmount);
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        let multiplyAddResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
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

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        await info.degenGate.connect(info.userWallet).multiply(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
        )

        expect(multiplyAddResult.payTokenAmount).eq(b1000_multiplyAdd_1000_BegenAmount)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount + b1000_multiplyAdd_1000_BegenAmount);

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

        expect(paramsMultiplyAdd.multiplyAmount / (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1)).eq(999)
        expect(paramsMultiplyAdd.multiplyAmount / (nftOnwer_begen_2 - nftOnwer_begen_1)).eq(99)
        expect(multiplyAddResult.payTokenAmount).eq(
            (mortgageFeeRecipient_begen_2 - mortgageFeeRecipient_begen_1) + (nftOnwer_begen_2 - nftOnwer_begen_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1 - (multiplyAddResult.payTokenAmount - paramsMultiplyAdd.wrap.specialBegenAmount))
        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOnwer_degen_2).eq(nftOnwer_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + (multiplyAddResult.payTokenAmount - paramsMultiplyAdd.wrap.specialBegenAmount))
    });

    it("have spec begen and degen | spec begen < need | + degen < need", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();

        const cm_info = await createTokenAndMultiply_1000(info)

        // multiplyAdd
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let paramsMultiplyAdd = {
            tid: cm_info.tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(1),
                specialBegenAmount: b1000_multiplyAdd_1000_BegenAmount - BigInt(10) ** BigInt(18) * BigInt(2)
            },
            deadline: deadline,
        }

        let paramsMultiplyAddSignature = await info.signatureWallet.signMessage(
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
                        [cm_info.tid, paramsMultiplyAdd.multiplyAmount, paramsMultiplyAdd.wrap, paramsMultiplyAdd.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiplyAdd.wrap.degenAmount);
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256)

        expect(await info.begen.totalSupply()).eq(multiply_1000_BegenAmount);

        await expect(info.degenGate.connect(info.userWallet).multiply(
            cm_info.tid,
            paramsMultiplyAdd.multiplyAmount,
            paramsMultiplyAdd.wrap,
            paramsMultiplyAdd.deadline,
            paramsMultiplyAddSignature
        )).revertedWithCustomError(info.begen, "ERC20InsufficientBalance")

    });
});

