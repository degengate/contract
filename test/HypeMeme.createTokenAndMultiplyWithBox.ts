import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";

import { deployAllContracts } from "./shared/deploy";
import { ethers } from "hardhat";

const multiply_1000_degenAmount = BigInt("1100110011001100110");

describe("HypeMeme.createTokenAndMultiplyWithBox.ts", function () {
    it("eq need | only degen", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        // createTokenAndMultiplyWithBox
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
            wrap: {
                degenAmount: multiply_1000_degenAmount + info.hypeMemeNftPrice,
                specialPointAmount: 0
            },
            boxId: 1,
            boxTotalAmount: 0,
            deadline: deadline
        }


        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string name, string ticker, string description, string image, string twitterLink, string telegramLink, string warpcastLink, string website)",
                            "uint256",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.info, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), paramsMultiply.wrap.degenAmount)

        let multiplyResult = await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox.staticCall(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

        await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

    it("only degen | input > need", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        // createTokenAndMultiplyWithBox
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
            wrap: {
                degenAmount: multiply_1000_degenAmount + info.hypeMemeNftPrice + BigInt(123400000),
                specialPointAmount: 0
            },
            boxId: 1,
            boxTotalAmount: 0,
            deadline: deadline
        }


        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string name, string ticker, string description, string image, string twitterLink, string telegramLink, string warpcastLink, string website)",
                            "uint256",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.info, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), paramsMultiply.wrap.degenAmount)

        let multiplyResult = await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox.staticCall(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

        await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

    it("only degen | input < need", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        // createTokenAndMultiplyWithBox
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
            wrap: {
                degenAmount: multiply_1000_degenAmount + info.hypeMemeNftPrice - BigInt(123400000),
                specialPointAmount: 0
            },
            boxId: 1,
            boxTotalAmount: 0,
            deadline: deadline
        }


        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string name, string ticker, string description, string image, string twitterLink, string telegramLink, string warpcastLink, string website)",
                            "uint256",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.info, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), paramsMultiply.wrap.degenAmount)

        await expect(
            info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox(
                paramsMultiply.info,
                paramsMultiply.multiplyAmount,
                paramsMultiply.wrap,
                paramsMultiply.boxId,
                paramsMultiply.boxTotalAmount,
                deadline,
                signature,
            )
        ).revertedWith("PE")

    });

    it("eq need | only point", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        // createTokenAndMultiplyWithBox
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
            wrap: {
                degenAmount: 0,
                specialPointAmount: multiply_1000_degenAmount + info.hypeMemeNftPrice
            },
            boxId: 1,
            boxTotalAmount: multiply_1000_degenAmount + info.hypeMemeNftPrice,
            deadline: deadline
        }

        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string name, string ticker, string description, string image, string twitterLink, string telegramLink, string warpcastLink, string website)",
                            "uint256",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.info, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        let multiplyResult = await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox.staticCall(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

        await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

        expect(userWallet_degen_2).eq(userWallet_degen_1)
        expect(nftOwner_degen_2).eq(nftOwner_degen_1)

        expect(hypeMeme_degen_2).eq(hypeMeme_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(fund_degen_2).eq(fund_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("only point | input > need", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        // createTokenAndMultiplyWithBox
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
            wrap: {
                degenAmount: 0,
                specialPointAmount: multiply_1000_degenAmount + info.hypeMemeNftPrice + BigInt(123456789)
            },
            boxId: 1,
            boxTotalAmount: multiply_1000_degenAmount + info.hypeMemeNftPrice + BigInt(123456789),
            deadline: deadline
        }

        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string name, string ticker, string description, string image, string twitterLink, string telegramLink, string warpcastLink, string website)",
                            "uint256",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.info, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        let multiplyResult = await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox.staticCall(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

        await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

        expect(userWallet_degen_2).eq(userWallet_degen_1)
        expect(nftOwner_degen_2).eq(nftOwner_degen_1)

        expect(hypeMeme_degen_2).eq(hypeMeme_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(fund_degen_2).eq(fund_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("only point | input < need", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        // createTokenAndMultiplyWithBox
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
            wrap: {
                degenAmount: 0,
                specialPointAmount: multiply_1000_degenAmount + info.hypeMemeNftPrice - BigInt(123456789)
            },
            boxId: 1,
            boxTotalAmount: multiply_1000_degenAmount + info.hypeMemeNftPrice - BigInt(123456789),
            deadline: deadline
        }

        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string name, string ticker, string description, string image, string twitterLink, string telegramLink, string warpcastLink, string website)",
                            "uint256",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.info, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await expect(
            info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox(
                paramsMultiply.info,
                paramsMultiply.multiplyAmount,
                paramsMultiply.wrap,
                paramsMultiply.boxId,
                paramsMultiply.boxTotalAmount,
                deadline,
                signature,
            )
        ).revertedWith("PE")

    });

    it("degen and point | input > need | point > need", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let degenAmount = BigInt(10) ** BigInt(18) * BigInt(123)
        let specialPointAmount = multiply_1000_degenAmount + info.hypeMemeNftPrice + BigInt(123456789)
        // createTokenAndMultiplyWithBox
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
            wrap: {
                degenAmount: degenAmount,
                specialPointAmount: specialPointAmount
            },
            boxId: 1,
            boxTotalAmount: specialPointAmount,
            deadline: deadline
        }

        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string name, string ticker, string description, string image, string twitterLink, string telegramLink, string warpcastLink, string website)",
                            "uint256",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.info, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), paramsMultiply.wrap.degenAmount)

        let multiplyResult = await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox.staticCall(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

        await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

        expect(userWallet_degen_2).eq(userWallet_degen_1)
        expect(nftOwner_degen_2).eq(nftOwner_degen_1)

        expect(hypeMeme_degen_2).eq(hypeMeme_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(fund_degen_2).eq(fund_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("degen and point | input > need | point = need", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let degenAmount = BigInt(10) ** BigInt(18) * BigInt(123)
        let specialPointAmount = multiply_1000_degenAmount + info.hypeMemeNftPrice
        // createTokenAndMultiplyWithBox
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
            wrap: {
                degenAmount: degenAmount,
                specialPointAmount: specialPointAmount
            },
            boxId: 1,
            boxTotalAmount: specialPointAmount,
            deadline: deadline
        }

        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string name, string ticker, string description, string image, string twitterLink, string telegramLink, string warpcastLink, string website)",
                            "uint256",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.info, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), paramsMultiply.wrap.degenAmount)

        let multiplyResult = await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox.staticCall(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

        await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

        expect(userWallet_degen_2).eq(userWallet_degen_1)
        expect(nftOwner_degen_2).eq(nftOwner_degen_1)

        expect(hypeMeme_degen_2).eq(hypeMeme_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(fund_degen_2).eq(fund_degen_1).eq(0)
        expect(degenGateVault_degen_2).eq(degenGateVault_degen_1).eq(0)
    });

    it("degen and point | input > need | point < need", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let input = multiply_1000_degenAmount + info.hypeMemeNftPrice + BigInt(123456789)
        let specialPointAmount = multiply_1000_degenAmount + info.hypeMemeNftPrice - BigInt(234567)
        let degenAmount = input - specialPointAmount

        // createTokenAndMultiplyWithBox
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
            wrap: {
                degenAmount: degenAmount,
                specialPointAmount: specialPointAmount
            },
            boxId: 1,
            boxTotalAmount: specialPointAmount,
            deadline: deadline
        }

        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string name, string ticker, string description, string image, string twitterLink, string telegramLink, string warpcastLink, string website)",
                            "uint256",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.info, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), paramsMultiply.wrap.degenAmount)

        let multiplyResult = await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox.staticCall(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

        await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

        expect(degenAmount).gt(
            multiply_1000_degenAmount + info.hypeMemeNftPrice - specialPointAmount
        )

        expect(userWallet_degen_1 - userWallet_degen_2).eq(
            multiply_1000_degenAmount + info.hypeMemeNftPrice - specialPointAmount
        )

        expect(hypeMeme_degen_2).eq(hypeMeme_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(fund_degen_2).eq(fund_degen_1).eq(0)
        expect(degenGateVault_degen_2 - degenGateVault_degen_1).eq(
            multiply_1000_degenAmount + info.hypeMemeNftPrice - specialPointAmount
        )
    });

    it("degen and point | input == need", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let degenAmount = BigInt(234567)
        let specialPointAmount = multiply_1000_degenAmount + info.hypeMemeNftPrice - degenAmount

        // createTokenAndMultiplyWithBox
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
            wrap: {
                degenAmount: degenAmount,
                specialPointAmount: specialPointAmount
            },
            boxId: 1,
            boxTotalAmount: specialPointAmount,
            deadline: deadline
        }

        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string name, string ticker, string description, string image, string twitterLink, string telegramLink, string warpcastLink, string website)",
                            "uint256",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.info, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), paramsMultiply.wrap.degenAmount)

        let multiplyResult = await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox.staticCall(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

        await info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox(
            paramsMultiply.info,
            paramsMultiply.multiplyAmount,
            paramsMultiply.wrap,
            paramsMultiply.boxId,
            paramsMultiply.boxTotalAmount,
            deadline,
            signature,
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

        expect(userWallet_degen_1 - userWallet_degen_2).eq(
            degenAmount
        )

        expect(hypeMeme_degen_2).eq(hypeMeme_degen_1).eq(0)
        expect(market_degen_2).eq(market_degen_1).eq(0)
        expect(mortgageFeeRecipient_degen_2).eq(mortgageFeeRecipient_degen_1).eq(0)
        expect(fund_degen_2).eq(fund_degen_1).eq(0)
        expect(degenGateVault_degen_2 - degenGateVault_degen_1).eq(
            degenAmount
        )
    });

    it("degen and point | input < need", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.degenGateInfo.degenGate.connect(info.deployWallet).setVaultManager(await info.hypeMeme.getAddress(), true)
        await info.degenGateInfo.degenGateVault.addApproveDegen();
        await info.hypeMeme.setSystemReady(true)

        const mortgageFeeRecipient = await info.foundry.mortgageFeeRecipient(info.hypeMemeAppId)

        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        const deadline = currentTimestamp + 60 * 60

        let degenAmount = BigInt(234567)
        let specialPointAmount = multiply_1000_degenAmount + info.hypeMemeNftPrice - degenAmount - BigInt(1)

        // createTokenAndMultiplyWithBox
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
            wrap: {
                degenAmount: degenAmount,
                specialPointAmount: specialPointAmount
            },
            boxId: 1,
            boxTotalAmount: specialPointAmount,
            deadline: deadline
        }

        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "tuple(string name, string ticker, string description, string image, string twitterLink, string telegramLink, string warpcastLink, string website)",
                            "uint256",
                            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
                            "uint256",
                            "uint256",
                            "uint256",
                            "address",
                        ],
                        [paramsMultiply.info, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.boxId, paramsMultiply.boxTotalAmount, paramsMultiply.deadline, info.userWallet.address],
                    ),
                ),
            ),
        );

        await info.mockDegen.transfer(info.userWallet.address, paramsMultiply.wrap.degenAmount)
        await info.mockDegen.connect(info.userWallet).approve(await info.hypeMeme.getAddress(), paramsMultiply.wrap.degenAmount)

        await expect(
            info.hypeMeme.connect(info.userWallet).createTokenAndMultiplyWithBox(
                paramsMultiply.info,
                paramsMultiply.multiplyAmount,
                paramsMultiply.wrap,
                paramsMultiply.boxId,
                paramsMultiply.boxTotalAmount,
                deadline,
                signature,
            )
        ).revertedWith("PE")

    });

});

