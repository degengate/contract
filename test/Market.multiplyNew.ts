import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { getTokenAmountWei } from "./shared/utils";
import { ethers } from "hardhat";
import { Market, SimpleToken, Token, MortgageNFT } from "../typechain-types";
import { MaxUint256, ZeroAddress } from "ethers";

describe("Market", function () {
    describe("multiplyNew", function () {
        it("multiplyNew revert", async function () {
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
                info.market.multiplyNew("t2222", getTokenAmountWei(1000)),
            ).revertedWith("TE");

            // value < need
            await expect(
                info.market.connect(user1).multiplyNew(tid_1, BigInt(10) ** BigInt(20), { value: BigInt(10) ** BigInt(10) })
            ).revertedWith("VE");

            // multiplyNew 0
            await expect(info.market.connect(user1).multiplyNew(tid_1, 0)).revertedWith("TAE");

            // multiplyNew 100w
            await expect(info.market.connect(user1).multiplyNew(tid_1, BigInt(10) ** BigInt(26))).revertedWithPanic(0x11);
        });

        it("multiplyNew revert erc20", async function () {
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
                app2_market.multiplyNew("t2222", getTokenAmountWei(1000)),
            ).revertedWith("TE");

            // value < need
            await app2_payToken.transfer(user1.address, getTokenAmountWei(1000))
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MaxUint256)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid_1, BigInt(10) ** BigInt(20))
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result.payTokenAmount - BigInt(1))
            await expect(
                app2_market.connect(user1).multiplyNew(tid_1, BigInt(10) ** BigInt(20))
            ).revertedWithCustomError(app2_payToken, "ERC20InsufficientAllowance");

            // multiplyNew 0
            await expect(app2_market.connect(user1).multiplyNew(tid_1, 0)).revertedWith("TAE");

            // multiplyNew 100w
            await expect(app2_market.connect(user1).multiplyNew(tid_1, BigInt(10) ** BigInt(26))).revertedWithPanic(0x11);
        });

        it("multiplyNew with eth", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 600,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 800,
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

            let platformMortgageFee = 200
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

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_1 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_1 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let multiplyNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount, { value: multiplyNewAmount })
            let res = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount, { value: result.payTokenAmount })
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_2 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_2 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("20202020202020200")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - result.payTokenAmount - gas)

            let nft_fee = (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1) + (nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1)
            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_eth_balance_2 - platform_mortgage_fee_eth_balance_1
            let curve_amount_buy_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)
            let curve_amount_multiply_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)

            expect(curve_amount_buy_1).eq(curve_amount_multiply_1)
            expect(result.payTokenAmount).eq(nft_fee + app_owner_fee + platform_mortgage_fee)
            expect(curve_amount_multiply_1 / (nft_fee + app_owner_fee + platform_mortgage_fee)).eq(50)

            expect(curve_amount_buy_1 / nft_fee).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_buy_1 / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(nft_fee / platform_mortgage_fee).eq(4)
            expect(app_owner_fee / platform_mortgage_fee).eq(5)

            expect((nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1) / (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1)).eq(9)

            expect(app2_market_eth_balance_2).eq(app2_market_eth_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 + multiplyNewAmount)

            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount)

            // 2
            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_3 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_3 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_3 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_3 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_3 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let multiplyNewAmount_2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result2 = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount_2, { value: multiplyNewAmount_2 })
            let res2 = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount_2, { value: result2.payTokenAmount })
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_4 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_4 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_4 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_4 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_4 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result2.nftTokenId).eq(2)
            expect(result2.payTokenAmount).eq("41104926819212530")
            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - result2.payTokenAmount - gas2)

            let nft_fee_2 = (nft_1_owner_eth_balance_4 - nft_1_owner_eth_balance_3) + (nft_2_owner_eth_balance_4 - nft_2_owner_eth_balance_3)
            let app_owner_fee_2 = app2_owner_fee_eth_balance_4 - app2_owner_fee_eth_balance_3
            let platform_mortgage_fee_2 = platform_mortgage_fee_eth_balance_4 - platform_mortgage_fee_eth_balance_3
            let curve_amount_buy_2 = await app2_market.getPayTokenAmount(multiplyNewAmount, multiplyNewAmount_2)
            let curve_amount_multiply_2 = await app2_market.getPayTokenAmount(0, multiplyNewAmount_2)

            expect(curve_amount_buy_2).gt(curve_amount_multiply_2)
            expect(result2.payTokenAmount).eq(curve_amount_buy_2 - curve_amount_multiply_2 + nft_fee_2 + app_owner_fee_2 + platform_mortgage_fee_2)

            expect(curve_amount_buy_2 / nft_fee_2).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_multiply_2 / platform_mortgage_fee_2).eq(100000 / platformMortgageFee)

            expect(app2_market_eth_balance_4).eq(app2_market_eth_balance_3 + (curve_amount_buy_2 - curve_amount_multiply_2))

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_2)
            expect(user1_token_balance_4).eq(user1_token_balance_3).eq(0)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 + multiplyNewAmount_2)

            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result2.nftTokenId)).amount).eq(multiplyNewAmount_2)

        });

        it("multiplyNew with eth | value > need", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 600,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 800,
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

            let platformMortgageFee = 200
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

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_1 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_1 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let multiplyNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount, { value: multiplyNewAmount })
            let res = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount, { value: result.payTokenAmount * BigInt(2) })
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_2 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_2 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("20202020202020200")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - result.payTokenAmount - gas)

            let nft_fee = (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1) + (nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1)
            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_eth_balance_2 - platform_mortgage_fee_eth_balance_1
            let curve_amount_buy_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)
            let curve_amount_multiply_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)

            expect(curve_amount_buy_1).eq(curve_amount_multiply_1)
            expect(result.payTokenAmount).eq(nft_fee + app_owner_fee + platform_mortgage_fee)
            expect(curve_amount_multiply_1 / (nft_fee + app_owner_fee + platform_mortgage_fee)).eq(50)

            expect(curve_amount_buy_1 / nft_fee).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_buy_1 / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(nft_fee / platform_mortgage_fee).eq(4)
            expect(app_owner_fee / platform_mortgage_fee).eq(5)

            expect(app2_market_eth_balance_2).eq(app2_market_eth_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 + multiplyNewAmount)

            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount)

            // 2
            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_3 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_3 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_3 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_3 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_3 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let multiplyNewAmount_2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result2 = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount_2, { value: multiplyNewAmount_2 })
            let res2 = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount_2, { value: result2.payTokenAmount * BigInt(2) })
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_4 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_4 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_4 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_4 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_4 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result2.nftTokenId).eq(2)
            expect(result2.payTokenAmount).eq("41104926819212530")
            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - result2.payTokenAmount - gas2)

            let nft_fee_2 = (nft_1_owner_eth_balance_4 - nft_1_owner_eth_balance_3) + (nft_2_owner_eth_balance_4 - nft_2_owner_eth_balance_3)
            let app_owner_fee_2 = app2_owner_fee_eth_balance_4 - app2_owner_fee_eth_balance_3
            let platform_mortgage_fee_2 = platform_mortgage_fee_eth_balance_4 - platform_mortgage_fee_eth_balance_3
            let curve_amount_buy_2 = await app2_market.getPayTokenAmount(multiplyNewAmount, multiplyNewAmount_2)
            let curve_amount_multiply_2 = await app2_market.getPayTokenAmount(0, multiplyNewAmount_2)

            expect(curve_amount_buy_2).gt(curve_amount_multiply_2)
            expect(result2.payTokenAmount).eq(curve_amount_buy_2 - curve_amount_multiply_2 + nft_fee_2 + app_owner_fee_2 + platform_mortgage_fee_2)

            expect(curve_amount_buy_2 / nft_fee_2).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_multiply_2 / platform_mortgage_fee_2).eq(100000 / platformMortgageFee)

            expect(app2_market_eth_balance_4).eq(app2_market_eth_balance_3 + (curve_amount_buy_2 - curve_amount_multiply_2))

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_2)
            expect(user1_token_balance_4).eq(user1_token_balance_3).eq(0)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 + multiplyNewAmount_2)

            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result2.nftTokenId)).amount).eq(multiplyNewAmount_2)

        });

        it("multiplyNew with eth | value > need | no nft buy fee", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 600,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 0,
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

            let platformMortgageFee = 200
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

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_1 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_1 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let multiplyNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount, { value: multiplyNewAmount })
            let res = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount, { value: result.payTokenAmount * BigInt(2) })
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_2 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_2 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("12121212121212120")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - result.payTokenAmount - gas)

            let nft_fee = (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1) + (nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1)
            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_eth_balance_2 - platform_mortgage_fee_eth_balance_1
            let curve_amount_buy_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)
            let curve_amount_multiply_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)

            expect(nft_fee).eq(0)
            expect(curve_amount_buy_1).eq(curve_amount_multiply_1)
            expect(result.payTokenAmount).eq(app_owner_fee + platform_mortgage_fee)
            expect(curve_amount_multiply_1 / (app_owner_fee + platform_mortgage_fee)).eq(83)

            expect(curve_amount_buy_1 / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(app_owner_fee / platform_mortgage_fee).eq(5)

            expect(app2_market_eth_balance_2).eq(app2_market_eth_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 + multiplyNewAmount)

            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount)

            // 2
            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_3 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_3 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_3 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_3 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_3 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let multiplyNewAmount_2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result2 = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount_2, { value: multiplyNewAmount_2 })
            let res2 = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount_2, { value: result2.payTokenAmount * BigInt(2) })
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_4 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_4 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_4 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_4 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_4 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result2.nftTokenId).eq(2)
            expect(result2.payTokenAmount).eq("32859204287775714")
            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - result2.payTokenAmount - gas2)

            let nft_fee_2 = (nft_1_owner_eth_balance_4 - nft_1_owner_eth_balance_3) + (nft_2_owner_eth_balance_4 - nft_2_owner_eth_balance_3)
            let app_owner_fee_2 = app2_owner_fee_eth_balance_4 - app2_owner_fee_eth_balance_3
            let platform_mortgage_fee_2 = platform_mortgage_fee_eth_balance_4 - platform_mortgage_fee_eth_balance_3
            let curve_amount_buy_2 = await app2_market.getPayTokenAmount(multiplyNewAmount, multiplyNewAmount_2)
            let curve_amount_multiply_2 = await app2_market.getPayTokenAmount(0, multiplyNewAmount_2)

            expect(nft_fee_2).eq(0)
            expect(curve_amount_buy_2).gt(curve_amount_multiply_2)
            expect(result2.payTokenAmount).eq(curve_amount_buy_2 - curve_amount_multiply_2 + app_owner_fee_2 + platform_mortgage_fee_2)

            expect(curve_amount_multiply_2 / platform_mortgage_fee_2).eq(100000 / platformMortgageFee)

            expect(app2_market_eth_balance_4).eq(app2_market_eth_balance_3 + (curve_amount_buy_2 - curve_amount_multiply_2))

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_2)
            expect(user1_token_balance_4).eq(user1_token_balance_3).eq(0)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 + multiplyNewAmount_2)

            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result2.nftTokenId)).amount).eq(multiplyNewAmount_2)

        });

        it("multiplyNew with eth | value > need | no nft buy fee | no nft", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 600,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 0,
                nftOwnerSellFee: 500,
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

            let platformMortgageFee = 200
            let platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7]
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFee(app2_appid, platformMortgageFee)
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFeeRecipient(app2_appid, platformMortgageFeeRecipient)

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;
            let app2_mortgageNFT = (await ethers.getContractAt("MortgageNFT", app2.mortgageNFT)) as MortgageNFT;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [], [], [])

            let tokenAddr = await info.coreContractInfo.foundry.token(app2_appid, tid);
            let token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let platform_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let multiplyNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount, { value: multiplyNewAmount })
            let res = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount, { value: result.payTokenAmount * BigInt(2) })
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let platform_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("12121212121212120")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - result.payTokenAmount - gas)

            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_eth_balance_2 - platform_mortgage_fee_eth_balance_1
            let curve_amount_buy_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)
            let curve_amount_multiply_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)

            expect(curve_amount_buy_1).eq(curve_amount_multiply_1)
            expect(result.payTokenAmount).eq(app_owner_fee + platform_mortgage_fee)
            expect(curve_amount_multiply_1 / (app_owner_fee + platform_mortgage_fee)).eq(83)

            expect(curve_amount_buy_1 / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(app_owner_fee / platform_mortgage_fee).eq(5)

            expect(app2_market_eth_balance_2).eq(app2_market_eth_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 + multiplyNewAmount)

            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount)

            // 2
            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())
            let platform_mortgage_fee_eth_balance_3 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_3 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_3 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let multiplyNewAmount_2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result2 = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount_2, { value: multiplyNewAmount_2 })
            let res2 = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount_2, { value: result2.payTokenAmount * BigInt(2) })
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())
            let platform_mortgage_fee_eth_balance_4 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_4 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_4 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result2.nftTokenId).eq(2)
            expect(result2.payTokenAmount).eq("32859204287775714")
            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - result2.payTokenAmount - gas2)

            let app_owner_fee_2 = app2_owner_fee_eth_balance_4 - app2_owner_fee_eth_balance_3
            let platform_mortgage_fee_2 = platform_mortgage_fee_eth_balance_4 - platform_mortgage_fee_eth_balance_3
            let curve_amount_buy_2 = await app2_market.getPayTokenAmount(multiplyNewAmount, multiplyNewAmount_2)
            let curve_amount_multiply_2 = await app2_market.getPayTokenAmount(0, multiplyNewAmount_2)

            expect(curve_amount_buy_2).gt(curve_amount_multiply_2)
            expect(result2.payTokenAmount).eq(curve_amount_buy_2 - curve_amount_multiply_2 + app_owner_fee_2 + platform_mortgage_fee_2)

            expect(curve_amount_multiply_2 / platform_mortgage_fee_2).eq(100000 / platformMortgageFee)

            expect(app2_market_eth_balance_4).eq(app2_market_eth_balance_3 + (curve_amount_buy_2 - curve_amount_multiply_2))

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_2)
            expect(user1_token_balance_4).eq(user1_token_balance_3).eq(0)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 + multiplyNewAmount_2)

            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result2.nftTokenId)).amount).eq(multiplyNewAmount_2)

        });

        it("multiplyNew with eth | value > need | no app buy fee", async function () {
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
                nftOwnerBuyFee: 800,
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

            let platformMortgageFee = 200
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

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_1 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_1 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let multiplyNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount, { value: multiplyNewAmount })
            let res = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount, { value: result.payTokenAmount * BigInt(2) })
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_2 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_2 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("14141414141414140")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - result.payTokenAmount - gas)

            let nft_fee = (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1) + (nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1)
            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_eth_balance_2 - platform_mortgage_fee_eth_balance_1
            let curve_amount_buy_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)
            let curve_amount_multiply_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)

            expect(curve_amount_buy_1).eq(curve_amount_multiply_1)
            expect(result.payTokenAmount).eq(nft_fee + app_owner_fee + platform_mortgage_fee)
            expect(curve_amount_multiply_1 / (nft_fee + app_owner_fee + platform_mortgage_fee)).eq(71)

            expect(curve_amount_buy_1 / nft_fee).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_buy_1 / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(nft_fee / platform_mortgage_fee).eq(4)
            expect(app_owner_fee / platform_mortgage_fee).eq(2)

            expect(app2_market_eth_balance_2).eq(app2_market_eth_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 + multiplyNewAmount)

            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount)

            // 2
            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_3 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_3 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_3 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_3 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_3 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let multiplyNewAmount_2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result2 = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount_2, { value: multiplyNewAmount_2 })
            let res2 = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount_2, { value: result2.payTokenAmount * BigInt(2) })
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_4 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_4 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_4 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_4 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_4 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result2.nftTokenId).eq(2)
            expect(result2.payTokenAmount).eq("34920634920634918")
            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - result2.payTokenAmount - gas2)

            let nft_fee_2 = (nft_1_owner_eth_balance_4 - nft_1_owner_eth_balance_3) + (nft_2_owner_eth_balance_4 - nft_2_owner_eth_balance_3)
            let app_owner_fee_2 = app2_owner_fee_eth_balance_4 - app2_owner_fee_eth_balance_3
            let platform_mortgage_fee_2 = platform_mortgage_fee_eth_balance_4 - platform_mortgage_fee_eth_balance_3
            let curve_amount_buy_2 = await app2_market.getPayTokenAmount(multiplyNewAmount, multiplyNewAmount_2)
            let curve_amount_multiply_2 = await app2_market.getPayTokenAmount(0, multiplyNewAmount_2)

            expect(curve_amount_buy_2).gt(curve_amount_multiply_2)
            expect(result2.payTokenAmount).eq(curve_amount_buy_2 - curve_amount_multiply_2 + nft_fee_2 + app_owner_fee_2 + platform_mortgage_fee_2)

            expect(curve_amount_buy_2 / nft_fee_2).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_multiply_2 / platform_mortgage_fee_2).eq(100000 / platformMortgageFee)
            expect(app_owner_fee_2 / platform_mortgage_fee_2).eq(2)

            expect(app2_market_eth_balance_4).eq(app2_market_eth_balance_3 + (curve_amount_buy_2 - curve_amount_multiply_2))

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_2)
            expect(user1_token_balance_4).eq(user1_token_balance_3).eq(0)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 + multiplyNewAmount_2)

            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result2.nftTokenId)).amount).eq(multiplyNewAmount_2)

        });

        it("multiplyNew with eth | value > need | no app mortgage fee", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 600,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 0,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 800,
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

            let platformMortgageFee = 200
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

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_1 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_1 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let multiplyNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount, { value: multiplyNewAmount })
            let res = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount, { value: result.payTokenAmount * BigInt(2) })
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_2 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_2 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("16161616161616160")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - result.payTokenAmount - gas)

            let nft_fee = (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1) + (nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1)
            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_eth_balance_2 - platform_mortgage_fee_eth_balance_1
            let curve_amount_buy_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)
            let curve_amount_multiply_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)

            expect(curve_amount_buy_1).eq(curve_amount_multiply_1)
            expect(result.payTokenAmount).eq(nft_fee + app_owner_fee + platform_mortgage_fee)
            expect(curve_amount_multiply_1 / (nft_fee + app_owner_fee + platform_mortgage_fee)).eq(62)

            expect(curve_amount_buy_1 / nft_fee).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_buy_1 / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(nft_fee / platform_mortgage_fee).eq(4)
            expect(app_owner_fee / platform_mortgage_fee).eq(3)

            expect(app2_market_eth_balance_2).eq(app2_market_eth_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 + multiplyNewAmount)

            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount)

            // 2
            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_3 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_3 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_3 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_3 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_3 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let multiplyNewAmount_2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result2 = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount_2, { value: multiplyNewAmount_2 })
            let res2 = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount_2, { value: result2.payTokenAmount * BigInt(2) })
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_4 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_4 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_4 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_4 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_4 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result2.nftTokenId).eq(2)
            expect(result2.payTokenAmount).eq("37064522778808490")
            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - result2.payTokenAmount - gas2)

            let nft_fee_2 = (nft_1_owner_eth_balance_4 - nft_1_owner_eth_balance_3) + (nft_2_owner_eth_balance_4 - nft_2_owner_eth_balance_3)
            let app_owner_fee_2 = app2_owner_fee_eth_balance_4 - app2_owner_fee_eth_balance_3
            let platform_mortgage_fee_2 = platform_mortgage_fee_eth_balance_4 - platform_mortgage_fee_eth_balance_3
            let curve_amount_buy_2 = await app2_market.getPayTokenAmount(multiplyNewAmount, multiplyNewAmount_2)
            let curve_amount_multiply_2 = await app2_market.getPayTokenAmount(0, multiplyNewAmount_2)

            expect(curve_amount_buy_2).gt(curve_amount_multiply_2)
            expect(result2.payTokenAmount).eq(curve_amount_buy_2 - curve_amount_multiply_2 + nft_fee_2 + app_owner_fee_2 + platform_mortgage_fee_2)

            expect(curve_amount_buy_2 / nft_fee_2).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_multiply_2 / platform_mortgage_fee_2).eq(100000 / platformMortgageFee)

            expect(app2_market_eth_balance_4).eq(app2_market_eth_balance_3 + (curve_amount_buy_2 - curve_amount_multiply_2))

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_2)
            expect(user1_token_balance_4).eq(user1_token_balance_3).eq(0)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 + multiplyNewAmount_2)

            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result2.nftTokenId)).amount).eq(multiplyNewAmount_2)

        });

        it("multiplyNew with eth | value > need | no platform mortgage fee", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 600,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 800,
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

            let platformMortgageFee = 0
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

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_1 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_1 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let multiplyNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount, { value: multiplyNewAmount })
            let res = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount, { value: result.payTokenAmount * BigInt(2) })
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_2 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_2 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("18181818181818180")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - result.payTokenAmount - gas)

            let nft_fee = (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1) + (nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1)
            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_eth_balance_2 - platform_mortgage_fee_eth_balance_1
            let curve_amount_buy_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)
            let curve_amount_multiply_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)

            expect(platform_mortgage_fee).eq(0)
            expect(curve_amount_buy_1).eq(curve_amount_multiply_1)
            expect(result.payTokenAmount).eq(nft_fee + app_owner_fee)
            expect(curve_amount_multiply_1 / (nft_fee + app_owner_fee)).eq(55)

            expect(curve_amount_buy_1 / nft_fee).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_buy_1 / app_owner_fee).eq(100000 / (app2_fees.appOwnerBuyFee + app2_fees.appOwnerMortgageFee))

            expect(app2_market_eth_balance_2).eq(app2_market_eth_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 + multiplyNewAmount)

            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount)

            // 2
            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_3 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_3 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_3 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_3 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_3 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let multiplyNewAmount_2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result2 = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount_2, { value: multiplyNewAmount_2 })
            let res2 = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount_2, { value: result2.payTokenAmount * BigInt(2) })
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_4 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_4 = await ethers.provider.getBalance(nft_2_owner.address)
            let platform_mortgage_fee_eth_balance_4 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_fee_eth_balance_4 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_4 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result2.nftTokenId).eq(2)
            expect(result2.payTokenAmount).eq("39084724799010510")
            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - result2.payTokenAmount - gas2)

            let nft_fee_2 = (nft_1_owner_eth_balance_4 - nft_1_owner_eth_balance_3) + (nft_2_owner_eth_balance_4 - nft_2_owner_eth_balance_3)
            let app_owner_fee_2 = app2_owner_fee_eth_balance_4 - app2_owner_fee_eth_balance_3
            let platform_mortgage_fee_2 = platform_mortgage_fee_eth_balance_4 - platform_mortgage_fee_eth_balance_3
            let curve_amount_buy_2 = await app2_market.getPayTokenAmount(multiplyNewAmount, multiplyNewAmount_2)
            let curve_amount_multiply_2 = await app2_market.getPayTokenAmount(0, multiplyNewAmount_2)

            expect(curve_amount_buy_2).gt(curve_amount_multiply_2)
            expect(result2.payTokenAmount).eq(curve_amount_buy_2 - curve_amount_multiply_2 + nft_fee_2 + app_owner_fee_2 + platform_mortgage_fee_2)

            expect(curve_amount_buy_2 / nft_fee_2).eq(100000 / app2_fees.nftOwnerBuyFee)

            expect(app2_market_eth_balance_4).eq(app2_market_eth_balance_3 + (curve_amount_buy_2 - curve_amount_multiply_2))

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_2)
            expect(user1_token_balance_4).eq(user1_token_balance_3).eq(0)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 + multiplyNewAmount_2)

            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result2.nftTokenId)).amount).eq(multiplyNewAmount_2)

        });

        it("multiplyNew with erc20", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = (await (
                await ethers.getContractFactory("SimpleToken")
            ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

            let app2_fees = {
                appOwnerBuyFee: 600,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 800,
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

            let platformMortgageFee = 200
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

            let multiplyNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(user1.address, multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MaxUint256)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result.payTokenAmount)

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let res = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("20202020202020200")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 - result.payTokenAmount)

            let nft_fee = (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1) + (nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1)
            let app_owner_fee = app2_owner_fee_pay_token_balance_2 - app2_owner_fee_pay_token_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_pay_token_balance_2 - platform_mortgage_fee_pay_token_balance_1
            let curve_amount_buy_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)
            let curve_amount_multiply_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)

            expect(curve_amount_buy_1).eq(curve_amount_multiply_1)
            expect(result.payTokenAmount).eq(nft_fee + app_owner_fee + platform_mortgage_fee)
            expect(curve_amount_multiply_1 / (nft_fee + app_owner_fee + platform_mortgage_fee)).eq(50)

            expect(curve_amount_buy_1 / nft_fee).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_buy_1 / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(nft_fee / platform_mortgage_fee).eq(4)
            expect(app_owner_fee / platform_mortgage_fee).eq(5)

            expect((nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1) / (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1)).eq(9)

            expect(app2_market_pay_token_balance_2).eq(app2_market_pay_token_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 + multiplyNewAmount)

            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount)

            // 2
            let multiplyNewAmount_2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(user1.address, multiplyNewAmount_2)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MaxUint256)
            let result2 = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount_2)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result2.payTokenAmount)

            let user1_pay_token_balance_3 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_3 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_3 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_3 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_3 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_3 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())

            let res2 = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount_2)
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_pay_token_balance_4 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_4 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_4 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_4 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_4 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_4 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - gas2)

            expect(result2.nftTokenId).eq(2)
            expect(result2.payTokenAmount).eq("41104926819212530")
            expect(user1_pay_token_balance_4).eq(user1_pay_token_balance_3 - result2.payTokenAmount)

            let nft_fee_2 = (nft_1_owner_pay_token_balance_4 - nft_1_owner_pay_token_balance_3) + (nft_2_owner_pay_token_balance_4 - nft_2_owner_pay_token_balance_3)
            let app_owner_fee_2 = app2_owner_fee_pay_token_balance_4 - app2_owner_fee_pay_token_balance_3
            let platform_mortgage_fee_2 = platform_mortgage_fee_pay_token_balance_4 - platform_mortgage_fee_pay_token_balance_3
            let curve_amount_buy_2 = await app2_market.getPayTokenAmount(multiplyNewAmount, multiplyNewAmount_2)
            let curve_amount_multiply_2 = await app2_market.getPayTokenAmount(0, multiplyNewAmount_2)

            expect(curve_amount_buy_2).gt(curve_amount_multiply_2)
            expect(result2.payTokenAmount).eq(curve_amount_buy_2 - curve_amount_multiply_2 + nft_fee_2 + app_owner_fee_2 + platform_mortgage_fee_2)

            expect(curve_amount_buy_2 / nft_fee_2).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_multiply_2 / platform_mortgage_fee_2).eq(100000 / platformMortgageFee)

            expect(app2_market_pay_token_balance_4).eq(app2_market_pay_token_balance_3 + (curve_amount_buy_2 - curve_amount_multiply_2))

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_2)
            expect(user1_token_balance_4).eq(user1_token_balance_3).eq(0)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 + multiplyNewAmount_2)

            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result2.nftTokenId)).amount).eq(multiplyNewAmount_2)

        });

        it("multiplyNew with erc20 | approve > need", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = (await (
                await ethers.getContractFactory("SimpleToken")
            ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

            let app2_fees = {
                appOwnerBuyFee: 600,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 800,
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

            let platformMortgageFee = 200
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

            let multiplyNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(user1.address, multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MaxUint256)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result.payTokenAmount * BigInt(2))

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let res = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("20202020202020200")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 - result.payTokenAmount)

            let nft_fee = (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1) + (nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1)
            let app_owner_fee = app2_owner_fee_pay_token_balance_2 - app2_owner_fee_pay_token_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_pay_token_balance_2 - platform_mortgage_fee_pay_token_balance_1
            let curve_amount_buy_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)
            let curve_amount_multiply_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)

            expect(curve_amount_buy_1).eq(curve_amount_multiply_1)
            expect(result.payTokenAmount).eq(nft_fee + app_owner_fee + platform_mortgage_fee)
            expect(curve_amount_multiply_1 / (nft_fee + app_owner_fee + platform_mortgage_fee)).eq(50)

            expect(curve_amount_buy_1 / nft_fee).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_buy_1 / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(nft_fee / platform_mortgage_fee).eq(4)
            expect(app_owner_fee / platform_mortgage_fee).eq(5)

            expect(app2_market_pay_token_balance_2).eq(app2_market_pay_token_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 + multiplyNewAmount)

            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount)

            // 2
            let multiplyNewAmount_2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(user1.address, multiplyNewAmount_2)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MaxUint256)
            let result2 = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount_2)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result2.payTokenAmount * BigInt(2))

            let user1_pay_token_balance_3 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_3 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_3 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_3 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_3 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_3 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())

            let res2 = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount_2)
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_pay_token_balance_4 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_4 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_4 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_4 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_4 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_4 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - gas2)

            expect(result2.nftTokenId).eq(2)
            expect(result2.payTokenAmount).eq("41104926819212530")
            expect(user1_pay_token_balance_4).eq(user1_pay_token_balance_3 - result2.payTokenAmount)

            let nft_fee_2 = (nft_1_owner_pay_token_balance_4 - nft_1_owner_pay_token_balance_3) + (nft_2_owner_pay_token_balance_4 - nft_2_owner_pay_token_balance_3)
            let app_owner_fee_2 = app2_owner_fee_pay_token_balance_4 - app2_owner_fee_pay_token_balance_3
            let platform_mortgage_fee_2 = platform_mortgage_fee_pay_token_balance_4 - platform_mortgage_fee_pay_token_balance_3
            let curve_amount_buy_2 = await app2_market.getPayTokenAmount(multiplyNewAmount, multiplyNewAmount_2)
            let curve_amount_multiply_2 = await app2_market.getPayTokenAmount(0, multiplyNewAmount_2)

            expect(curve_amount_buy_2).gt(curve_amount_multiply_2)
            expect(result2.payTokenAmount).eq(curve_amount_buy_2 - curve_amount_multiply_2 + nft_fee_2 + app_owner_fee_2 + platform_mortgage_fee_2)

            expect(curve_amount_buy_2 / nft_fee_2).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_multiply_2 / platform_mortgage_fee_2).eq(100000 / platformMortgageFee)

            expect(app2_market_pay_token_balance_4).eq(app2_market_pay_token_balance_3 + (curve_amount_buy_2 - curve_amount_multiply_2))

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_2)
            expect(user1_token_balance_4).eq(user1_token_balance_3).eq(0)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 + multiplyNewAmount_2)

            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result2.nftTokenId)).amount).eq(multiplyNewAmount_2)

        });

        it("multiplyNew with erc20 | approve > need | no nft buy fee", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = (await (
                await ethers.getContractFactory("SimpleToken")
            ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

            let app2_fees = {
                appOwnerBuyFee: 600,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 0,
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

            let platformMortgageFee = 200
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

            let multiplyNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(user1.address, multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MaxUint256)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result.payTokenAmount * BigInt(2))

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let res = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("12121212121212120")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 - result.payTokenAmount)

            let nft_fee = (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1) + (nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1)
            let app_owner_fee = app2_owner_fee_pay_token_balance_2 - app2_owner_fee_pay_token_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_pay_token_balance_2 - platform_mortgage_fee_pay_token_balance_1
            let curve_amount_buy_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)
            let curve_amount_multiply_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)

            expect(nft_fee).eq(0)
            expect(curve_amount_buy_1).eq(curve_amount_multiply_1)
            expect(result.payTokenAmount).eq(app_owner_fee + platform_mortgage_fee)
            expect(curve_amount_multiply_1 / (app_owner_fee + platform_mortgage_fee)).eq(83)

            expect(curve_amount_buy_1 / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(app_owner_fee / platform_mortgage_fee).eq(5)

            expect(app2_market_pay_token_balance_2).eq(app2_market_pay_token_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 + multiplyNewAmount)

            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount)

            // 2
            let multiplyNewAmount_2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(user1.address, multiplyNewAmount_2)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MaxUint256)
            let result2 = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount_2)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result2.payTokenAmount * BigInt(2))

            let user1_pay_token_balance_3 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_3 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_3 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_3 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_3 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_3 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())

            let res2 = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount_2)
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_pay_token_balance_4 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_4 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_4 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_4 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_4 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_4 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - gas2)

            expect(result2.nftTokenId).eq(2)
            expect(result2.payTokenAmount).eq("32859204287775714")
            expect(user1_pay_token_balance_4).eq(user1_pay_token_balance_3 - result2.payTokenAmount)

            let nft_fee_2 = (nft_1_owner_pay_token_balance_4 - nft_1_owner_pay_token_balance_3) + (nft_2_owner_pay_token_balance_4 - nft_2_owner_pay_token_balance_3)
            let app_owner_fee_2 = app2_owner_fee_pay_token_balance_4 - app2_owner_fee_pay_token_balance_3
            let platform_mortgage_fee_2 = platform_mortgage_fee_pay_token_balance_4 - platform_mortgage_fee_pay_token_balance_3
            let curve_amount_buy_2 = await app2_market.getPayTokenAmount(multiplyNewAmount, multiplyNewAmount_2)
            let curve_amount_multiply_2 = await app2_market.getPayTokenAmount(0, multiplyNewAmount_2)

            expect(nft_fee_2).eq(0)

            expect(curve_amount_buy_2).gt(curve_amount_multiply_2)
            expect(result2.payTokenAmount).eq(curve_amount_buy_2 - curve_amount_multiply_2 + app_owner_fee_2 + platform_mortgage_fee_2)

            expect(curve_amount_multiply_2 / platform_mortgage_fee_2).eq(100000 / platformMortgageFee)

            expect(app2_market_pay_token_balance_4).eq(app2_market_pay_token_balance_3 + (curve_amount_buy_2 - curve_amount_multiply_2))

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_2)
            expect(user1_token_balance_4).eq(user1_token_balance_3).eq(0)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 + multiplyNewAmount_2)

            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result2.nftTokenId)).amount).eq(multiplyNewAmount_2)

        });

        it("multiplyNew with erc20 | approve > need | no nft buy fee | no nft", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = (await (
                await ethers.getContractFactory("SimpleToken")
            ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

            let app2_fees = {
                appOwnerBuyFee: 600,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 0,
                nftOwnerSellFee: 500,
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

            let platformMortgageFee = 200
            let platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7]
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFee(app2_appid, platformMortgageFee)
            await info.coreContractInfo.foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFeeRecipient(app2_appid, platformMortgageFeeRecipient)

            let app2 = await info.coreContractInfo.foundry.apps(app2_appid)
            let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;
            let app2_mortgageNFT = (await ethers.getContractAt("MortgageNFT", app2.mortgageNFT)) as MortgageNFT;

            let tid = "t1";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid, "0x12", [], [], [])

            let tokenAddr = await info.coreContractInfo.foundry.token(app2_appid, tid);
            let token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

            let multiplyNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(user1.address, multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MaxUint256)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result.payTokenAmount * BigInt(2))

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let platform_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let res = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let platform_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("12121212121212120")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 - result.payTokenAmount)

            let app_owner_fee = app2_owner_fee_pay_token_balance_2 - app2_owner_fee_pay_token_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_pay_token_balance_2 - platform_mortgage_fee_pay_token_balance_1
            let curve_amount_buy_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)
            let curve_amount_multiply_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)

            expect(curve_amount_buy_1).eq(curve_amount_multiply_1)
            expect(result.payTokenAmount).eq(app_owner_fee + platform_mortgage_fee)
            expect(curve_amount_multiply_1 / (app_owner_fee + platform_mortgage_fee)).eq(83)

            expect(curve_amount_buy_1 / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(app_owner_fee / platform_mortgage_fee).eq(5)

            expect(app2_market_pay_token_balance_2).eq(app2_market_pay_token_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 + multiplyNewAmount)

            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount)

            // 2
            let multiplyNewAmount_2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(user1.address, multiplyNewAmount_2)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MaxUint256)
            let result2 = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount_2)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result2.payTokenAmount * BigInt(2))

            let user1_pay_token_balance_3 = await app2_payToken.balanceOf(await user1.getAddress())
            let platform_mortgage_fee_pay_token_balance_3 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_3 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_3 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())

            let res2 = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount_2)
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_pay_token_balance_4 = await app2_payToken.balanceOf(await user1.getAddress())
            let platform_mortgage_fee_pay_token_balance_4 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_4 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_4 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - gas2)

            expect(result2.nftTokenId).eq(2)
            expect(result2.payTokenAmount).eq("32859204287775714")
            expect(user1_pay_token_balance_4).eq(user1_pay_token_balance_3 - result2.payTokenAmount)

            let app_owner_fee_2 = app2_owner_fee_pay_token_balance_4 - app2_owner_fee_pay_token_balance_3
            let platform_mortgage_fee_2 = platform_mortgage_fee_pay_token_balance_4 - platform_mortgage_fee_pay_token_balance_3
            let curve_amount_buy_2 = await app2_market.getPayTokenAmount(multiplyNewAmount, multiplyNewAmount_2)
            let curve_amount_multiply_2 = await app2_market.getPayTokenAmount(0, multiplyNewAmount_2)

            expect(curve_amount_buy_2).gt(curve_amount_multiply_2)
            expect(result2.payTokenAmount).eq(curve_amount_buy_2 - curve_amount_multiply_2 + app_owner_fee_2 + platform_mortgage_fee_2)

            expect(curve_amount_multiply_2 / platform_mortgage_fee_2).eq(100000 / platformMortgageFee)

            expect(app2_market_pay_token_balance_4).eq(app2_market_pay_token_balance_3 + (curve_amount_buy_2 - curve_amount_multiply_2))

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_2)
            expect(user1_token_balance_4).eq(user1_token_balance_3).eq(0)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 + multiplyNewAmount_2)

            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result2.nftTokenId)).amount).eq(multiplyNewAmount_2)

        });

        it("multiplyNew with erc20 | approve > need | no app buy fee", async function () {
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
                nftOwnerBuyFee: 800,
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

            let platformMortgageFee = 200
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

            let multiplyNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(user1.address, multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MaxUint256)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result.payTokenAmount * BigInt(2))

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let res = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("14141414141414140")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 - result.payTokenAmount)

            let nft_fee = (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1) + (nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1)
            let app_owner_fee = app2_owner_fee_pay_token_balance_2 - app2_owner_fee_pay_token_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_pay_token_balance_2 - platform_mortgage_fee_pay_token_balance_1
            let curve_amount_buy_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)
            let curve_amount_multiply_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)

            expect(curve_amount_buy_1).eq(curve_amount_multiply_1)
            expect(result.payTokenAmount).eq(nft_fee + app_owner_fee + platform_mortgage_fee)
            expect(curve_amount_multiply_1 / (nft_fee + app_owner_fee + platform_mortgage_fee)).eq(71)

            expect(curve_amount_buy_1 / nft_fee).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_buy_1 / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(nft_fee / platform_mortgage_fee).eq(4)
            expect(app_owner_fee / platform_mortgage_fee).eq(2)

            expect(app2_market_pay_token_balance_2).eq(app2_market_pay_token_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 + multiplyNewAmount)

            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount)

            // 2
            let multiplyNewAmount_2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(user1.address, multiplyNewAmount_2)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MaxUint256)
            let result2 = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount_2)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result2.payTokenAmount * BigInt(2))

            let user1_pay_token_balance_3 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_3 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_3 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_3 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_3 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_3 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())

            let res2 = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount_2)
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_pay_token_balance_4 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_4 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_4 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_4 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_4 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_4 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - gas2)

            expect(result2.nftTokenId).eq(2)
            expect(result2.payTokenAmount).eq("34920634920634918")
            expect(user1_pay_token_balance_4).eq(user1_pay_token_balance_3 - result2.payTokenAmount)

            let nft_fee_2 = (nft_1_owner_pay_token_balance_4 - nft_1_owner_pay_token_balance_3) + (nft_2_owner_pay_token_balance_4 - nft_2_owner_pay_token_balance_3)
            let app_owner_fee_2 = app2_owner_fee_pay_token_balance_4 - app2_owner_fee_pay_token_balance_3
            let platform_mortgage_fee_2 = platform_mortgage_fee_pay_token_balance_4 - platform_mortgage_fee_pay_token_balance_3
            let curve_amount_buy_2 = await app2_market.getPayTokenAmount(multiplyNewAmount, multiplyNewAmount_2)
            let curve_amount_multiply_2 = await app2_market.getPayTokenAmount(0, multiplyNewAmount_2)

            expect(curve_amount_buy_2).gt(curve_amount_multiply_2)
            expect(result2.payTokenAmount).eq(curve_amount_buy_2 - curve_amount_multiply_2 + nft_fee_2 + app_owner_fee_2 + platform_mortgage_fee_2)

            expect(curve_amount_buy_2 / nft_fee_2).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_multiply_2 / platform_mortgage_fee_2).eq(100000 / platformMortgageFee)

            expect(app2_market_pay_token_balance_4).eq(app2_market_pay_token_balance_3 + (curve_amount_buy_2 - curve_amount_multiply_2))

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_2)
            expect(user1_token_balance_4).eq(user1_token_balance_3).eq(0)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 + multiplyNewAmount_2)

            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result2.nftTokenId)).amount).eq(multiplyNewAmount_2)

        });

        it("multiplyNew with erc20 | approve > need | no app mortgage fee", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = (await (
                await ethers.getContractFactory("SimpleToken")
            ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

            let app2_fees = {
                appOwnerBuyFee: 600,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 0,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 800,
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

            let platformMortgageFee = 200
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

            let multiplyNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(user1.address, multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MaxUint256)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result.payTokenAmount * BigInt(2))

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let res = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("16161616161616160")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 - result.payTokenAmount)

            let nft_fee = (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1) + (nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1)
            let app_owner_fee = app2_owner_fee_pay_token_balance_2 - app2_owner_fee_pay_token_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_pay_token_balance_2 - platform_mortgage_fee_pay_token_balance_1
            let curve_amount_buy_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)
            let curve_amount_multiply_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)

            expect(curve_amount_buy_1).eq(curve_amount_multiply_1)
            expect(result.payTokenAmount).eq(nft_fee + app_owner_fee + platform_mortgage_fee)
            expect(curve_amount_multiply_1 / (nft_fee + app_owner_fee + platform_mortgage_fee)).eq(62)

            expect(curve_amount_buy_1 / nft_fee).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_buy_1 / platform_mortgage_fee).eq(100000 / platformMortgageFee)
            expect(nft_fee / platform_mortgage_fee).eq(4)
            expect(app_owner_fee / platform_mortgage_fee).eq(3)

            expect(app2_market_pay_token_balance_2).eq(app2_market_pay_token_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 + multiplyNewAmount)

            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount)

            // 2
            let multiplyNewAmount_2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(user1.address, multiplyNewAmount_2)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MaxUint256)
            let result2 = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount_2)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result2.payTokenAmount * BigInt(2))

            let user1_pay_token_balance_3 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_3 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_3 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_3 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_3 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_3 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())

            let res2 = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount_2)
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_pay_token_balance_4 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_4 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_4 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_4 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_4 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_4 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - gas2)

            expect(result2.nftTokenId).eq(2)
            expect(result2.payTokenAmount).eq("37064522778808490")
            expect(user1_pay_token_balance_4).eq(user1_pay_token_balance_3 - result2.payTokenAmount)

            let nft_fee_2 = (nft_1_owner_pay_token_balance_4 - nft_1_owner_pay_token_balance_3) + (nft_2_owner_pay_token_balance_4 - nft_2_owner_pay_token_balance_3)
            let app_owner_fee_2 = app2_owner_fee_pay_token_balance_4 - app2_owner_fee_pay_token_balance_3
            let platform_mortgage_fee_2 = platform_mortgage_fee_pay_token_balance_4 - platform_mortgage_fee_pay_token_balance_3
            let curve_amount_buy_2 = await app2_market.getPayTokenAmount(multiplyNewAmount, multiplyNewAmount_2)
            let curve_amount_multiply_2 = await app2_market.getPayTokenAmount(0, multiplyNewAmount_2)

            expect(curve_amount_buy_2).gt(curve_amount_multiply_2)
            expect(result2.payTokenAmount).eq(curve_amount_buy_2 - curve_amount_multiply_2 + nft_fee_2 + app_owner_fee_2 + platform_mortgage_fee_2)

            expect(curve_amount_buy_2 / nft_fee_2).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_multiply_2 / platform_mortgage_fee_2).eq(100000 / platformMortgageFee)

            expect(app2_market_pay_token_balance_4).eq(app2_market_pay_token_balance_3 + (curve_amount_buy_2 - curve_amount_multiply_2))

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_2)
            expect(user1_token_balance_4).eq(user1_token_balance_3).eq(0)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 + multiplyNewAmount_2)

            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result2.nftTokenId)).amount).eq(multiplyNewAmount_2)

        });

        it("multiplyNew with erc20 | approve > need | no platform mortgage fee", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = (await (
                await ethers.getContractFactory("SimpleToken")
            ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

            let app2_fees = {
                appOwnerBuyFee: 600,
                appOwnerSellFee: 300,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 800,
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

            let platformMortgageFee = 0
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

            let multiplyNewAmount = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(user1.address, multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MaxUint256)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result.payTokenAmount * BigInt(2))

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let res = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)

            expect(result.nftTokenId).eq(1)
            expect(result.payTokenAmount).eq("18181818181818180")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 - result.payTokenAmount)

            let nft_fee = (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1) + (nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1)
            let app_owner_fee = app2_owner_fee_pay_token_balance_2 - app2_owner_fee_pay_token_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_pay_token_balance_2 - platform_mortgage_fee_pay_token_balance_1
            let curve_amount_buy_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)
            let curve_amount_multiply_1 = await app2_market.getPayTokenAmount(0, multiplyNewAmount)

            expect(platform_mortgage_fee).eq(0)

            expect(curve_amount_buy_1).eq(curve_amount_multiply_1)
            expect(result.payTokenAmount).eq(nft_fee + app_owner_fee)
            expect(curve_amount_multiply_1 / (nft_fee + app_owner_fee)).eq(55)

            expect(curve_amount_buy_1 / nft_fee).eq(100000 / app2_fees.nftOwnerBuyFee)
            expect(curve_amount_buy_1 / app_owner_fee).eq(100000 / (app2_fees.appOwnerBuyFee + app2_fees.appOwnerMortgageFee))

            expect(app2_market_pay_token_balance_2).eq(app2_market_pay_token_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 + multiplyNewAmount)

            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount)

            // 2
            let multiplyNewAmount_2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(user1.address, multiplyNewAmount_2)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), MaxUint256)
            let result2 = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount_2)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), result2.payTokenAmount * BigInt(2))

            let user1_pay_token_balance_3 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_3 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_3 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_3 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_3 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_3 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_3 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_3 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_3 = await ethers.provider.getBalance(await user1.getAddress())

            let res2 = await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount_2)
            let ress2 = await res2.wait()
            let gas2 = ress2!.gasPrice * ress2!.gasUsed

            let user1_pay_token_balance_4 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_4 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_4 = await app2_payToken.balanceOf(nft_2_owner.address)
            let platform_mortgage_fee_pay_token_balance_4 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_fee_pay_token_balance_4 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_4 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_4 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_4 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_4 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_4).eq(user1_eth_balance_3 - gas2)

            expect(result2.nftTokenId).eq(2)
            expect(result2.payTokenAmount).eq("39084724799010510")
            expect(user1_pay_token_balance_4).eq(user1_pay_token_balance_3 - result2.payTokenAmount)

            let nft_fee_2 = (nft_1_owner_pay_token_balance_4 - nft_1_owner_pay_token_balance_3) + (nft_2_owner_pay_token_balance_4 - nft_2_owner_pay_token_balance_3)
            let app_owner_fee_2 = app2_owner_fee_pay_token_balance_4 - app2_owner_fee_pay_token_balance_3
            let platform_mortgage_fee_2 = platform_mortgage_fee_pay_token_balance_4 - platform_mortgage_fee_pay_token_balance_3
            let curve_amount_buy_2 = await app2_market.getPayTokenAmount(multiplyNewAmount, multiplyNewAmount_2)
            let curve_amount_multiply_2 = await app2_market.getPayTokenAmount(0, multiplyNewAmount_2)

            expect(curve_amount_buy_2).gt(curve_amount_multiply_2)
            expect(result2.payTokenAmount).eq(curve_amount_buy_2 - curve_amount_multiply_2 + nft_fee_2 + app_owner_fee_2 + platform_mortgage_fee_2)

            expect(curve_amount_buy_2 / nft_fee_2).eq(100000 / app2_fees.nftOwnerBuyFee)

            expect(app2_market_pay_token_balance_4).eq(app2_market_pay_token_balance_3 + (curve_amount_buy_2 - curve_amount_multiply_2))

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_2)
            expect(user1_token_balance_4).eq(user1_token_balance_3).eq(0)
            expect(app2_market_token_balance_4).eq(app2_market_token_balance_3 + multiplyNewAmount_2)

            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result2.nftTokenId)).amount).eq(multiplyNewAmount_2)

        });
    });
});
