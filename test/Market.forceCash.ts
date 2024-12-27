import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { getTokenAmountWei } from "./shared/utils";
import { ethers } from "hardhat";
import { Market, MortgageNFT, SimpleToken, Token } from "../typechain-types";
import { MaxUint256, ZeroAddress } from "ethers";

describe("Market", function () {
    describe("forceCash", function () {
        it("forceCash revert", async function () {
            const info = (await loadFixture(deployAllContracts)).xMemeAllContractInfo;
            await info.xMeme.setSystemReady(true)

            let user1 = info.wallets[info.nextWalletIndex + 1]
            let user2 = info.wallets[info.nextWalletIndex + 2]

            let tid_1 = "t1";
            let buyAmount_1_user_1 = getTokenAmountWei(1000)
            let buyAmount_1_user_2 = getTokenAmountWei(2000)
            let buyAmount_1_user_1_2 = getTokenAmountWei(5000)
            await info.xMeme.connect(user1).createTokenAndBuy(tid_1, buyAmount_1_user_1, { value: BigInt(10) ** BigInt(20) });
            await info.market.connect(user2).buy(tid_1, buyAmount_1_user_2, { value: BigInt(10) ** BigInt(20) });
            await info.market.connect(user1).buy(tid_1, buyAmount_1_user_1_2, { value: BigInt(10) ** BigInt(20) });

            let tid_2 = "t2";
            let buyAmount_2_user_1 = getTokenAmountWei(3000)
            let buyAmount_2_user_2 = getTokenAmountWei(4000)
            await info.xMeme.connect(user1).createTokenAndBuy(tid_2, buyAmount_2_user_1, { value: BigInt(10) ** BigInt(20) });
            await info.market.connect(user2).buy(tid_2, buyAmount_2_user_2, { value: BigInt(10) ** BigInt(20) });

            let token_addr_tid1 = await info.market.token(tid_1)
            let token_addr_tid2 = await info.market.token(tid_2)
            let token_tid1 = (await ethers.getContractAt("Token", token_addr_tid1)) as Token
            let token_tid2 = (await ethers.getContractAt("Token", token_addr_tid2)) as Token

            await token_tid1.connect(user1).approve(await info.market.getAddress(), buyAmount_1_user_1)
            let result1 = await info.market.connect(user1).mortgageNew.staticCall(tid_1, buyAmount_1_user_1);
            await info.market.connect(user1).mortgageNew(tid_1, buyAmount_1_user_1);

            await token_tid2.connect(user1).approve(await info.market.getAddress(), buyAmount_2_user_1)
            let result2 = await info.market.connect(user1).mortgageNew.staticCall(tid_2, buyAmount_2_user_1);
            await info.market.connect(user1).mortgageNew(tid_2, buyAmount_2_user_1);

            await token_tid1.connect(user2).approve(await info.market.getAddress(), buyAmount_1_user_2);
            let result3 = await info.market.connect(user2).mortgageNew.staticCall(tid_1, buyAmount_1_user_2);
            await info.market.connect(user2).mortgageNew(tid_1, buyAmount_1_user_2);

            await token_tid2.connect(user2).approve(await info.market.getAddress(), buyAmount_2_user_2);
            let result4 = await info.market.connect(user2).mortgageNew.staticCall(tid_2, buyAmount_2_user_2);
            await info.market.connect(user2).mortgageNew(tid_2, buyAmount_2_user_2);

            // not owner
            await expect(info.market.connect(user1).forceCash(result3.nftTokenId, 1)).to.be.revertedWith("AOE")

            // no tokenid
            await expect(info.market.connect(user1).forceCash(11, 1)).to.be.revertedWithCustomError(info.mortgageNFT, "ERC721NonexistentToken")

            // cash 0
            await expect(info.market.connect(user1).forceCash(result1.nftTokenId, 0)).to.be.revertedWith("TAE")

            // cash > amount
            await expect(info.market.connect(user1).forceCash(result1.nftTokenId, buyAmount_1_user_1 + BigInt(1))).to.be.revertedWith("TAE")

            // cash not have profit
            let result = await info.market.connect(user1).forceCash.staticCall(result1.nftTokenId, buyAmount_1_user_1, { value: buyAmount_1_user_1 })
            await expect(info.market.connect(user1).forceCash(result1.nftTokenId, buyAmount_1_user_1, { value: result.payTokenAmount - BigInt(1) })).to.be.revertedWith("VE")
        });

        it("forceCash revert erc20", async function () {
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
                appOwnerBuyFee: 600,
                appOwnerSellFee: 600,
                appOwnerMortgageFee: 300,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 1000,
                nftOwnerSellFee: 1000,
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

            let nft_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4]

            let tid_1 = "t1";
            let tid_2 = "t2";
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid_1, "0x12", [100000], [nft_owner.address], ["0x12"])
            await info.coreContractInfo.foundry.connect(app2_operator).createToken(app2_appid, tid_2, "0x12", [100000], [nft_owner.address], ["0x12"])

            let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5]
            let user2 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6]

            await app2_payToken.transfer(user1, getTokenAmountWei(5000))
            await app2_payToken.transfer(user2, getTokenAmountWei(5000))
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), getTokenAmountWei(5000))
            await app2_payToken.connect(user2).approve(await app2_market.getAddress(), getTokenAmountWei(5000))

            let buyAmount_1_user_1 = getTokenAmountWei(1000)
            let buyAmount_1_user_2 = getTokenAmountWei(2000)
            let buyAmount_1_user_1_2 = getTokenAmountWei(5000)
            await app2_market.connect(user1).buy(tid_1, buyAmount_1_user_1);
            await app2_market.connect(user2).buy(tid_1, buyAmount_1_user_2);
            await app2_market.connect(user1).buy(tid_1, buyAmount_1_user_1_2);

            let buyAmount_2_user_1 = getTokenAmountWei(3000)
            let buyAmount_2_user_2 = getTokenAmountWei(4000)
            await app2_market.connect(user1).buy(tid_2, buyAmount_2_user_1);
            await app2_market.connect(user2).buy(tid_2, buyAmount_2_user_2);

            let token_addr_tid1 = await app2_market.token(tid_1)
            let token_addr_tid2 = await app2_market.token(tid_2)
            let token_tid1 = (await ethers.getContractAt("Token", token_addr_tid1)) as Token
            let token_tid2 = (await ethers.getContractAt("Token", token_addr_tid2)) as Token

            await token_tid1.connect(user1).approve(await app2_market.getAddress(), buyAmount_1_user_1)
            let result1 = await app2_market.connect(user1).mortgageNew.staticCall(tid_1, buyAmount_1_user_1);
            await app2_market.connect(user1).mortgageNew(tid_1, buyAmount_1_user_1);

            await token_tid2.connect(user1).approve(await app2_market.getAddress(), buyAmount_2_user_1)
            let result2 = await app2_market.connect(user1).mortgageNew.staticCall(tid_2, buyAmount_2_user_1);
            await app2_market.connect(user1).mortgageNew(tid_2, buyAmount_2_user_1);

            await token_tid1.connect(user2).approve(await app2_market.getAddress(), buyAmount_1_user_2);
            let result3 = await app2_market.connect(user2).mortgageNew.staticCall(tid_1, buyAmount_1_user_2);
            await app2_market.connect(user2).mortgageNew(tid_1, buyAmount_1_user_2);

            await token_tid2.connect(user2).approve(await app2_market.getAddress(), buyAmount_2_user_2);
            let result4 = await app2_market.connect(user2).mortgageNew.staticCall(tid_2, buyAmount_2_user_2);
            await app2_market.connect(user2).mortgageNew(tid_2, buyAmount_2_user_2);

            // not owner
            await expect(app2_market.connect(user1).forceCash(result3.nftTokenId, 1)).to.be.revertedWith("AOE")

            // no tokenid
            await expect(app2_market.connect(user1).forceCash(11, 1)).to.be.revertedWithCustomError(app2_mortgageNFT, "ERC721NonexistentToken")

            // cash 0
            await expect(app2_market.connect(user1).forceCash(result1.nftTokenId, 0)).to.be.revertedWith("TAE")

            // cash > amount
            await expect(app2_market.connect(user1).forceCash(result1.nftTokenId, buyAmount_1_user_1 + BigInt(1))).to.be.revertedWith("TAE")

            // cash not have profit
            await app2_payToken.transfer(user1.address, getTokenAmountWei(5000))
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), MaxUint256)
            let result = await app2_market.connect(user1).forceCash.staticCall(result1.nftTokenId, buyAmount_1_user_1)
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), result.payTokenAmount - BigInt(1))
            await expect(app2_market.connect(user1).forceCash(result1.nftTokenId, buyAmount_1_user_1)).to.be.revertedWithCustomError(app2_payToken, "ERC20InsufficientAllowance")
        });

        it("forceCash with eth | have profit", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 300,
                appOwnerSellFee: 500,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 1000,
            }

            let nft_1_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
            let nft_2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];

            let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];
            let user2 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7];

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
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount, { value: multiplyNewAmount })
            await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount, { value: result.payTokenAmount })
            expect(result.nftTokenId).eq(1)

            // user2 multiply
            let multiplyNewAmount_user2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result_user2 = await app2_market.connect(user2).multiplyNew.staticCall(tid, multiplyNewAmount_user2, { value: multiplyNewAmount_user2 })
            await app2_market.connect(user2).multiplyNew(tid, multiplyNewAmount_user2, { value: result_user2.payTokenAmount })
            expect(result_user2.nftTokenId).eq(2)


            // cash
            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_1 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_1 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let cashAmount = BigInt(10) ** BigInt(18) * BigInt(5000)
            let result_cash = await app2_market.connect(user1).forceCash.staticCall(result.nftTokenId, cashAmount)
            let res_cash = await app2_market.connect(user1).forceCash(result.nftTokenId, cashAmount)
            let ress_cash = await res_cash.wait()
            let gas_cash = ress_cash!.gasPrice * ress_cash!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_2 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_2 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result_cash.userProfit).eq(true)
            expect(result_cash.payTokenAmount).eq("2615634345713312")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 + result_cash.payTokenAmount - gas_cash)

            let nft_fee = (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1) + (nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1)
            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1

            let curve_amount_sell = await app2_market.getPayTokenAmount(multiplyNewAmount + multiplyNewAmount_user2 - cashAmount, cashAmount)
            let curve_amount_mortgage = await app2_market.getPayTokenAmount(multiplyNewAmount - cashAmount, cashAmount)

            expect(curve_amount_sell).gt(curve_amount_mortgage)
            expect(result_cash.payTokenAmount).eq(curve_amount_sell - nft_fee - app_owner_fee - curve_amount_mortgage)

            expect(curve_amount_sell / nft_fee).eq(100000 / app2_fees.nftOwnerSellFee)
            expect(curve_amount_sell / app_owner_fee).eq(100000 / app2_fees.appOwnerSellFee)

            expect((nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1) / (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1)).eq(9)

            expect(app2_market_eth_balance_2).eq(app2_market_eth_balance_1 - result_cash.payTokenAmount - nft_fee - app_owner_fee)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_user2 - cashAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 - cashAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(2)
            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount - cashAmount)

            await app2_market.connect(user1).cash(result.nftTokenId, multiplyNewAmount - cashAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(1)
            await expect(app2_mortgageNFT.ownerOf(result.nftTokenId)).revertedWithCustomError(app2_mortgageNFT, "ERC721NonexistentToken")
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(0)
        });

        it("forceCash with eth | have profit | no sell fee", async function () {
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
            let user2 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7];

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
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount, { value: multiplyNewAmount })
            await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount, { value: result.payTokenAmount })
            expect(result.nftTokenId).eq(1)

            // user2 multiply
            let multiplyNewAmount_user2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            let result_user2 = await app2_market.connect(user2).multiplyNew.staticCall(tid, multiplyNewAmount_user2, { value: multiplyNewAmount_user2 })
            await app2_market.connect(user2).multiplyNew(tid, multiplyNewAmount_user2, { value: result_user2.payTokenAmount })
            expect(result_user2.nftTokenId).eq(2)


            // forceCash
            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_1 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_1 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let cashAmount = BigInt(10) ** BigInt(18) * BigInt(5000)
            let result_cash = await app2_market.connect(user1).forceCash.staticCall(result.nftTokenId, cashAmount)
            let res_cash = await app2_market.connect(user1).forceCash(result.nftTokenId, cashAmount)
            let ress_cash = await res_cash.wait()
            let gas_cash = ress_cash!.gasPrice * ress_cash!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_2 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_2 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result_cash.userProfit).eq(true)
            expect(result_cash.payTokenAmount).eq("10385239649763865")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 + result_cash.payTokenAmount - gas_cash)

            let nft_fee = (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1) + (nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1)
            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1

            let curve_amount_sell = await app2_market.getPayTokenAmount(multiplyNewAmount + multiplyNewAmount_user2 - cashAmount, cashAmount)
            let curve_amount_mortgage = await app2_market.getPayTokenAmount(multiplyNewAmount - cashAmount, cashAmount)

            expect(nft_fee).eq(0)
            expect(app_owner_fee).eq(0)

            expect(curve_amount_sell).gt(curve_amount_mortgage)
            expect(result_cash.payTokenAmount).eq(curve_amount_sell - curve_amount_mortgage)

            expect(app2_market_eth_balance_2).eq(app2_market_eth_balance_1 - result_cash.payTokenAmount - nft_fee - app_owner_fee)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_user2 - cashAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 - cashAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(2)
            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount - cashAmount)

            await app2_market.connect(user1).cash(result.nftTokenId, multiplyNewAmount - cashAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(1)
            await expect(app2_mortgageNFT.ownerOf(result.nftTokenId)).revertedWithCustomError(app2_mortgageNFT, "ERC721NonexistentToken")
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(0)
        });

        it("forceCash with erc20 | have profit", async function () {
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
                appOwnerSellFee: 500,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 1000,
            }

            let nft_1_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
            let nft_2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];

            let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];
            let user2 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7];

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
            await app2_payToken.transfer(await user1.getAddress(), multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), multiplyNewAmount)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount)
            await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount)
            expect(result.nftTokenId).eq(1)

            // user2 multiply
            let multiplyNewAmount_user2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(await user2.getAddress(), multiplyNewAmount_user2)
            await app2_payToken.connect(user2).approve(app2_market.getAddress(), multiplyNewAmount_user2)
            let result_user2 = await app2_market.connect(user2).multiplyNew.staticCall(tid, multiplyNewAmount_user2)
            await app2_market.connect(user2).multiplyNew(tid, multiplyNewAmount_user2)
            expect(result_user2.nftTokenId).eq(2)

            // forceCash
            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let cashAmount = BigInt(10) ** BigInt(18) * BigInt(5000)
            let result_cash = await app2_market.connect(user1).forceCash.staticCall(result.nftTokenId, cashAmount)
            let res_cash = await app2_market.connect(user1).forceCash(result.nftTokenId, cashAmount)
            let ress_cash = await res_cash.wait()
            let gas_cash = ress_cash!.gasPrice * ress_cash!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas_cash)

            expect(result_cash.userProfit).eq(true)
            expect(result_cash.payTokenAmount).eq("2615634345713312")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 + result_cash.payTokenAmount)

            let nft_fee = (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1) + (nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1)
            let app_owner_fee = app2_owner_fee_pay_token_balance_2 - app2_owner_fee_pay_token_balance_1

            let curve_amount_sell = await app2_market.getPayTokenAmount(multiplyNewAmount + multiplyNewAmount_user2 - cashAmount, cashAmount)
            let curve_amount_mortgage = await app2_market.getPayTokenAmount(multiplyNewAmount - cashAmount, cashAmount)

            expect(curve_amount_sell).gt(curve_amount_mortgage)
            expect(result_cash.payTokenAmount).eq(curve_amount_sell - nft_fee - app_owner_fee - curve_amount_mortgage)

            expect(curve_amount_sell / nft_fee).eq(100000 / app2_fees.nftOwnerSellFee)
            expect(curve_amount_sell / app_owner_fee).eq(100000 / app2_fees.appOwnerSellFee)

            expect((nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1) / (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1)).eq(9)

            expect(app2_market_pay_token_balance_2).eq(app2_market_pay_token_balance_1 - result_cash.payTokenAmount - nft_fee - app_owner_fee)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_user2 - cashAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 - cashAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(2)
            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount - cashAmount)

            await app2_market.connect(user1).cash(result.nftTokenId, multiplyNewAmount - cashAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(1)
            await expect(app2_mortgageNFT.ownerOf(result.nftTokenId)).revertedWithCustomError(app2_mortgageNFT, "ERC721NonexistentToken")
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(0)
        });

        it("forceCash with erc20 | have profit | no sell fee", async function () {
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
            let user2 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7];

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
            await app2_payToken.transfer(await user1.getAddress(), multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), multiplyNewAmount)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount)
            await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount)
            expect(result.nftTokenId).eq(1)

            // user2 multiply
            let multiplyNewAmount_user2 = BigInt(10) ** BigInt(18) * BigInt(10000)
            await app2_payToken.transfer(await user2.getAddress(), multiplyNewAmount_user2)
            await app2_payToken.connect(user2).approve(app2_market.getAddress(), multiplyNewAmount_user2)
            let result_user2 = await app2_market.connect(user2).multiplyNew.staticCall(tid, multiplyNewAmount_user2)
            await app2_market.connect(user2).multiplyNew(tid, multiplyNewAmount_user2)
            expect(result_user2.nftTokenId).eq(2)

            // forceCash
            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let cashAmount = BigInt(10) ** BigInt(18) * BigInt(5000)
            let result_cash = await app2_market.connect(user1).forceCash.staticCall(result.nftTokenId, cashAmount)
            let res_cash = await app2_market.connect(user1).forceCash(result.nftTokenId, cashAmount)
            let ress_cash = await res_cash.wait()
            let gas_cash = ress_cash!.gasPrice * ress_cash!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas_cash)

            expect(result_cash.userProfit).eq(true)
            expect(result_cash.payTokenAmount).eq("10385239649763865")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 + result_cash.payTokenAmount)

            let nft_fee = (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1) + (nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1)
            let app_owner_fee = app2_owner_fee_pay_token_balance_2 - app2_owner_fee_pay_token_balance_1

            let curve_amount_sell = await app2_market.getPayTokenAmount(multiplyNewAmount + multiplyNewAmount_user2 - cashAmount, cashAmount)
            let curve_amount_mortgage = await app2_market.getPayTokenAmount(multiplyNewAmount - cashAmount, cashAmount)

            expect(nft_fee).eq(0)
            expect(app_owner_fee).eq(0)

            expect(curve_amount_sell).gt(curve_amount_mortgage)
            expect(result_cash.payTokenAmount).eq(curve_amount_sell - curve_amount_mortgage)

            expect(app2_market_pay_token_balance_2).eq(app2_market_pay_token_balance_1 - result_cash.payTokenAmount - nft_fee - app_owner_fee)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount + multiplyNewAmount_user2 - cashAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 - cashAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(2)
            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount - cashAmount)

            await app2_market.connect(user1).cash(result.nftTokenId, multiplyNewAmount - cashAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(1)
            await expect(app2_mortgageNFT.ownerOf(result.nftTokenId)).revertedWithCustomError(app2_mortgageNFT, "ERC721NonexistentToken")
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(0)
        });

        it("forceCash with eth | no profit", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 300,
                appOwnerSellFee: 500,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 1000,
            }

            let nft_1_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
            let nft_2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];

            let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];
            let user2 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7];

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
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount, { value: multiplyNewAmount })
            await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount, { value: result.payTokenAmount })
            expect(result.nftTokenId).eq(1)

            // forceCash
            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_1 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_1 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let cashAmount = BigInt(10) ** BigInt(18) * BigInt(5000)
            let result_cash = await app2_market.connect(user1).forceCash.staticCall(result.nftTokenId, cashAmount, { value: cashAmount })
            let res_cash = await app2_market.connect(user1).forceCash(result.nftTokenId, cashAmount, { value: result_cash.payTokenAmount })
            let ress_cash = await res_cash.wait()
            let gas_cash = ress_cash!.gasPrice * ress_cash!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_2 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_2 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result_cash.userProfit).eq(false)
            expect(result_cash.payTokenAmount).eq("7613826709304094")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - result_cash.payTokenAmount - gas_cash)

            let nft_fee = (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1) + (nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1)
            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1

            let curve_amount_sell = await app2_market.getPayTokenAmount(multiplyNewAmount - cashAmount, cashAmount)
            let curve_amount_mortgage = await app2_market.getPayTokenAmount(multiplyNewAmount - cashAmount, cashAmount)

            expect(curve_amount_sell).eq(curve_amount_mortgage)
            expect(result_cash.payTokenAmount).eq(nft_fee + app_owner_fee)

            expect(curve_amount_sell / nft_fee).eq(100000 / app2_fees.nftOwnerSellFee)
            expect(curve_amount_sell / app_owner_fee).eq(100000 / app2_fees.appOwnerSellFee)

            expect((nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1) / (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1)).eq(9)

            expect(app2_market_eth_balance_2).eq(app2_market_eth_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount - cashAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 - cashAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(1)
            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount - cashAmount)

            await app2_market.connect(user1).forceCash(result.nftTokenId, multiplyNewAmount - cashAmount, { value: multiplyNewAmount - cashAmount })

            expect(await app2_mortgageNFT.totalSupply()).eq(0)
            await expect(app2_mortgageNFT.ownerOf(result.nftTokenId)).revertedWithCustomError(app2_mortgageNFT, "ERC721NonexistentToken")
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(0)
        });

        it("forceCash with eth | no profit | value > need", async function () {
            const info = (await loadFixture(deployAllContracts));

            let app2_appid = await info.coreContractInfo.foundry.nextAppId()
            let app2_name = "app2";
            let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];
            let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];

            let app2_payToken = ZeroAddress
            let app2_fees = {
                appOwnerBuyFee: 300,
                appOwnerSellFee: 500,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 1000,
            }

            let nft_1_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
            let nft_2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];

            let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];
            let user2 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7];

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
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount, { value: multiplyNewAmount })
            await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount, { value: result.payTokenAmount })
            expect(result.nftTokenId).eq(1)

            // forceCash
            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_1 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_1 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let cashAmount = BigInt(10) ** BigInt(18) * BigInt(5000)
            let result_cash = await app2_market.connect(user1).forceCash.staticCall(result.nftTokenId, cashAmount, { value: cashAmount })
            let res_cash = await app2_market.connect(user1).forceCash(result.nftTokenId, cashAmount, { value: result_cash.payTokenAmount * BigInt(2) })
            let ress_cash = await res_cash.wait()
            let gas_cash = ress_cash!.gasPrice * ress_cash!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let nft_1_owner_eth_balance_2 = await ethers.provider.getBalance(nft_1_owner.address)
            let nft_2_owner_eth_balance_2 = await ethers.provider.getBalance(nft_2_owner.address)
            let app2_owner_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result_cash.userProfit).eq(false)
            expect(result_cash.payTokenAmount).eq("7613826709304094")
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - result_cash.payTokenAmount - gas_cash)

            let nft_fee = (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1) + (nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1)
            let app_owner_fee = app2_owner_fee_eth_balance_2 - app2_owner_fee_eth_balance_1

            let curve_amount_sell = await app2_market.getPayTokenAmount(multiplyNewAmount - cashAmount, cashAmount)
            let curve_amount_mortgage = await app2_market.getPayTokenAmount(multiplyNewAmount - cashAmount, cashAmount)

            expect(curve_amount_sell).eq(curve_amount_mortgage)
            expect(result_cash.payTokenAmount).eq(nft_fee + app_owner_fee)

            expect(curve_amount_sell / nft_fee).eq(100000 / app2_fees.nftOwnerSellFee)
            expect(curve_amount_sell / app_owner_fee).eq(100000 / app2_fees.appOwnerSellFee)

            expect((nft_2_owner_eth_balance_2 - nft_2_owner_eth_balance_1) / (nft_1_owner_eth_balance_2 - nft_1_owner_eth_balance_1)).eq(9)

            expect(app2_market_eth_balance_2).eq(app2_market_eth_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount - cashAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 - cashAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(1)
            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount - cashAmount)

            await app2_market.connect(user1).forceCash(result.nftTokenId, multiplyNewAmount - cashAmount, { value: multiplyNewAmount - cashAmount })

            expect(await app2_mortgageNFT.totalSupply()).eq(0)
            await expect(app2_mortgageNFT.ownerOf(result.nftTokenId)).revertedWithCustomError(app2_mortgageNFT, "ERC721NonexistentToken")
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(0)
        });

        it("forceCash with erc20 | no profit", async function () {
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
                appOwnerSellFee: 500,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 1000,
            }

            let nft_1_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
            let nft_2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];

            let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];
            let user2 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7];

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
            await app2_payToken.transfer(await user1.getAddress(), multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), multiplyNewAmount)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount)
            await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount)
            expect(result.nftTokenId).eq(1)

            // forceCash
            let cashAmount = BigInt(10) ** BigInt(18) * BigInt(5000)
            await app2_payToken.transfer(await user1.getAddress(), cashAmount)
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), MaxUint256)
            let result_cash = await app2_market.connect(user1).forceCash.staticCall(result.nftTokenId, cashAmount)
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), result_cash.payTokenAmount)

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let res_cash = await app2_market.connect(user1).forceCash(result.nftTokenId, cashAmount)
            let ress_cash = await res_cash.wait()
            let gas_cash = ress_cash!.gasPrice * ress_cash!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas_cash)

            expect(result_cash.userProfit).eq(false)
            expect(result_cash.payTokenAmount).eq("7613826709304094")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 - result_cash.payTokenAmount)

            let nft_fee = (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1) + (nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1)
            let app_owner_fee = app2_owner_fee_pay_token_balance_2 - app2_owner_fee_pay_token_balance_1

            let curve_amount_sell = await app2_market.getPayTokenAmount(multiplyNewAmount - cashAmount, cashAmount)
            let curve_amount_mortgage = await app2_market.getPayTokenAmount(multiplyNewAmount - cashAmount, cashAmount)

            expect(curve_amount_sell).eq(curve_amount_mortgage)
            expect(result_cash.payTokenAmount).eq(nft_fee + app_owner_fee)

            expect(curve_amount_sell / nft_fee).eq(100000 / app2_fees.nftOwnerSellFee)
            expect(curve_amount_sell / app_owner_fee).eq(100000 / app2_fees.appOwnerSellFee)

            expect((nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1) / (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1)).eq(9)

            expect(app2_market_pay_token_balance_2).eq(app2_market_pay_token_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount - cashAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 - cashAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(1)
            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount - cashAmount)

            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), multiplyNewAmount - cashAmount)
            await app2_market.connect(user1).forceCash(result.nftTokenId, multiplyNewAmount - cashAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(0)
            await expect(app2_mortgageNFT.ownerOf(result.nftTokenId)).revertedWithCustomError(app2_mortgageNFT, "ERC721NonexistentToken")
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(0)
        });

        it("forceCash with erc20 | no profit | approve > need", async function () {
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
                appOwnerSellFee: 500,
                appOwnerMortgageFee: 400,
                appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3],
                nftOwnerBuyFee: 600,
                nftOwnerSellFee: 1000,
            }

            let nft_1_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
            let nft_2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];

            let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];
            let user2 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7];

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
            await app2_payToken.transfer(await user1.getAddress(), multiplyNewAmount)
            await app2_payToken.connect(user1).approve(app2_market.getAddress(), multiplyNewAmount)
            let result = await app2_market.connect(user1).multiplyNew.staticCall(tid, multiplyNewAmount)
            await app2_market.connect(user1).multiplyNew(tid, multiplyNewAmount)
            expect(result.nftTokenId).eq(1)

            // forceCash
            let cashAmount = BigInt(10) ** BigInt(18) * BigInt(5000)
            await app2_payToken.transfer(await user1.getAddress(), cashAmount)
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), MaxUint256)
            let result_cash = await app2_market.connect(user1).forceCash.staticCall(result.nftTokenId, cashAmount)
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), result_cash.payTokenAmount * BigInt(2))

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_1 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let res_cash = await app2_market.connect(user1).forceCash(result.nftTokenId, cashAmount)
            let ress_cash = await res_cash.wait()
            let gas_cash = ress_cash!.gasPrice * ress_cash!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let nft_1_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_1_owner.address)
            let nft_2_owner_pay_token_balance_2 = await app2_payToken.balanceOf(nft_2_owner.address)
            let app2_owner_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas_cash)

            expect(result_cash.userProfit).eq(false)
            expect(result_cash.payTokenAmount).eq("7613826709304094")
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 - result_cash.payTokenAmount)

            let nft_fee = (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1) + (nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1)
            let app_owner_fee = app2_owner_fee_pay_token_balance_2 - app2_owner_fee_pay_token_balance_1

            let curve_amount_sell = await app2_market.getPayTokenAmount(multiplyNewAmount - cashAmount, cashAmount)
            let curve_amount_mortgage = await app2_market.getPayTokenAmount(multiplyNewAmount - cashAmount, cashAmount)

            expect(curve_amount_sell).eq(curve_amount_mortgage)
            expect(result_cash.payTokenAmount).eq(nft_fee + app_owner_fee)

            expect(curve_amount_sell / nft_fee).eq(100000 / app2_fees.nftOwnerSellFee)
            expect(curve_amount_sell / app_owner_fee).eq(100000 / app2_fees.appOwnerSellFee)

            expect((nft_2_owner_pay_token_balance_2 - nft_2_owner_pay_token_balance_1) / (nft_1_owner_pay_token_balance_2 - nft_1_owner_pay_token_balance_1)).eq(9)

            expect(app2_market_pay_token_balance_2).eq(app2_market_pay_token_balance_1)

            expect(await app2_market.totalSupply(tid)).eq(multiplyNewAmount - cashAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1).eq(0)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1 - cashAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(1)
            expect(await app2_mortgageNFT.ownerOf(result.nftTokenId)).eq(user1.address)
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(multiplyNewAmount - cashAmount)

            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), multiplyNewAmount - cashAmount)
            await app2_market.connect(user1).forceCash(result.nftTokenId, multiplyNewAmount - cashAmount)

            expect(await app2_mortgageNFT.totalSupply()).eq(0)
            await expect(app2_mortgageNFT.ownerOf(result.nftTokenId)).revertedWithCustomError(app2_mortgageNFT, "ERC721NonexistentToken")
            expect((await app2_mortgageNFT.info(result.nftTokenId)).amount).eq(0)
        });
    });
});
