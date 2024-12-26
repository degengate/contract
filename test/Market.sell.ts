import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { getTokenAmountWei } from "./shared/utils";
import { ethers } from "hardhat";
import { Market, SimpleToken, Token } from "../typechain-types";
import { MaxUint256, ZeroAddress } from "ethers";

describe("Market", function () {
    describe("sell", function () {
        it("sell revert", async function () {
            const info = (await loadFixture(deployAllContracts)).xMemeAllContractInfo;
            await info.xMeme.setSystemReady(true)

            let user1 = info.wallets[info.nextWalletIndex + 1]
            let user2 = info.wallets[info.nextWalletIndex + 2]

            let tid_1 = "t1";
            let buyAmount_1_user_1 = getTokenAmountWei(1000)
            let buyAmount_1_user_2 = getTokenAmountWei(2000)
            await info.xMeme.connect(user1).createTokenAndBuy(tid_1, buyAmount_1_user_1, { value: BigInt(10) ** BigInt(20) });
            await info.market.connect(user2).buy(tid_1, buyAmount_1_user_2, { value: BigInt(10) ** BigInt(20) });

            let tid_2 = "t2";
            let buyAmount_2_user_1 = getTokenAmountWei(3000)
            let buyAmount_2_user_2 = getTokenAmountWei(4000)
            await info.xMeme.connect(user1).createTokenAndBuy(tid_2, buyAmount_2_user_1, { value: BigInt(10) ** BigInt(20) });
            await info.market.connect(user2).buy(tid_2, buyAmount_2_user_2, { value: BigInt(10) ** BigInt(20) });

            // not tid
            await expect(
                info.market.sell("t2222", getTokenAmountWei(1000)),
            ).revertedWith("TE");

            // not enough token
            await expect(
                info.market.connect(user1).sell(tid_1, buyAmount_1_user_1 + BigInt(1))
            ).revertedWith("TAE");
            await expect(
                info.market.connect(user1).sell(tid_2, buyAmount_2_user_1 + BigInt(1))
            ).revertedWith("TAE");

            // totalSupply not enough
            await expect(
                info.market.connect(user1).sell(tid_1, buyAmount_1_user_1 + buyAmount_1_user_2 + BigInt(1))
            ).revertedWith("TAE");

            // sell 0
            await expect(info.market.connect(user1).sell(tid_1, 0)).revertedWith("TAE");
        });

        it("sell revert erc20", async function () {
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

            // not tid
            await expect(
                app2_market.sell("t2222", getTokenAmountWei(1000)),
            ).revertedWith("TE");

            // not enough token
            await expect(
                app2_market.connect(user1).sell(tid_1, buyAmount_1_user_1 + BigInt(1))
            ).revertedWith("TAE");
            await expect(
                app2_market.connect(user1).sell(tid_2, buyAmount_2_user_1 + BigInt(1))
            ).revertedWith("TAE");

            // totalSupply not enough
            await expect(
                app2_market.connect(user1).sell(tid_1, buyAmount_1_user_1 + buyAmount_1_user_2 + BigInt(1))
            ).revertedWith("TAE");

            // sell 0
            await expect(app2_market.connect(user1).sell(tid_1, 0)).revertedWith("TAE");
        });

        it("sell with eth", async function () {
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

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [10000, 90000], [nft_1_owner.address, nft_2_owner.address], ["0x12", "0x13"])

            let tokenAddr = await info.coreContractInfo.foundry.token(app2_appid, tid);
            let token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(20000)
            await app2_market.connect(user1).buy(tid, buyAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })

            let sellAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await expect(
                app2_market.connect(user1).sell(tid, sellAmount)
            ).revertedWithCustomError(token, "ERC20InsufficientAllowance")
            await token.connect(user1).approve(app2_market.getAddress(), MAX_UINT256)

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_1 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_1 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let result = await app2_market.connect(user1).sell.staticCall(tid, sellAmount)
            let res = await app2_market.connect(user1).sell(tid, sellAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_2 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_2 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result).eq("1023500309214594929")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 + result - gas)

            let nft_fee = (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1) + (nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1)
            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(buyAmount - sellAmount, sellAmount)

            expect(result).eq(curve_amount - nft_fee - app_owner_fee)
            expect(curve_amount / nft_fee).eq(100000 / app2_fees.nftOwnerSellFee)
            expect(curve_amount / app_owner_fee).eq(100000 / app2_fees.appOwnerSellFee)
            expect((nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1) / (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1)).eq(9)

            expect(app2_market_eth_balance_1 - app2_market_eth_balance_2).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount - sellAmount)
            expect(user1_token_balance_1 - user1_token_balance_2).eq(sellAmount)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1).eq(0)
        });

        it("sell with eth | have nft | no fee", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 300,
                appOwnerSellFee: 0,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 0,
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

            let tokenAddr = await info.coreContractInfo.foundry.token(app2_appid, tid);
            let token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(20000)
            await app2_market.connect(user1).buy(tid, buyAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })

            let sellAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await expect(
                app2_market.connect(user1).sell(tid, sellAmount)
            ).revertedWithCustomError(token, "ERC20InsufficientAllowance")
            await token.connect(user1).approve(app2_market.getAddress(), MAX_UINT256)

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_1 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_1 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let result = await app2_market.connect(user1).sell.staticCall(tid, sellAmount)
            let res = await app2_market.connect(user1).sell(tid, sellAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_2 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_2 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result).eq("1030715316429602143")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 + result - gas)

            let nft_fee = (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1) + (nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1)
            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(buyAmount - sellAmount, sellAmount)

            expect(nft_fee).eq(0)
            expect(app_owner_fee).eq(0)
            expect(result).eq(curve_amount)
            expect(app2_market_eth_balance_1 - app2_market_eth_balance_2).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount - sellAmount)
            expect(user1_token_balance_1 - user1_token_balance_2).eq(sellAmount)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1).eq(0)
        });

        it("sell with eth | no nft | no fee", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 300,
                appOwnerSellFee: 0,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 0,
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

            let tokenAddr = await info.coreContractInfo.foundry.token(app2_appid, tid);
            let token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(20000)
            await app2_market.connect(user1).buy(tid, buyAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })

            let sellAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await expect(
                app2_market.connect(user1).sell(tid, sellAmount)
            ).revertedWithCustomError(token, "ERC20InsufficientAllowance")
            await token.connect(user1).approve(app2_market.getAddress(), MAX_UINT256)

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let result = await app2_market.connect(user1).sell.staticCall(tid, sellAmount)
            let res = await app2_market.connect(user1).sell(tid, sellAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result).eq("1030715316429602143")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 + result - gas)

            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(buyAmount - sellAmount, sellAmount)

            expect(app_owner_fee).eq(0)
            expect(result).eq(curve_amount)
            expect(app2_market_eth_balance_1 - app2_market_eth_balance_2).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount - sellAmount)
            expect(user1_token_balance_1 - user1_token_balance_2).eq(sellAmount)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1).eq(0)
        });

        it("sell with erc20", async function () {
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

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [10000, 90000], [nft_1_owner.address, nft_2_owner.address], ["0x12", "0x13"])

            let tokenAddr = await info.coreContractInfo.foundry.token(app2_appid, tid);
            let token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(20000)
            await app2_payToken.transfer(user1.address, buyAmount * BigInt(2))
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), MAX_UINT256)
            await app2_market.connect(user1).buy(tid, buyAmount)

            let sellAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await expect(
                app2_market.connect(user1).sell(tid, sellAmount)
            ).revertedWithCustomError(token, "ERC20InsufficientAllowance")
            await token.connect(user1).approve(app2_market.getAddress(), sellAmount)

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let result = await app2_market.connect(user1).sell.staticCall(tid, sellAmount)
            let res = await app2_market.connect(user1).sell(tid, sellAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)
            expect(result).eq("1023500309214594929")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 + result)

            let nft_fee = (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1) + (nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1)
            let app_owner_fee = app2_owner_fee_pay_token_balance_2 - app2_owner_fee_pay_token_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(buyAmount - sellAmount, sellAmount)

            expect(result).eq(curve_amount - nft_fee - app_owner_fee)
            expect(curve_amount / nft_fee).eq(100000 / app2_fees.nftOwnerSellFee)
            expect(curve_amount / app_owner_fee).eq(100000 / app2_fees.appOwnerSellFee)
            expect((nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1) / (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1)).eq(9)

            expect(app2_market_pay_token_balance_1 - app2_market_pay_token_balance_2).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount - sellAmount)
            expect(user1_token_balance_1 - user1_token_balance_2).eq(sellAmount)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1).eq(0)
        });

        it("sell with erc20 | have nft | no fee", async function () {
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
                appOwnerSellFee: 0,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 0,
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

            let tokenAddr = await info.coreContractInfo.foundry.token(app2_appid, tid);
            let token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(20000)
            await app2_payToken.transfer(user1.address, buyAmount * BigInt(2))
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), MAX_UINT256)
            await app2_market.connect(user1).buy(tid, buyAmount)

            let sellAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await expect(
                app2_market.connect(user1).sell(tid, sellAmount)
            ).revertedWithCustomError(token, "ERC20InsufficientAllowance")
            await token.connect(user1).approve(app2_market.getAddress(), sellAmount)

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let result = await app2_market.connect(user1).sell.staticCall(tid, sellAmount)
            let res = await app2_market.connect(user1).sell(tid, sellAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)
            expect(result).eq("1030715316429602143")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 + result)

            let nft_fee = (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1) + (nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1)
            let app_owner_fee = app2_owner_fee_pay_token_balance_2 - app2_owner_fee_pay_token_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(buyAmount - sellAmount, sellAmount)

            expect(nft_fee).eq(0)
            expect(app_owner_fee).eq(0)
            expect(result).eq(curve_amount)

            expect(app2_market_pay_token_balance_1 - app2_market_pay_token_balance_2).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount - sellAmount)
            expect(user1_token_balance_1 - user1_token_balance_2).eq(sellAmount)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1).eq(0)
        });

        it("sell with erc20 | no nft | no fee", async function () {
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
                appOwnerSellFee: 0,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 0,
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

            let tokenAddr = await info.coreContractInfo.foundry.token(app2_appid, tid);
            let token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(20000)
            await app2_payToken.transfer(user1.address, buyAmount * BigInt(2))
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), MAX_UINT256)
            await app2_market.connect(user1).buy(tid, buyAmount)

            let sellAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await expect(
                app2_market.connect(user1).sell(tid, sellAmount)
            ).revertedWithCustomError(token, "ERC20InsufficientAllowance")
            await token.connect(user1).approve(app2_market.getAddress(), sellAmount)

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let app2_owner_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let result = await app2_market.connect(user1).sell.staticCall(tid, sellAmount)
            let res = await app2_market.connect(user1).sell(tid, sellAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let app2_owner_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)
            expect(result).eq("1030715316429602143")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 + result)

            let app_owner_fee = app2_owner_fee_pay_token_balance_2 - app2_owner_fee_pay_token_balance_1
            let curve_amount = await app2_market.getPayTokenAmount(buyAmount - sellAmount, sellAmount)

            expect(app_owner_fee).eq(0)
            expect(result).eq(curve_amount)

            expect(app2_market_pay_token_balance_1 - app2_market_pay_token_balance_2).eq(curve_amount)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount - sellAmount)
            expect(user1_token_balance_1 - user1_token_balance_2).eq(sellAmount)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1).eq(0)
        });
    });
});
