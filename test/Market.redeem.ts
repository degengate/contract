import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { getTokenAmountWei } from "./shared/utils";
import { ethers } from "hardhat";
import { Market, MortgageNFT, SimpleToken, Token } from "../typechain-types";
import { MaxUint256, ZeroAddress } from "ethers";

describe("Market", function () {
    describe("redeem", function () {
        it("redeem revert", async function () {
            const info = (await loadFixture(deployAllContracts));
            const coreInfo = info.coreContractInfo;
            const xMemeInfo = info.xMemeAllContractInfo;
            await xMemeInfo.xMeme.setSystemReady(true)

            let user1 = xMemeInfo.wallets[xMemeInfo.nextWalletIndex + 1]
            let user2 = xMemeInfo.wallets[xMemeInfo.nextWalletIndex + 2]

            let tid_1 = "t1";
            let buyAmount_1_user_1 = getTokenAmountWei(1000)
            let buyAmount_1_user_2 = getTokenAmountWei(2000)
            await xMemeInfo.xMeme.connect(user1).createTokenAndBuy(tid_1, buyAmount_1_user_1, { value: BigInt(10) ** BigInt(20) });
            await xMemeInfo.market.connect(user2).buy(tid_1, buyAmount_1_user_2, { value: BigInt(10) ** BigInt(20) });

            let tid_2 = "t2";
            let buyAmount_2_user_1 = getTokenAmountWei(3000)
            let buyAmount_2_user_2 = getTokenAmountWei(4000)
            await xMemeInfo.xMeme.connect(user1).createTokenAndBuy(tid_2, buyAmount_2_user_1, { value: BigInt(10) ** BigInt(20) });
            await xMemeInfo.market.connect(user2).buy(tid_2, buyAmount_2_user_2, { value: BigInt(10) ** BigInt(20) });

            let tid1_tokenAddr = await coreInfo.foundry.token(xMemeInfo.appId, tid_1);
            let tid1_token = (await ethers.getContractAt("Token", tid1_tokenAddr)) as Token;

            // no tokenid
            await expect(
                xMemeInfo.market.redeem(1, getTokenAmountWei(1000)),
            ).revertedWithCustomError(xMemeInfo.mortgageNFT, "ERC721NonexistentToken")

            await tid1_token.connect(user1).approve(xMemeInfo.market.getAddress(), getTokenAmountWei(1000))
            await xMemeInfo.market.connect(user1).mortgageNew(tid_1, getTokenAmountWei(1000))

            // not owner
            await expect(
                xMemeInfo.market.connect(user2).redeem(1, getTokenAmountWei(1000))
            ).revertedWith("AOE");

            // not enough token
            await expect(
                xMemeInfo.market.connect(user1).redeem(1, getTokenAmountWei(1000) + BigInt(1))
            ).revertedWith("TAE");

            // totalSupply not enough
            await expect(
                xMemeInfo.market.connect(user1).redeem(1, buyAmount_1_user_1 + buyAmount_1_user_2 + BigInt(1))
            ).revertedWith("TAE");

            // mortgageAdd 0
            await expect(xMemeInfo.market.connect(user1).redeem(1, 0)).revertedWith("TAE");
        });

        it("redeem revert erc20", async function () {
            const info = (await loadFixture(deployAllContracts));
            const coreInfo = info.coreContractInfo;
            const xMemeInfo = info.xMemeAllContractInfo;

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = (await (
                await ethers.getContractFactory("SimpleToken")
            ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

            let app2_fees = {
                appOwnerBuyFee: 200,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 500,
                nftOwnerSellFee: 600,
            }

            let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "uint256"],
                [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
            )

            await info.coreContractInfo.foundry.createApp(
                app2_name,
                app2_owner,
                await info.coreContractInfo.cpfCurveFactory.getAddress(),
                curveParams,
                app2_payToken,
                app2_fees);
            expect((await info.coreContractInfo.foundry.apps(app2_appid)).name).eq(app2_name);
            await info.coreContractInfo.foundry.connect(app2_owner).setAppOperator(app2_appid, app2_operator)

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;
            let app2_mortgageNFT = (await ethers.getContractAt("MortgageNFT", app2.mortgageNFT)) as MortgageNFT;

            let tid_1 = "t1";
            let tid_2 = "t2";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid_1, "0x12", [], [], [])
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid_2, "0x12", [], [], [])

            let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4]
            let user2 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5]

            await app2_payToken.transfer(user1, getTokenAmountWei(5000))
            await app2_payToken.transfer(user2, getTokenAmountWei(5000))
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), getTokenAmountWei(5000))
            await app2_payToken.connect(user2).approve(await app2_market.getAddress(), getTokenAmountWei(5000))

            let buyAmount_1_user_1 = getTokenAmountWei(1000)
            let buyAmount_1_user_2 = getTokenAmountWei(2000)
            await app2_market.connect(user1).buy(tid_1, buyAmount_1_user_1);
            await app2_market.connect(user2).buy(tid_1, buyAmount_1_user_2);

            let buyAmount_2_user_1 = getTokenAmountWei(3000)
            let buyAmount_2_user_2 = getTokenAmountWei(4000)
            await app2_market.connect(user1).buy(tid_2, buyAmount_2_user_1);
            await app2_market.connect(user2).buy(tid_2, buyAmount_2_user_2);

            let tid1_tokenAddr = await coreInfo.foundry.token(app2_appid, tid_1);
            let tid1_token = (await ethers.getContractAt("Token", tid1_tokenAddr)) as Token;

            // no tokenid
            await expect(
                app2_market.redeem(1, getTokenAmountWei(1000)),
            ).revertedWithCustomError(app2_mortgageNFT, "ERC721NonexistentToken")

            await tid1_token.connect(user1).approve(app2_market.getAddress(), getTokenAmountWei(1000))
            await app2_market.connect(user1).mortgageNew(tid_1, getTokenAmountWei(1000))

            // not owner
            await expect(
                app2_market.connect(user2).redeem(1, getTokenAmountWei(1000))
            ).revertedWith("AOE");

            // not enough token
            await expect(
                app2_market.connect(user1).redeem(1, getTokenAmountWei(1000) + BigInt(1))
            ).revertedWith("TAE");

            // totalSupply not enough
            await expect(
                app2_market.connect(user1).redeem(1, buyAmount_1_user_1 + buyAmount_1_user_2 + BigInt(1))
            ).revertedWith("TAE");

            // mortgageAdd 0
            await expect(app2_market.connect(user1).redeem(1, 0)).revertedWith("TAE");
        });

        it("redeem with eth", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 300,
                appOwnerSellFee: 200,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 500,
            }

            let nft_1_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
            let nft_2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];

            let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];

            let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "uint256"],
                [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
            )

            await info.coreContractInfo.foundry.createApp(
                app2_name,
                app2_owner,
                await info.coreContractInfo.cpfCurveFactory.getAddress(),
                curveParams,
                app2_payToken,
                app2_fees);
            expect((await info.coreContractInfo.foundry.apps(app2_appid)).name).eq(app2_name);
            await info.coreContractInfo.foundry.connect(app2_owner).setAppOperator(app2_appid, app2_operator)

            let platformMortgageFee = 100
            let platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7]
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFee(app2_appid, platformMortgageFee)
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFeeRecipient(app2_appid, platformMortgageFeeRecipient)

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;
            let app2_mortgageNFT = (await ethers.getContractAt("MortgageNFT", app2.mortgageNFT)) as MortgageNFT;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [10000, 90000], [nft_1_owner.address, nft_2_owner.address], ["0x12", "0x13"])

            let tokenAddr = await info.coreContractInfo.foundry.token(app2_appid, tid);
            let token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(20000)
            await app2_market.connect(user1).buy(tid, buyAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })

            let mortgageNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await expect(
                app2_market.connect(user1).mortgageNew(tid, mortgageNewAmount)
            ).revertedWithCustomError(token, "ERC20InsufficientAllowance")
            await token.connect(user1).approve(app2_market.getAddress(), mortgageNewAmount)

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let platform_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let result = await app2_market.connect(user1).mortgageNew.staticCall(tid, mortgageNewAmount)
            let res = await app2_market.connect(user1).mortgageNew(tid, mortgageNewAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let platform_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("1005050505050505051")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 + result.payTokenAmount - gas)

            let app_owner_mortgage_fee = app2_owner_mortgage_fee_eth_balance_2 - app2_owner_mortgage_fee_eth_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_eth_balance_2 - platform_mortgage_fee_eth_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(0, mortgageNewAmount)

            expect(result.payTokenAmount).eq(curve_amount - platform_mortgage_fee - app_owner_mortgage_fee)

            expect(curve_amount / app_owner_mortgage_fee).eq(100000 / app2_fees.appOwnerMortgageFee)
            expect(curve_amount / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(app_owner_mortgage_fee / platform_mortgage_fee).eq(4)

            expect(app2_market_eth_balance_1 - app2_market_eth_balance_2).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_1 - user1_token_balance_2).eq(mortgageNewAmount)
            expect(app2_market_token_balance_2 - app2_market_token_balance_1).eq(mortgageNewAmount)

            // redeem
            await expect(
                app2_market.connect(user1).redeem(result.nftTokenId, mortgageNewAmount)
            ).revertedWith("VE")

            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())
            let app2_market_eth_balance_3 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let result2 = await app2_market.connect(user1).redeem.staticCall(result.nftTokenId, mortgageNewAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })
            let res2 = await app2_market.connect(user1).redeem(result.nftTokenId, mortgageNewAmount, { value: result2 })
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())
            let app2_market_eth_balance_4 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result2).eq("1010101010101010101")
            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - result2 - gas2)

            let curve_amount_redeem = await app2_market.getPayTokenAmount(0, mortgageNewAmount)

            expect(result2).eq(curve_amount_redeem)

            expect(app2_market_eth_balance_4).eq(app2_market_eth_balance_3 + curve_amount_redeem)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_4).eq(user1_token_balance_3 + mortgageNewAmount)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 - mortgageNewAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(0)
        });

        it("redeem with eth | value > need", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 300,
                appOwnerSellFee: 200,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 500,
            }

            let nft_1_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
            let nft_2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];

            let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];

            let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "uint256"],
                [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
            )

            await info.coreContractInfo.foundry.createApp(
                app2_name,
                app2_owner,
                await info.coreContractInfo.cpfCurveFactory.getAddress(),
                curveParams,
                app2_payToken,
                app2_fees);
            expect((await info.coreContractInfo.foundry.apps(app2_appid)).name).eq(app2_name);
            await info.coreContractInfo.foundry.connect(app2_owner).setAppOperator(app2_appid, app2_operator)

            let platformMortgageFee = 100
            let platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7]
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFee(app2_appid, platformMortgageFee)
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFeeRecipient(app2_appid, platformMortgageFeeRecipient)

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;
            let app2_mortgageNFT = (await ethers.getContractAt("MortgageNFT", app2.mortgageNFT)) as MortgageNFT;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [10000, 90000], [nft_1_owner.address, nft_2_owner.address], ["0x12", "0x13"])

            let tokenAddr = await info.coreContractInfo.foundry.token(app2_appid, tid);
            let token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(20000)
            await app2_market.connect(user1).buy(tid, buyAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })

            let mortgageNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await expect(
                app2_market.connect(user1).mortgageNew(tid, mortgageNewAmount)
            ).revertedWithCustomError(token, "ERC20InsufficientAllowance")
            await token.connect(user1).approve(app2_market.getAddress(), mortgageNewAmount)

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let platform_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let result = await app2_market.connect(user1).mortgageNew.staticCall(tid, mortgageNewAmount)
            let res = await app2_market.connect(user1).mortgageNew(tid, mortgageNewAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let platform_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("1005050505050505051")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 + result.payTokenAmount - gas)

            let app_owner_mortgage_fee = app2_owner_mortgage_fee_eth_balance_2 - app2_owner_mortgage_fee_eth_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_eth_balance_2 - platform_mortgage_fee_eth_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(0, mortgageNewAmount)

            expect(result.payTokenAmount).eq(curve_amount - platform_mortgage_fee - app_owner_mortgage_fee)

            expect(curve_amount / app_owner_mortgage_fee).eq(100000 / app2_fees.appOwnerMortgageFee)
            expect(curve_amount / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(app_owner_mortgage_fee / platform_mortgage_fee).eq(4)

            expect(app2_market_eth_balance_1 - app2_market_eth_balance_2).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_1 - user1_token_balance_2).eq(mortgageNewAmount)
            expect(app2_market_token_balance_2 - app2_market_token_balance_1).eq(mortgageNewAmount)

            // redeem
            await expect(
                app2_market.connect(user1).redeem(result.nftTokenId, mortgageNewAmount)
            ).revertedWith("VE")

            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())
            let app2_market_eth_balance_3 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let result2 = await app2_market.connect(user1).redeem.staticCall(result.nftTokenId, mortgageNewAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })
            let res2 = await app2_market.connect(user1).redeem(result.nftTokenId, mortgageNewAmount, { value: result2 * BigInt(2) })
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())
            let app2_market_eth_balance_4 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result2).eq("1010101010101010101")
            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - result2 - gas2)

            let curve_amount_redeem = await app2_market.getPayTokenAmount(0, mortgageNewAmount)

            expect(result2).eq(curve_amount_redeem)

            expect(app2_market_eth_balance_4 - app2_market_eth_balance_3).eq(curve_amount_redeem)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_4 - user1_token_balance_3).eq(mortgageNewAmount)
            expect(app2_market_token_balance_3 - app2_market_token_balance_4).eq(mortgageNewAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(0)
        });

        it("redeem with eth | redeem part", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 300,
                appOwnerSellFee: 200,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 500,
            }

            let nft_1_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
            let nft_2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];

            let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];

            let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "uint256"],
                [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
            )

            await info.coreContractInfo.foundry.createApp(
                app2_name,
                app2_owner,
                await info.coreContractInfo.cpfCurveFactory.getAddress(),
                curveParams,
                app2_payToken,
                app2_fees);
            expect((await info.coreContractInfo.foundry.apps(app2_appid)).name).eq(app2_name);
            await info.coreContractInfo.foundry.connect(app2_owner).setAppOperator(app2_appid, app2_operator)

            let platformMortgageFee = 100
            let platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7]
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFee(app2_appid, platformMortgageFee)
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFeeRecipient(app2_appid, platformMortgageFeeRecipient)

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;
            let app2_mortgageNFT = (await ethers.getContractAt("MortgageNFT", app2.mortgageNFT)) as MortgageNFT;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [10000, 90000], [nft_1_owner.address, nft_2_owner.address], ["0x12", "0x13"])

            let tokenAddr = await info.coreContractInfo.foundry.token(app2_appid, tid);
            let token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(20000)
            await app2_market.connect(user1).buy(tid, buyAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })

            let mortgageNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await expect(
                app2_market.connect(user1).mortgageNew(tid, mortgageNewAmount)
            ).revertedWithCustomError(token, "ERC20InsufficientAllowance")
            await token.connect(user1).approve(app2_market.getAddress(), mortgageNewAmount)

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let platform_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let result = await app2_market.connect(user1).mortgageNew.staticCall(tid, mortgageNewAmount)
            let res = await app2_market.connect(user1).mortgageNew(tid, mortgageNewAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let platform_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("1005050505050505051")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 + result.payTokenAmount - gas)

            let app_owner_mortgage_fee = app2_owner_mortgage_fee_eth_balance_2 - app2_owner_mortgage_fee_eth_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_eth_balance_2 - platform_mortgage_fee_eth_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(0, mortgageNewAmount)

            expect(result.payTokenAmount).eq(curve_amount - platform_mortgage_fee - app_owner_mortgage_fee)

            expect(curve_amount / app_owner_mortgage_fee).eq(100000 / app2_fees.appOwnerMortgageFee)
            expect(curve_amount / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(app_owner_mortgage_fee / platform_mortgage_fee).eq(4)

            expect(app2_market_eth_balance_1 - app2_market_eth_balance_2).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_1 - user1_token_balance_2).eq(mortgageNewAmount)
            expect(app2_market_token_balance_2 - app2_market_token_balance_1).eq(mortgageNewAmount)

            // redeem
            let redeemAmount = mortgageNewAmount / BigInt(2)
            await expect(
                app2_market.connect(user1).redeem(result.nftTokenId, redeemAmount)
            ).revertedWith("VE")

            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())
            let app2_market_eth_balance_3 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let result2 = await app2_market.connect(user1).redeem.staticCall(result.nftTokenId, redeemAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })
            let res2 = await app2_market.connect(user1).redeem(result.nftTokenId, redeemAmount, { value: result2 })
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())
            let app2_market_eth_balance_4 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result2).eq("507588447286939750")
            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - result2 - gas2)

            let curve_amount_redeem = await app2_market.getPayTokenAmount(mortgageNewAmount - redeemAmount, redeemAmount)

            expect(result2).eq(curve_amount_redeem)

            expect(app2_market_eth_balance_4 - app2_market_eth_balance_3).eq(curve_amount_redeem)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_4 - user1_token_balance_3).eq(redeemAmount)
            expect(app2_market_token_balance_3 - app2_market_token_balance_4).eq(redeemAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(1)
        });

        it("redeem with erc20", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = (await (
                await ethers.getContractFactory("SimpleToken")
            ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

            let app2_fees = {
                appOwnerBuyFee: 300,
                appOwnerSellFee: 200,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 500,
            }

            let nft_1_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
            let nft_2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];

            let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];

            let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "uint256"],
                [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
            )

            await info.coreContractInfo.foundry.createApp(
                app2_name,
                app2_owner,
                await info.coreContractInfo.cpfCurveFactory.getAddress(),
                curveParams,
                app2_payToken,
                app2_fees);
            expect((await info.coreContractInfo.foundry.apps(app2_appid)).name).eq(app2_name);
            await info.coreContractInfo.foundry.connect(app2_owner).setAppOperator(app2_appid, app2_operator)

            let platformMortgageFee = 100
            let platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7]
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFee(app2_appid, platformMortgageFee)
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFeeRecipient(app2_appid, platformMortgageFeeRecipient)

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;
            let app2_mortgageNFT = (await ethers.getContractAt("MortgageNFT", app2.mortgageNFT)) as MortgageNFT;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [10000, 90000], [nft_1_owner.address, nft_2_owner.address], ["0x12", "0x13"])

            let tokenAddr = await info.coreContractInfo.foundry.token(app2_appid, tid);
            let token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(20000)
            await app2_payToken.transfer(user1.address, buyAmount * BigInt(2))
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), MAX_UINT256)
            await app2_market.connect(user1).buy(tid, buyAmount)

            let mortgageNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await expect(
                app2_market.connect(user1).mortgageNew(tid, mortgageNewAmount)
            ).revertedWithCustomError(token, "ERC20InsufficientAllowance")
            await token.connect(user1).approve(app2_market.getAddress(), mortgageNewAmount)

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let platform_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let result = await app2_market.connect(user1).mortgageNew.staticCall(tid, mortgageNewAmount)
            let res = await app2_market.connect(user1).mortgageNew(tid, mortgageNewAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let platform_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("1005050505050505051")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 + result.payTokenAmount)

            let app_owner_mortgage_fee = app2_owner_mortgage_fee_pay_token_balance_2 - app2_owner_mortgage_fee_pay_token_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_pay_token_balance_2 - platform_mortgage_fee_pay_token_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(0, mortgageNewAmount)

            expect(result.payTokenAmount).eq(curve_amount - platform_mortgage_fee - app_owner_mortgage_fee)

            expect(curve_amount / app_owner_mortgage_fee).eq(100000 / app2_fees.appOwnerMortgageFee)
            expect(curve_amount / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(app_owner_mortgage_fee / platform_mortgage_fee).eq(4)

            expect(app2_market_pay_token_balance_1 - app2_market_pay_token_balance_2).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_1 - user1_token_balance_2).eq(mortgageNewAmount)
            expect(app2_market_token_balance_2 - app2_market_token_balance_1).eq(mortgageNewAmount)

            // redeem
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), 0)
            await expect(
                app2_market.connect(user1).redeem(result.nftTokenId, mortgageNewAmount)
            ).revertedWithCustomError(app2_payToken, "ERC20InsufficientAllowance")

            await app2_payToken.connect(user1).approve(app2_market.getAddress(), mortgageNewAmount)
            let result2 = await app2_market.connect(user1).redeem.staticCall(result.nftTokenId, mortgageNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result2)

            let user1_pay_token_balance_3 = await app2_payToken.balanceOf(await user1.getAddress())
            let app2_market_pay_token_balance_3 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())

            let res2 = await app2_market.connect(user1).redeem(result.nftTokenId, mortgageNewAmount)
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_pay_token_balance_4 = await app2_payToken.balanceOf(await user1.getAddress())
            let app2_market_pay_token_balance_4 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - gas2)

            expect(result2).eq("1010101010101010101")
            expect(user1_pay_token_balance_4).eq(user1_pay_token_balance_3 - result2)

            let curve_amount_redeem = await app2_market.getPayTokenAmount(0, mortgageNewAmount)

            expect(result2).eq(curve_amount_redeem)

            expect(app2_market_pay_token_balance_4).eq(app2_market_pay_token_balance_3 + curve_amount_redeem)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_4).eq(user1_token_balance_3 + mortgageNewAmount)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 - mortgageNewAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(0)

        });

        it("redeem with erc20 | approve > need", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = (await (
                await ethers.getContractFactory("SimpleToken")
            ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

            let app2_fees = {
                appOwnerBuyFee: 300,
                appOwnerSellFee: 200,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 500,
            }

            let nft_1_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
            let nft_2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];

            let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];

            let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "uint256"],
                [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
            )

            await info.coreContractInfo.foundry.createApp(
                app2_name,
                app2_owner,
                await info.coreContractInfo.cpfCurveFactory.getAddress(),
                curveParams,
                app2_payToken,
                app2_fees);
            expect((await info.coreContractInfo.foundry.apps(app2_appid)).name).eq(app2_name);
            await info.coreContractInfo.foundry.connect(app2_owner).setAppOperator(app2_appid, app2_operator)

            let platformMortgageFee = 100
            let platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7]
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFee(app2_appid, platformMortgageFee)
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFeeRecipient(app2_appid, platformMortgageFeeRecipient)

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;
            let app2_mortgageNFT = (await ethers.getContractAt("MortgageNFT", app2.mortgageNFT)) as MortgageNFT;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [10000, 90000], [nft_1_owner.address, nft_2_owner.address], ["0x12", "0x13"])

            let tokenAddr = await info.coreContractInfo.foundry.token(app2_appid, tid);
            let token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(20000)
            await app2_payToken.transfer(user1.address, buyAmount * BigInt(2))
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), MAX_UINT256)
            await app2_market.connect(user1).buy(tid, buyAmount)

            let mortgageNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await expect(
                app2_market.connect(user1).mortgageNew(tid, mortgageNewAmount)
            ).revertedWithCustomError(token, "ERC20InsufficientAllowance")
            await token.connect(user1).approve(app2_market.getAddress(), mortgageNewAmount)

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let platform_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let result = await app2_market.connect(user1).mortgageNew.staticCall(tid, mortgageNewAmount)
            let res = await app2_market.connect(user1).mortgageNew(tid, mortgageNewAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let platform_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("1005050505050505051")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 + result.payTokenAmount)

            let app_owner_mortgage_fee = app2_owner_mortgage_fee_pay_token_balance_2 - app2_owner_mortgage_fee_pay_token_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_pay_token_balance_2 - platform_mortgage_fee_pay_token_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(0, mortgageNewAmount)

            expect(result.payTokenAmount).eq(curve_amount - platform_mortgage_fee - app_owner_mortgage_fee)

            expect(curve_amount / app_owner_mortgage_fee).eq(100000 / app2_fees.appOwnerMortgageFee)
            expect(curve_amount / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(app_owner_mortgage_fee / platform_mortgage_fee).eq(4)

            expect(app2_market_pay_token_balance_1 - app2_market_pay_token_balance_2).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_1 - user1_token_balance_2).eq(mortgageNewAmount)
            expect(app2_market_token_balance_2 - app2_market_token_balance_1).eq(mortgageNewAmount)

            // redeem
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), 0)
            await expect(
                app2_market.connect(user1).redeem(result.nftTokenId, mortgageNewAmount)
            ).revertedWithCustomError(app2_payToken, "ERC20InsufficientAllowance")

            await app2_payToken.connect(user1).approve(app2_market.getAddress(), mortgageNewAmount)
            let result2 = await app2_market.connect(user1).redeem.staticCall(result.nftTokenId, mortgageNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result2 * BigInt(2))

            let user1_pay_token_balance_3 = await app2_payToken.balanceOf(await user1.getAddress())
            let app2_market_pay_token_balance_3 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())

            let res2 = await app2_market.connect(user1).redeem(result.nftTokenId, mortgageNewAmount)
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_pay_token_balance_4 = await app2_payToken.balanceOf(await user1.getAddress())
            let app2_market_pay_token_balance_4 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - gas2)

            expect(result2).eq("1010101010101010101")
            expect(user1_pay_token_balance_4).eq(user1_pay_token_balance_3 - result2)

            let curve_amount_redeem = await app2_market.getPayTokenAmount(0, mortgageNewAmount)

            expect(result2).eq(curve_amount_redeem)

            expect(app2_market_pay_token_balance_4).eq(app2_market_pay_token_balance_3 + curve_amount_redeem)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_4).eq(user1_token_balance_3 + mortgageNewAmount)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 - mortgageNewAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(0)

        });

        it("redeem with erc20 | redeem part", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = (await (
                await ethers.getContractFactory("SimpleToken")
            ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

            let app2_fees = {
                appOwnerBuyFee: 300,
                appOwnerSellFee: 200,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 500,
            }

            let nft_1_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
            let nft_2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];

            let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];

            let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "uint256"],
                [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
            )

            await info.coreContractInfo.foundry.createApp(
                app2_name,
                app2_owner,
                await info.coreContractInfo.cpfCurveFactory.getAddress(),
                curveParams,
                app2_payToken,
                app2_fees);
            expect((await info.coreContractInfo.foundry.apps(app2_appid)).name).eq(app2_name);
            await info.coreContractInfo.foundry.connect(app2_owner).setAppOperator(app2_appid, app2_operator)

            let platformMortgageFee = 100
            let platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7]
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFee(app2_appid, platformMortgageFee)
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFeeRecipient(app2_appid, platformMortgageFeeRecipient)

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;
            let app2_mortgageNFT = (await ethers.getContractAt("MortgageNFT", app2.mortgageNFT)) as MortgageNFT;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [10000, 90000], [nft_1_owner.address, nft_2_owner.address], ["0x12", "0x13"])

            let tokenAddr = await info.coreContractInfo.foundry.token(app2_appid, tid);
            let token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(20000)
            await app2_payToken.transfer(user1.address, buyAmount * BigInt(2))
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), MAX_UINT256)
            await app2_market.connect(user1).buy(tid, buyAmount)

            let mortgageNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await expect(
                app2_market.connect(user1).mortgageNew(tid, mortgageNewAmount)
            ).revertedWithCustomError(token, "ERC20InsufficientAllowance")
            await token.connect(user1).approve(app2_market.getAddress(), mortgageNewAmount)

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let platform_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let result = await app2_market.connect(user1).mortgageNew.staticCall(tid, mortgageNewAmount)
            let res = await app2_market.connect(user1).mortgageNew(tid, mortgageNewAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let platform_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("1005050505050505051")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 + result.payTokenAmount)

            let app_owner_mortgage_fee = app2_owner_mortgage_fee_pay_token_balance_2 - app2_owner_mortgage_fee_pay_token_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_pay_token_balance_2 - platform_mortgage_fee_pay_token_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(0, mortgageNewAmount)

            expect(result.payTokenAmount).eq(curve_amount - platform_mortgage_fee - app_owner_mortgage_fee)

            expect(curve_amount / app_owner_mortgage_fee).eq(100000 / app2_fees.appOwnerMortgageFee)
            expect(curve_amount / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(app_owner_mortgage_fee / platform_mortgage_fee).eq(4)

            expect(app2_market_pay_token_balance_1 - app2_market_pay_token_balance_2).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_1 - user1_token_balance_2).eq(mortgageNewAmount)
            expect(app2_market_token_balance_2 - app2_market_token_balance_1).eq(mortgageNewAmount)

            // redeem
            let redeemAmount = mortgageNewAmount / BigInt(2)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), 0)
            await expect(
                app2_market.connect(user1).redeem(result.nftTokenId, redeemAmount)
            ).revertedWithCustomError(app2_payToken, "ERC20InsufficientAllowance")

            await app2_payToken.connect(user1).approve(app2_market.getAddress(), redeemAmount)
            let result2 = await app2_market.connect(user1).redeem.staticCall(result.nftTokenId, redeemAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result2)

            let user1_pay_token_balance_3 = await app2_payToken.balanceOf(await user1.getAddress())
            let app2_market_pay_token_balance_3 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())

            let res2 = await app2_market.connect(user1).redeem(result.nftTokenId, redeemAmount)
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_pay_token_balance_4 = await app2_payToken.balanceOf(await user1.getAddress())
            let app2_market_pay_token_balance_4 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - gas2)

            expect(result2).eq("507588447286939750")
            expect(user1_pay_token_balance_4).eq(user1_pay_token_balance_3 - result2)

            let curve_amount_redeem = await app2_market.getPayTokenAmount(mortgageNewAmount - redeemAmount, redeemAmount)

            expect(result2).eq(curve_amount_redeem)

            expect(app2_market_pay_token_balance_4).eq(app2_market_pay_token_balance_3 + curve_amount_redeem)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_4).eq(user1_token_balance_3 + redeemAmount)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 - redeemAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(1)

        });
    });
});
