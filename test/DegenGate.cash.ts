import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";

describe("DegenGate.cash", function () {

    it("test", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.addApproveDegen();
        await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), MAX_UINT256);
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.appId)

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
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100000),
            wrap: {
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(2000),
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

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount);
        let result1 = await info.degenGate.connect(info.userWallet).multiply.staticCall(
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

        // multiply other
        let paramsMultiplyOther = {
            tid: params.info.tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100000),
            wrap: {
                degenAmount: BigInt(10) ** BigInt(18) * BigInt(5000),
                specialBegenAmount: 0
            },
            deadline: deadline,
        }

        let paramsMultiplyOtherSignature = await info.signatureWallet.signMessage(
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
                        [paramsMultiplyOther.tid, paramsMultiplyOther.multiplyAmount, paramsMultiplyOther.wrap, paramsMultiplyOther.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiplyOther.wrap.degenAmount);
        let result2 = await info.degenGate.connect(info.userWallet).multiply.staticCall(
            paramsMultiplyOther.tid,
            paramsMultiplyOther.multiplyAmount,
            paramsMultiplyOther.wrap,
            paramsMultiplyOther.deadline,
            paramsMultiplyOtherSignature
        )

        await info.degenGate.connect(info.userWallet).multiply(
            paramsMultiplyOther.tid,
            paramsMultiplyOther.multiplyAmount,
            paramsMultiplyOther.wrap,
            paramsMultiplyOther.deadline,
            paramsMultiplyOtherSignature
        )

        let userWallet_begen_1 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_1 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_1 = await info.begen.balanceOf(await info.market.getAddress());
        let deployWallet_begen_1 = await info.begen.balanceOf(info.deployWallet.address);
        let mortgageFeeRecipient_begen_1 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_1 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_1 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let deployWallet_degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(await info.begen.totalSupply()).eq(result1.payTokenAmount + result2.payTokenAmount)

        let result3 = await info.degenGate.connect(info.userWallet).cash.staticCall(
            result1.nftTokenId,
            paramsMultiplyOther.multiplyAmount
        )
        await info.degenGate.connect(info.userWallet).cash(
            result1.nftTokenId,
            paramsMultiplyOther.multiplyAmount
        )

        let userWallet_begen_2 = await info.begen.balanceOf(info.userWallet.address);
        let degenGate_begen_2 = await info.begen.balanceOf(await info.degenGate.getAddress());
        let market_begen_2 = await info.begen.balanceOf(await info.market.getAddress());
        let deployWallet_begen_2 = await info.begen.balanceOf(info.deployWallet.address);
        let mortgageFeeRecipient_begen_2 = await info.begen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_begen_2 = await info.begen.balanceOf(await info.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let degenGate_degen_2 = await info.mockDegen.balanceOf(await info.degenGate.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.market.getAddress());
        let deployWallet_degen_2 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateVault.getAddress())

        expect(userWallet_begen_2).eq(userWallet_begen_1)
        expect(degenGate_begen_2).eq(degenGate_begen_1).eq(0)
        expect(deployWallet_begen_2 - deployWallet_begen_1).gt(0)
        expect(market_begen_2).eq(market_begen_1 - result3 - (deployWallet_begen_2 - deployWallet_begen_1)).eq(0)
        expect(mortgageFeeRecipient_begen_2).eq(mortgageFeeRecipient_begen_1)
        expect(degenGateVault_begen_2).eq(degenGateVault_begen_1).eq(0)

        expect(degenGate_degen_2).eq(degenGate_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(deployWallet_degen_2).eq(deployWallet_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 - result3)

        expect(await info.begen.totalSupply()).eq(
            result1.payTokenAmount + result2.payTokenAmount - result3
        )
        expect(userWallet_degen_2 - userWallet_degen_1).eq(result3)
    });
});

