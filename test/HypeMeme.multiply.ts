import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { HypeMemeAllContractInfo } from "./shared/deploy_hype_meme";
import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";

async function createToken(info: HypeMemeAllContractInfo): Promise<string> {
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

    await info.mockDegen.connect(info.deployWallet).approve(await info.hypeMeme.getAddress(), info.hypeMemeNftPrice);

    await info.hypeMeme
        .connect(info.deployWallet)
        .createToken(params.info);

    return tid;
}

const multiply_1000_degenAmount_max = BigInt("1100110011001100110");

describe("HypeMeme.multiply", function () {
    it("input eq need", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const tid = await createToken(info)
        const nftOwner = await info.hypeMemePublicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        // multiply
        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            degenAmountMax: multiply_1000_degenAmount_max
        }

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.degenAmountMax)
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), MAX_UINT256)

        let multiplyResult = await info.hypeMeme.connect(info.userWallet).multiply.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.degenAmountMax
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

        await info.hypeMeme.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.degenAmountMax
        )

        let curve_multiply = await info.hypeMemeMarket.getPayTokenAmount(0, paramsMultiply.multiplyAmount);

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

        expect((nftOwner_point_2 - nftOwner_point_1) * BigInt(100) - curve_multiply).lt(50)
        expect((mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) * BigInt(1000) - curve_multiply).lt(50)

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

    it("input > need", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const tid = await createToken(info)
        const nftOwner = await info.hypeMemePublicNFT.ownerOf(1)
        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        const gt = BigInt(10) ** BigInt(18) * BigInt(200)

        // multiply
        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            degenAmountMax: multiply_1000_degenAmount_max + gt
        }

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.degenAmountMax)
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), MAX_UINT256)

        let multiplyResult = await info.hypeMeme.connect(info.userWallet).multiply.staticCall(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.degenAmountMax
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

        await info.hypeMeme.connect(info.userWallet).multiply(
            paramsMultiply.tid,
            paramsMultiply.multiplyAmount,
            paramsMultiply.degenAmountMax
        )

        let curve_multiply = await info.hypeMemeMarket.getPayTokenAmount(0, paramsMultiply.multiplyAmount);

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

        expect((nftOwner_point_2 - nftOwner_point_1) * BigInt(100) - curve_multiply).lt(50)
        expect((mortgageFeeRecipient_point_2 - mortgageFeeRecipient_point_1) * BigInt(1000) - curve_multiply).lt(50)

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

    it("input < need approve", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const tid = await createToken(info)

        const gt = BigInt(10) ** BigInt(18) * BigInt(200)

        // multiply
        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            degenAmountMax: multiply_1000_degenAmount_max + gt
        }

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.degenAmountMax - BigInt(1))
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), paramsMultiply.degenAmountMax - BigInt(1))

        await expect(
            info.hypeMeme.connect(info.userWallet).multiply(
                paramsMultiply.tid,
                paramsMultiply.multiplyAmount,
                paramsMultiply.degenAmountMax
            )
        ).revertedWithCustomError(info.mockDegen, "ERC20InsufficientAllowance")

    });

    it("input < need params", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const tid = await createToken(info)

        const gt = BigInt(10) ** BigInt(18) * BigInt(200)

        // multiply
        let paramsMultiply = {
            tid: tid,
            multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000),
            degenAmountMax: multiply_1000_degenAmount_max - BigInt(1)
        }

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.degenAmountMax)
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), paramsMultiply.degenAmountMax)

        await expect(
            info.hypeMeme.connect(info.userWallet).multiply(
                paramsMultiply.tid,
                paramsMultiply.multiplyAmount,
                paramsMultiply.degenAmountMax
            )
        ).revertedWithCustomError(info.mockDegen, "ERC20InsufficientBalance")

    });
});

