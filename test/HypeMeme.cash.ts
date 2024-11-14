import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";

describe("HypeMeme.cash", function () {

    it("test", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.degenGateInfo.degenGate.setVaultManager(await info.hypeMeme.getAddress(), true)
        await info.hypeMeme.setSystemReady(true)
        await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, 1000)

        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        // create token
        let params = {
            info: {
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

        await info.mockDegen.connect(info.deployWallet).approve(await info.hypeMeme.getAddress(), MAX_UINT256);
        // createToken
        await info.hypeMeme.connect(info.deployWallet).createToken(params.info);


        // multiply
        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100000),
            degenAmountMax: BigInt(10) ** BigInt(18) * BigInt(2000)
        }

        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), MAX_UINT256);
        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.degenAmountMax);
        let result1 = await info.hypeMeme.connect(info.userWallet).multiply.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.degenAmountMax,
        )

        await info.hypeMeme.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.degenAmountMax,
        )

        // multiply other
        let paramsMultiplyOther = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100000),
            degenAmountMax: BigInt(10) ** BigInt(18) * BigInt(5000),
        }

        let result2 = await info.hypeMeme.connect(info.deployWallet).multiply.staticCall(
            paramsMultiplyOther.tid,
            paramsMultiplyOther.multiplyAmount,
            paramsMultiplyOther.degenAmountMax
        )

        await info.hypeMeme.connect(info.deployWallet).multiply(
            paramsMultiplyOther.tid,
            paramsMultiplyOther.multiplyAmount,
            paramsMultiplyOther.degenAmountMax
        )

        let userWallet_point_1 = await info.point.balanceOf(info.userWallet.address);
        let hypeMeme_point_1 = await info.point.balanceOf(await info.hypeMeme.getAddress());
        let market_point_1 = await info.point.balanceOf(await info.hypeMemeMarket.getAddress());
        let deployWallet_point_1 = await info.point.balanceOf(info.deployWallet.address);
        let mortgageFeeRecipient_point_1 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_1 = await info.point.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let hypeMeme_degen_1 = await info.mockDegen.balanceOf(await info.hypeMeme.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.hypeMemeMarket.getAddress());
        let deployWallet_degen_1 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        expect(await info.point.totalSupply()).eq(result1.payTokenAmount + result2.payTokenAmount + info.hypeMemeNftPrice)

        let result3 = await info.hypeMeme.connect(info.userWallet).cash.staticCall(
            result1.mortgageNFTtokenId,
            paramsMultiplyOther.multiplyAmount
        )
        await info.hypeMeme.connect(info.userWallet).cash(
            result1.mortgageNFTtokenId,
            paramsMultiplyOther.multiplyAmount
        )

        let userWallet_point_2 = await info.point.balanceOf(info.userWallet.address);
        let hypeMeme_point_2 = await info.point.balanceOf(await info.hypeMeme.getAddress());
        let market_point_2 = await info.point.balanceOf(await info.hypeMemeMarket.getAddress());
        let deployWallet_point_2 = await info.point.balanceOf(info.deployWallet.address);
        let mortgageFeeRecipient_point_2 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_2 = await info.point.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let hypeMeme_degen_2 = await info.mockDegen.balanceOf(await info.hypeMeme.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.hypeMemeMarket.getAddress());
        let deployWallet_degen_2 = await info.mockDegen.balanceOf(info.deployWallet.address);
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        expect(userWallet_point_2).eq(userWallet_point_1)
        expect(hypeMeme_point_2).eq(hypeMeme_point_1).eq(0)

        expect(market_point_1 - market_point_2)
            .eq(deployWallet_point_2 - deployWallet_point_1 + result3)

        expect(mortgageFeeRecipient_point_2).eq(mortgageFeeRecipient_point_1)
        expect(degenGateVault_point_2).eq(degenGateVault_point_1).eq(0)

        expect(hypeMeme_degen_2).eq(hypeMeme_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(deployWallet_degen_2).eq(deployWallet_degen_1)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 - result3)

        expect(await info.point.totalSupply()).eq(
            info.hypeMemeNftPrice + result1.payTokenAmount + result2.payTokenAmount - result3
        )
        expect(userWallet_degen_2 - userWallet_degen_1).eq(result3)
    });
});

