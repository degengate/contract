import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { getTokenAmountWei } from "./shared/utils";
import { ethers } from "hardhat";
import { Market, SimpleToken } from "../typechain-types";
import { MaxUint256, ZeroAddress } from "ethers";

describe("Market", function () {
    describe("buy", function () {
        it("buy revert", async function () {
            const info = (await loadFixture(deployAllContracts)).xMemeAllContractInfo;
            await info.xMeme.setSystemReady(true)

            let tid = "t1";

            await info.xMeme.connect(info.userWallet).createTokenAndMultiply(tid, 1, { value: BigInt(10) ** BigInt(20) });

            // not tid
            await expect(
                info.market.buy("t2222", getTokenAmountWei(1000)),
            ).revertedWith("TE");
            // value < need
            await expect(
                info.market.buy(tid, getTokenAmountWei(1000), { value: 1 }),
            ).revertedWith("VE");
            // buy amount > 100W
            await expect(
                info.market.buy(tid, getTokenAmountWei(1000000))
            ).revertedWithPanic("0x11");
            // buy amount = 1000W
            await expect(
                info.market.buy(tid, getTokenAmountWei(1000000) - BigInt(1))
            ).revertedWithPanic("0x12");
            // buy 0
            await expect(info.market.buy(tid, 0)).revertedWith("TAE");
        });

        it("buy revert erc20", async function () {
            const info = (await loadFixture(deployAllContracts));

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
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 14],
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

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [], [], [])

            // not tid
            await expect(
                app2_market.buy("t2222", getTokenAmountWei(1000)),
            ).revertedWith("TE");
            // approve < need
            await app2_payToken.approve(await app2_market.getAddress(), 1);
            await expect(
                app2_market.buy(tid, getTokenAmountWei(1000)),
            ).revertedWithCustomError(app2_payToken, "ERC20InsufficientAllowance");
            // buy amount > 100W
            await app2_payToken.approve(await app2_market.getAddress(), MaxUint256);
            await expect(
                app2_market.buy(tid, getTokenAmountWei(1000000) + BigInt(1))
            ).revertedWithPanic("0x11");
            // buy amount = 1000W
            await app2_payToken.approve(await app2_market.getAddress(), MaxUint256);
            await expect(
                app2_market.buy(tid, getTokenAmountWei(1000000))
            ).revertedWithPanic("0x12");
            // buy 0
            await expect(app2_market.buy(tid, 0)).revertedWith("TAE");
        });

        it("buy with eth", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 200,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 500,
                nftOwnerSellFee: 600,
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

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [10000, 90000], [nft_1_owner.address, nft_2_owner.address], ["0x12", "0x13"])

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_1 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_1 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result = await app2_market.connect(user1).buy.staticCall(tid, BigInt(10) ** BigInt(18) * BigInt(10000), { value: BigInt(10) ** BigInt(18) * BigInt(10000) })
            let res = await app2_market.connect(user1).buy(tid, buyAmount, { value: result })
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_2 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_2 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result).eq("1017171717171717171")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - result - gas)

            let nft_fee = (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1) + (nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1)
            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(0, buyAmount)

            expect(result).eq(curve_amount + nft_fee + app_owner_fee)
            expect(curve_amount / nft_fee).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount / app_owner_fee).eq(100000 / app2_fees.appOwnerBuyFee)
            expect((nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1) / (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1)).eq(9)

            expect(app2_market_eth_balance_2 - app2_market_eth_balance_1).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_2 - user1_token_balance_1).eq(buyAmount)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1).eq(0)
        });

        it("buy with eth | value > need", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 200,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 500,
                nftOwnerSellFee: 600,
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

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [10000, 90000], [nft_1_owner.address, nft_2_owner.address], ["0x12", "0x13"])

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_1 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_1 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result = await app2_market.connect(user1).buy.staticCall(tid, BigInt(10) ** BigInt(18) * BigInt(10000), { value: BigInt(10) ** BigInt(18) * BigInt(10000) })
            let res = await app2_market.connect(user1).buy(tid, buyAmount, { value: result * BigInt(21) })
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_2 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_2 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result).eq("1017171717171717171")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - result - gas)

            let nft_fee = (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1) + (nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1)
            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(0, buyAmount)

            expect(result).eq(curve_amount + nft_fee + app_owner_fee)
            expect(curve_amount / nft_fee).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount / app_owner_fee).eq(100000 / app2_fees.appOwnerBuyFee)
            expect((nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1) / (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1)).eq(9)

            expect(app2_market_eth_balance_2 - app2_market_eth_balance_1).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_2 - user1_token_balance_1).eq(buyAmount)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1).eq(0)
        });

        it("buy with eth | have nft | no fee", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 0,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 0,
                nftOwnerSellFee: 600,
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

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [10000, 90000], [nft_1_owner.address, nft_2_owner.address], ["0x12", "0x13"])

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_1 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_1 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result = await app2_market.connect(user1).buy.staticCall(tid, BigInt(10) ** BigInt(18) * BigInt(10000), { value: BigInt(10) ** BigInt(18) * BigInt(10000) })
            let res = await app2_market.connect(user1).buy(tid, buyAmount, { value: result })
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_2 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_2 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result).eq("1010101010101010101")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - result - gas)

            let nft_fee = (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1) + (nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1)
            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(0, buyAmount)

            expect(nft_fee).eq(0)
            expect(app_owner_fee).eq(0)
            expect(result).eq(curve_amount)
            expect(app2_market_eth_balance_2 - app2_market_eth_balance_1).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_2 - user1_token_balance_1).eq(buyAmount)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1).eq(0)
        });

        it("buy with eth | no nft | no fee", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 0,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 0,
                nftOwnerSellFee: 600,
            }

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

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [], [], [])

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result = await app2_market.connect(user1).buy.staticCall(tid, BigInt(10) ** BigInt(18) * BigInt(10000), { value: BigInt(10) ** BigInt(18) * BigInt(10000) })
            let res = await app2_market.connect(user1).buy(tid, buyAmount, { value: result })
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result).eq("1010101010101010101")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - result - gas)

            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(0, buyAmount)

            expect(app_owner_fee).eq(0)
            expect(result).eq(curve_amount)
            expect(app2_market_eth_balance_2 - app2_market_eth_balance_1).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_2 - user1_token_balance_1).eq(buyAmount)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1).eq(0)
        });

        it("buy with erc20", async function () {
            const info = (await loadFixture(deployAllContracts));

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

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [10000, 90000], [nft_1_owner.address, nft_2_owner.address], ["0x12", "0x13"])
            await app2_payToken.transfer(user1.address, BigInt(10) ** BigInt(22))
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MAX_UINT256)

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let user1_payToken_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_payToken_balance_1 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_payToken_balance_1 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_payToken_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_payToken_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result = await app2_market.connect(user1).buy.staticCall(tid, buyAmount)
            let res = await app2_market.connect(user1).buy(tid, buyAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let user1_payToken_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_payToken_balance_2 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_payToken_balance_2 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_payToken_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_payToken_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)

            expect(result).eq("1017171717171717171")
            expect(user1_payToken_balance_1 - user1_payToken_balance_2).eq(result)

            let nft_fee = (nft_1_owner_payToken_balance_2 - nft_1_owner_payToken_balance_1) + (nft_2_owner_payToken_balance_2 - nft_2_owner_payToken_balance_1)
            let app_owner_fee = app2_owner_fee_payToken_balance_2 - app2_owner_fee_payToken_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(0, buyAmount)

            expect(result).eq(curve_amount + nft_fee + app_owner_fee)
            expect(curve_amount / nft_fee).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount / app_owner_fee).eq(100000 / app2_fees.appOwnerBuyFee)
            expect((nft_2_owner_payToken_balance_2 - nft_2_owner_payToken_balance_1) / (nft_1_owner_payToken_balance_2 - nft_1_owner_payToken_balance_1)).eq(9)

            expect(app2_market_payToken_balance_2 - app2_market_payToken_balance_1).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_2 - user1_token_balance_1).eq(buyAmount)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1).eq(0)
        });

        it("buy with erc20 | have nft | no fee", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = (await (
                await ethers.getContractFactory("SimpleToken")
            ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

            let app2_fees = {
                appOwnerBuyFee: 0,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 0,
                nftOwnerSellFee: 600,
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

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [10000, 90000], [nft_1_owner.address, nft_2_owner.address], ["0x12", "0x13"])
            await app2_payToken.transfer(user1.address, BigInt(10) ** BigInt(22))
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MAX_UINT256)

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let user1_payToken_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_payToken_balance_1 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_payToken_balance_1 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_payToken_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_payToken_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result = await app2_market.connect(user1).buy.staticCall(tid, buyAmount)
            let res = await app2_market.connect(user1).buy(tid, buyAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let user1_payToken_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_payToken_balance_2 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_payToken_balance_2 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_payToken_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_payToken_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)

            expect(result).eq("1010101010101010101")
            expect(user1_payToken_balance_1 - user1_payToken_balance_2).eq(result)

            let nft_fee = (nft_1_owner_payToken_balance_2 - nft_1_owner_payToken_balance_1) + (nft_2_owner_payToken_balance_2 - nft_2_owner_payToken_balance_1)
            let app_owner_fee = app2_owner_fee_payToken_balance_2 - app2_owner_fee_payToken_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(0, buyAmount)

            expect(nft_fee).eq(0)
            expect(app_owner_fee).eq(0)
            expect(result).eq(curve_amount)
            expect(app2_market_payToken_balance_2 - app2_market_payToken_balance_1).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_2 - user1_token_balance_1).eq(buyAmount)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1).eq(0)
        });

        it("buy with erc20 | no nft | no fee", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = (await (
                await ethers.getContractFactory("SimpleToken")
            ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

            let app2_fees = {
                appOwnerBuyFee: 0,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 0,
                nftOwnerSellFee: 600,
            }

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

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [], [], [])
            await app2_payToken.transfer(user1.address, BigInt(10) ** BigInt(22))
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MAX_UINT256)

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let user1_payToken_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let app2_owner_fee_payToken_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_payToken_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result = await app2_market.connect(user1).buy.staticCall(tid, buyAmount)
            let res = await app2_market.connect(user1).buy(tid, buyAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let user1_payToken_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let app2_owner_fee_payToken_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_payToken_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)

            expect(result).eq("1010101010101010101")
            expect(user1_payToken_balance_1 - user1_payToken_balance_2).eq(result)

            let app_owner_fee = app2_owner_fee_payToken_balance_2 - app2_owner_fee_payToken_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(0, buyAmount)

            expect(app_owner_fee).eq(0)
            expect(result).eq(curve_amount)
            expect(app2_market_payToken_balance_2 - app2_market_payToken_balance_1).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_2 - user1_token_balance_1).eq(buyAmount)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1).eq(0)
        });
    });
});
