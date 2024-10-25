import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { HypeMemeAllContractInfo } from "./shared/deploy_hype_meme";
import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";

async function createToken(info: HypeMemeAllContractInfo): Promise<string> {
    let params = {
        info: {
            tid: "a",
            name: "name_a",
            ticker: "ticker_a",
            description: "description_a",
            image: "image_a",
            twitterLink: "twitter_link_a",
            telegramLink: "telegram_link_a",
            warpcastLink: "warpcast_link_a",
            website: "website_a"
        }
    };
    let tid = params.info.ticker

    await info.mockDegen.connect(info.deployWallet).approve(await info.hypeMeme.getAddress(), info.hypeMemeNftPrice);

    await info.hypeMeme
        .connect(info.deployWallet)
        .createToken(params.info);

    return tid;
}

const multiply_1000_degenAmount_max = BigInt("11001100110011001100");

describe("HypeMeme.multiplyWithBox", function () {
    it("eq need | only degen", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGateVault.addApproveDegen();

        const tid = await createToken(info)
        const nftOwner = await info.hypeMemePublicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        // multiplyWithBox
        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: multiply_1000_degenAmount_max,
                specialPointAmount: 0
            },
            boxId: 1,
            boxTotalAmount: 0,
            deadline: deadline,
        }

        let signature = await info.signatureWallet.signMessage(
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
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), MAX_UINT256)

        let multiplyResult = await info.hypeMeme.connect(info.userWallet).multiplyWithBox.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            signature
        )

        let userWallet_point_1 = await info.point.balanceOf(info.userWallet.address);
        let hypeMeme_point_1 = await info.point.balanceOf(await info.hypeMeme.getAddress());
        let market_point_1 = await info.point.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_point_1 = await info.point.balanceOf(nftOwner);
        let mortgageFeeRecipient_point_1 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_1 = await info.point.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let hypeMeme_degen_1 = await info.mockDegen.balanceOf(await info.hypeMeme.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_degen_1 = await info.mockDegen.balanceOf(nftOwner);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        let point_totalSuply_before = await info.point.totalSupply()

        await info.hypeMeme.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            signature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_degenAmount_max)
        expect(multiplyResult.mortgageNFTtokenId).eq(1)

        expect(await info.point.totalSupply()).eq(point_totalSuply_before + multiply_1000_degenAmount_max);

        let userWallet_point_2 = await info.point.balanceOf(info.userWallet.address);
        let hypeMeme_point_2 = await info.point.balanceOf(await info.hypeMeme.getAddress());
        let market_point_2 = await info.point.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_point_2 = await info.point.balanceOf(nftOwner);
        let mortgageFeeRecipient_point_2 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_2 = await info.point.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let hypeMeme_degen_2 = await info.mockDegen.balanceOf(await info.hypeMeme.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_degen_2 = await info.mockDegen.balanceOf(nftOwner);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        expect(userWallet_point_2).eq(userWallet_point_1).eq(0)
        expect(hypeMeme_point_2).eq(hypeMeme_point_1).eq(0)
        expect(market_point_2).eq(market_point_1).eq(0)
        expect(degenGateVault_point_2).eq(degenGateVault_point_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOwner_point_2 - nftOwner_point_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) + (nftOwner_point_2 - nftOwner_point_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1 - multiplyResult.payTokenAmount)
        expect(hypeMeme_degen_2).eq(hypeMeme_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOwner_degen_2).eq(nftOwner_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + multiplyResult.payTokenAmount)
    });

    it("eq need | only point", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
        await info.degenGateInfo.degenGateVault.addApproveDegen();

        const tid = await createToken(info)
        const nftOwner = await info.hypeMemePublicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        // multiplyWithBox
        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            wrap: {
                degenAmount: 0,
                specialPointAmount: multiply_1000_degenAmount_max
            },
            boxId: 1,
            boxTotalAmount: multiply_1000_degenAmount_max,
            deadline: deadline,
        }

        let signature = await info.signatureWallet.signMessage(
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

        let multiplyResult = await info.hypeMeme.connect(info.userWallet).multiplyWithBox.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            signature
        )

        let userWallet_point_1 = await info.point.balanceOf(info.userWallet.address);
        let hypeMeme_point_1 = await info.point.balanceOf(await info.hypeMeme.getAddress());
        let market_point_1 = await info.point.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_point_1 = await info.point.balanceOf(nftOwner);
        let mortgageFeeRecipient_point_1 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_1 = await info.point.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let hypeMeme_degen_1 = await info.mockDegen.balanceOf(await info.hypeMeme.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_degen_1 = await info.mockDegen.balanceOf(nftOwner);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        let point_totalSuply_before = await info.point.totalSupply()

        await info.hypeMeme.connect(info.userWallet).multiplyWithBox(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            paramsMultiply.deadline,
            signature
        )

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_degenAmount_max)
        expect(multiplyResult.mortgageNFTtokenId).eq(1)

        expect(await info.point.totalSupply()).eq(point_totalSuply_before + multiply_1000_degenAmount_max);

        let userWallet_point_2 = await info.point.balanceOf(info.userWallet.address);
        let hypeMeme_point_2 = await info.point.balanceOf(await info.hypeMeme.getAddress());
        let market_point_2 = await info.point.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_point_2 = await info.point.balanceOf(nftOwner);
        let mortgageFeeRecipient_point_2 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_2 = await info.point.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let hypeMeme_degen_2 = await info.mockDegen.balanceOf(await info.hypeMeme.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_degen_2 = await info.mockDegen.balanceOf(nftOwner);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        expect(userWallet_point_2).eq(userWallet_point_1).eq(0)
        expect(hypeMeme_point_2).eq(hypeMeme_point_1).eq(0)
        expect(market_point_2).eq(market_point_1).eq(0)
        expect(degenGateVault_point_2).eq(degenGateVault_point_1).eq(0)

        expect(paramsMultiply.multiplyAmount / (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1)).eq(999)
        expect(paramsMultiply.multiplyAmount / (nftOwner_point_2 - nftOwner_point_1)).eq(99)
        expect(multiplyResult.payTokenAmount).eq(
            (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) + (nftOwner_point_2 - nftOwner_point_1)
        )

        expect(userWallet_degen_2 - userWallet_degen_1).eq(0)
        expect(hypeMeme_degen_2).eq(hypeMeme_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(nftOwner_degen_2).eq(nftOwner_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(degenGateVault_degen_2 - degenGateVault_degen_1).eq(0)
    });
});

