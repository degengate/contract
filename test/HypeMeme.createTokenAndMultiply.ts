import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";

import { deployAllContracts } from "./shared/deploy";

const multiply_1000_degenAmount = BigInt("1100110011001100110");

describe("HypeMeme.createTokenAndMultiply", function () {
    it("eq need", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        // multiply
        let paramsMultiply = {
            info: {
                name: "name_a",
                ticker: "ticker_a",
                description: "description_a",
                image: "image_a",
                twitterLink: "twitter_link_a",
                telegramLink: "telegram_link_a",
                warpcastLink: "warpcast_link_a",
                website: "website_a"
            },
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            degenAmountMax: multiply_1000_degenAmount + info.hypeMemeNftPrice
        }

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.degenAmountMax)
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), paramsMultiply.degenAmountMax)

        let multiplyResult = await info.hypeMeme.connect(info.userWallet).createTokenAndMultiply.staticCall(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.degenAmountMax
        )

        const nftOwner = await info.userWallet.getAddress()

        let userWallet_point_1 = await info.point.balanceOf(info.userWallet.address);
        let hypeMeme_point_1 = await info.point.balanceOf(await info.hypeMeme.getAddress());
        let market_point_1 = await info.point.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_point_1 = await info.point.balanceOf(nftOwner);
        let fund_point_1 = await info.point.balanceOf(await info.hypeMemeFundRecipientWallet.getAddress())
        let mortgageFeeRecipient_point_1 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_1 = await info.point.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let hypeMeme_degen_1 = await info.mockDegen.balanceOf(await info.hypeMeme.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_degen_1 = await info.mockDegen.balanceOf(nftOwner);
        let fund_degen_1 = await info.mockDegen.balanceOf(await info.hypeMemeFundRecipientWallet.getAddress())
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        let point_totalSuply_before = await info.point.totalSupply()

        await info.hypeMeme.connect(info.userWallet).createTokenAndMultiply(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.degenAmountMax
        )

        let curve_multiply = await info.hypeMemeMarket.getPayTokenAmount(0, paramsMultiply.multiplyAmount);

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_degenAmount + info.hypeMemeNftPrice)
        expect(multiplyResult.mortgageNFTtokenId).eq(1)

        expect(await info.point.totalSupply()).eq(point_totalSuply_before + multiply_1000_degenAmount + info.hypeMemeNftPrice);

        let userWallet_point_2 = await info.point.balanceOf(info.userWallet.address);
        let hypeMeme_point_2 = await info.point.balanceOf(await info.hypeMeme.getAddress());
        let market_point_2 = await info.point.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_point_2 = await info.point.balanceOf(nftOwner);
        let fund_point_2 = await info.point.balanceOf(await info.hypeMemeFundRecipientWallet.getAddress())
        let mortgageFeeRecipient_point_2 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_2 = await info.point.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let hypeMeme_degen_2 = await info.mockDegen.balanceOf(await info.hypeMeme.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_degen_2 = await info.mockDegen.balanceOf(nftOwner);
        let fund_degen_2 = await info.mockDegen.balanceOf(await info.hypeMemeFundRecipientWallet.getAddress())
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        // nftOwner is userWallet
        expect(userWallet_point_2 - userWallet_point_1).eq(nftOwner_point_2 - nftOwner_point_1)
        expect(hypeMeme_point_2).eq(hypeMeme_point_1).eq(0)
        expect(market_point_2).eq(market_point_1).eq(0)
        expect(degenGateVault_point_2).eq(degenGateVault_point_1).eq(0)
        expect(fund_point_2).eq(fund_point_1 + info.hypeMemeNftPrice)

        expect((nftOwner_point_2 - nftOwner_point_1) * BigInt(100) - curve_multiply).lt(50)
        expect((mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) * BigInt(1000) - curve_multiply).lt(50)

        expect(multiplyResult.payTokenAmount - info.hypeMemeNftPrice).eq(
            (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) + (nftOwner_point_2 - nftOwner_point_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1 - multiplyResult.payTokenAmount)
        expect(nftOwner_degen_2).eq(nftOwner_degen_1 - multiplyResult.payTokenAmount)

        expect(hypeMeme_degen_2).eq(hypeMeme_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(fund_degen_2).eq(fund_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + multiplyResult.payTokenAmount)
    });

    it("input > need", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        const gt = BigInt(10) ** BigInt(18) * BigInt(200)

        // multiply
        let paramsMultiply = {
            info: {
                name: "name_a",
                ticker: "ticker_a",
                description: "description_a",
                image: "image_a",
                twitterLink: "twitter_link_a",
                telegramLink: "telegram_link_a",
                warpcastLink: "warpcast_link_a",
                website: "website_a"
            },
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            degenAmountMax: multiply_1000_degenAmount + info.hypeMemeNftPrice + gt
        }

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.degenAmountMax)
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), paramsMultiply.degenAmountMax)

        let multiplyResult = await info.hypeMeme.connect(info.userWallet).createTokenAndMultiply.staticCall(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.degenAmountMax
        )

        const nftOwner = await info.userWallet.getAddress()

        let userWallet_point_1 = await info.point.balanceOf(info.userWallet.address);
        let hypeMeme_point_1 = await info.point.balanceOf(await info.hypeMeme.getAddress());
        let market_point_1 = await info.point.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_point_1 = await info.point.balanceOf(nftOwner);
        let fund_point_1 = await info.point.balanceOf(await info.hypeMemeFundRecipientWallet.getAddress())
        let mortgageFeeRecipient_point_1 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_1 = await info.point.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        let userWallet_degen_1 = await info.mockDegen.balanceOf(info.userWallet.address);
        let hypeMeme_degen_1 = await info.mockDegen.balanceOf(await info.hypeMeme.getAddress());
        let market_degen_1 = await info.mockDegen.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_degen_1 = await info.mockDegen.balanceOf(nftOwner);
        let fund_degen_1 = await info.mockDegen.balanceOf(await info.hypeMemeFundRecipientWallet.getAddress())
        let mortgageFeeRecipient_degen_1 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_1 = await info.mockDegen.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        let point_totalSuply_before = await info.point.totalSupply()

        await info.hypeMeme.connect(info.userWallet).createTokenAndMultiply(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.degenAmountMax
        )

        let curve_multiply = await info.hypeMemeMarket.getPayTokenAmount(0, paramsMultiply.multiplyAmount);

        expect(multiplyResult.payTokenAmount).eq(multiply_1000_degenAmount + info.hypeMemeNftPrice)
        expect(multiplyResult.mortgageNFTtokenId).eq(1)

        expect(await info.point.totalSupply()).eq(point_totalSuply_before + multiply_1000_degenAmount + info.hypeMemeNftPrice);

        let userWallet_point_2 = await info.point.balanceOf(info.userWallet.address);
        let hypeMeme_point_2 = await info.point.balanceOf(await info.hypeMeme.getAddress());
        let market_point_2 = await info.point.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_point_2 = await info.point.balanceOf(nftOwner);
        let fund_point_2 = await info.point.balanceOf(await info.hypeMemeFundRecipientWallet.getAddress())
        let mortgageFeeRecipient_point_2 = await info.point.balanceOf(mortgageFeeRecipient);
        let degenGateVault_point_2 = await info.point.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        let userWallet_degen_2 = await info.mockDegen.balanceOf(info.userWallet.address);
        let hypeMeme_degen_2 = await info.mockDegen.balanceOf(await info.hypeMeme.getAddress());
        let market_degen_2 = await info.mockDegen.balanceOf(await info.hypeMemeMarket.getAddress());
        let nftOwner_degen_2 = await info.mockDegen.balanceOf(nftOwner);
        let fund_degen_2 = await info.mockDegen.balanceOf(await info.hypeMemeFundRecipientWallet.getAddress())
        let mortgageFeeRecipient_degen_2 = await info.mockDegen.balanceOf(mortgageFeeRecipient);
        let degenGateVault_degen_2 = await info.mockDegen.balanceOf(await info.degenGateInfo.degenGateVault.getAddress())

        // nftOwner is userWallet
        expect(userWallet_point_2 - userWallet_point_1).eq(nftOwner_point_2 - nftOwner_point_1)
        expect(hypeMeme_point_2).eq(hypeMeme_point_1).eq(0)
        expect(market_point_2).eq(market_point_1).eq(0)
        expect(degenGateVault_point_2).eq(degenGateVault_point_1).eq(0)
        expect(fund_point_2).eq(fund_point_1 + info.hypeMemeNftPrice)

        expect((nftOwner_point_2 - nftOwner_point_1) * BigInt(100) - curve_multiply).lt(50)
        expect((mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) * BigInt(1000) - curve_multiply).lt(50)

        expect(multiplyResult.payTokenAmount - info.hypeMemeNftPrice).eq(
            (mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) + (nftOwner_point_2 - nftOwner_point_1)
        )

        expect(userWallet_degen_2).eq(userWallet_degen_1 - multiplyResult.payTokenAmount)
        expect(nftOwner_degen_2).eq(nftOwner_degen_1 - multiplyResult.payTokenAmount)

        expect(hypeMeme_degen_2).eq(hypeMeme_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(fund_degen_2).eq(fund_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1 + multiplyResult.payTokenAmount)
    });

    it("input < need approve", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const gt = BigInt(10) ** BigInt(18) * BigInt(200)

        // multiply
        let paramsMultiply = {
            info: {
                name: "name_a",
                ticker: "ticker_a",
                description: "description_a",
                image: "image_a",
                twitterLink: "twitter_link_a",
                telegramLink: "telegram_link_a",
                warpcastLink: "warpcast_link_a",
                website: "website_a"
            },
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            degenAmountMax: multiply_1000_degenAmount + info.hypeMemeNftPrice + gt
        }

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.degenAmountMax - BigInt(1))
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), paramsMultiply.degenAmountMax - BigInt(1))

        await expect(
            info.hypeMeme.connect(info.userWallet).createTokenAndMultiply(
                paramsMultiply.info,
                paramsMultiply.multiplyAmount,
                paramsMultiply.degenAmountMax
            )
        ).revertedWithCustomError(info.mockDegen, "ERC20InsufficientAllowance")

    });

    it("input < need params", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const gt = BigInt(10) ** BigInt(18) * BigInt(200)

        // multiply
        let paramsMultiply = {
            info: {
                name: "name_a",
                ticker: "ticker_a",
                description: "description_a",
                image: "image_a",
                twitterLink: "twitter_link_a",
                telegramLink: "telegram_link_a",
                warpcastLink: "warpcast_link_a",
                website: "website_a"
            },
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            degenAmountMax: multiply_1000_degenAmount + info.hypeMemeNftPrice - BigInt(1)
        }

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.degenAmountMax)
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), paramsMultiply.degenAmountMax)

        await expect(
            info.hypeMeme.connect(info.userWallet).createTokenAndMultiply(
                paramsMultiply.info,
                paramsMultiply.multiplyAmount,
                paramsMultiply.degenAmountMax
            )
        ).revertedWith("PE")

    });
});

