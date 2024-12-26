import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { getTokenAmountWei } from "./shared/utils";
import { ethers } from "hardhat";
import { Market, MortgageNFT, SimpleToken, Token } from "../typechain-types";
import { MaxUint256, ZeroAddress } from "ethers";

describe("Market", function () {
    describe("split", function () {
        it("split revert", async function () {
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
            await expect(info.market.connect(user1).split(result3.nftTokenId, 1)).to.be.revertedWith("AOE")

            // no tokenid
            await expect(info.market.connect(user1).split(11, 1)).to.be.revertedWithCustomError(info.mortgageNFT, "ERC721NonexistentToken")

            // not enough amount
            await expect(info.market.connect(user1).split(result1.nftTokenId, buyAmount_1_user_1)).to.be.revertedWith("SAE")
            await expect(info.market.connect(user1).split(result1.nftTokenId, buyAmount_1_user_1 + BigInt(1))).to.be.revertedWith("SAE")

            // split 0
            await expect(info.market.connect(user1).split(result1.nftTokenId, 0)).to.be.revertedWith("SAE")

            // input < need
            let result = await info.market.connect(user1).split.staticCall(result1.nftTokenId, buyAmount_1_user_1 - BigInt(10) ** BigInt(18), { value: BigInt(10) ** BigInt(20) })
            await expect(info.market.connect(user1).split(result1.nftTokenId, buyAmount_1_user_1 - BigInt(10) ** BigInt(18), { value: result.payTokenAmount - BigInt(1) })).to.be.revertedWith("VE")
        });

        it("split revert erc20", async function () {
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
            await expect(app2_market.connect(user1).split(result3.nftTokenId, 1)).to.be.revertedWith("AOE")

            // no tokenid
            await expect(app2_market.connect(user1).split(11, 1)).to.be.revertedWithCustomError(app2_mortgageNFT, "ERC721NonexistentToken")

            // not enough amount
            await expect(app2_market.connect(user1).split(result1.nftTokenId, buyAmount_1_user_1)).to.be.revertedWith("SAE")
            await expect(app2_market.connect(user1).split(result1.nftTokenId, buyAmount_1_user_1 + BigInt(1))).to.be.revertedWith("SAE")

            // split 0
            await expect(app2_market.connect(user1).split(result1.nftTokenId, 0)).to.be.revertedWith("SAE")

            // input < need
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), BigInt(10) ** BigInt(20))
            let result = await app2_market.connect(user1).split.staticCall(result1.nftTokenId, buyAmount_1_user_1 - BigInt(10) ** BigInt(18))
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), result.payTokenAmount - BigInt(1))
            await expect(app2_market.connect(user1).split(result1.nftTokenId, buyAmount_1_user_1 - BigInt(10) ** BigInt(18))).to.be.revertedWithCustomError(app2_payToken, "ERC20InsufficientAllowance")
        });

        it("split with eth", async function () {
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

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(30000)
            await app2_market.connect(user1).buy(tid, buyAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })

            let mortgageAmount_1 = BigInt(10) ** BigInt(18) * BigInt(11000)
            await token.connect(user1).approve(app2_market.getAddress(), mortgageAmount_1)
            let result1 = await app2_market.connect(user1).mortgageNew.staticCall(tid, mortgageAmount_1)
            await app2_market.connect(user1).mortgageNew(tid, mortgageAmount_1)

            let mortgageAmount_2 = BigInt(10) ** BigInt(18) * BigInt(19000)
            await token.connect(user1).approve(app2_market.getAddress(), mortgageAmount_2)
            let result2 = await app2_market.connect(user1).mortgageNew.staticCall(tid, mortgageAmount_2)
            await app2_market.connect(user1).mortgageNew(tid, mortgageAmount_2)

            expect(await app2_mortgageNFT.totalSupply()).eq(2)

            // split
            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let platform_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let splitAmount = mortgageAmount_1 - BigInt(10) ** BigInt(19)
            let result_split = await app2_market.connect(user1).split.staticCall(result1.nftTokenId, splitAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })
            let res = await app2_market.connect(user1).split(result1.nftTokenId, splitAmount, { value: result_split.payTokenAmount })
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let platform_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result_split.payTokenAmount).eq("22348060793056")
            expect(result_split.newNFTTokenId).eq(3)
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - result_split.payTokenAmount - gas)

            let app_owner_mortgage_fee = app2_owner_mortgage_fee_eth_balance_2 - app2_owner_mortgage_fee_eth_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_eth_balance_2 - platform_mortgage_fee_eth_balance_1
            let curve_amount_split = await app2_market.getPayTokenAmount(mortgageAmount_1 - splitAmount, splitAmount) - await app2_market.getPayTokenAmount(0, splitAmount)

            expect(result_split.payTokenAmount).eq(curve_amount_split)
            expect(app_owner_mortgage_fee).eq(0)
            expect(platform_mortgage_fee).eq(0)

            expect(app2_market_eth_balance_2).eq(app2_market_eth_balance_1 + curve_amount_split)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1)

            expect(await app2_mortgageNFT.totalSupply()).eq(3)
            expect(await app2_mortgageNFT.ownerOf(result1.nftTokenId)).eq(user1.address)
            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect(await app2_mortgageNFT.ownerOf(result_split.newNFTTokenId)).eq(user1.address)

            expect((await app2_mortgageNFT.info(result1.nftTokenId)).amount).eq(mortgageAmount_1 - splitAmount)
            expect((await app2_mortgageNFT.info(result_split.newNFTTokenId)).amount).eq(splitAmount)
        });

        it("split with eth | value > need", async function () {
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

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(30000)
            await app2_market.connect(user1).buy(tid, buyAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })

            let mortgageAmount_1 = BigInt(10) ** BigInt(18) * BigInt(11000)
            await token.connect(user1).approve(app2_market.getAddress(), mortgageAmount_1)
            let result1 = await app2_market.connect(user1).mortgageNew.staticCall(tid, mortgageAmount_1)
            await app2_market.connect(user1).mortgageNew(tid, mortgageAmount_1)

            let mortgageAmount_2 = BigInt(10) ** BigInt(18) * BigInt(19000)
            await token.connect(user1).approve(app2_market.getAddress(), mortgageAmount_2)
            let result2 = await app2_market.connect(user1).mortgageNew.staticCall(tid, mortgageAmount_2)
            await app2_market.connect(user1).mortgageNew(tid, mortgageAmount_2)

            expect(await app2_mortgageNFT.totalSupply()).eq(2)

            // split
            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())
            let platform_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_eth_balance_1 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_1 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let splitAmount = mortgageAmount_1 - BigInt(10) ** BigInt(19)
            let result_split = await app2_market.connect(user1).split.staticCall(result1.nftTokenId, splitAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })
            let res = await app2_market.connect(user1).split(result1.nftTokenId, splitAmount, { value: result_split.payTokenAmount * BigInt(2) })
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())
            let platform_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_eth_balance_2 = await ethers.provider.getBalance(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_eth_balance_2 = await ethers.provider.getBalance(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            expect(result_split.payTokenAmount).eq("22348060793056")
            expect(result_split.newNFTTokenId).eq(3)
            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - result_split.payTokenAmount - gas)

            let app_owner_mortgage_fee = app2_owner_mortgage_fee_eth_balance_2 - app2_owner_mortgage_fee_eth_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_eth_balance_2 - platform_mortgage_fee_eth_balance_1
            let curve_amount_split = await app2_market.getPayTokenAmount(mortgageAmount_1 - splitAmount, splitAmount) - await app2_market.getPayTokenAmount(0, splitAmount)

            expect(result_split.payTokenAmount).eq(curve_amount_split)
            expect(app_owner_mortgage_fee).eq(0)
            expect(platform_mortgage_fee).eq(0)

            expect(app2_market_eth_balance_2).eq(app2_market_eth_balance_1 + curve_amount_split)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1)

            expect(await app2_mortgageNFT.totalSupply()).eq(3)
            expect(await app2_mortgageNFT.ownerOf(result1.nftTokenId)).eq(user1.address)
            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect(await app2_mortgageNFT.ownerOf(result_split.newNFTTokenId)).eq(user1.address)

            expect((await app2_mortgageNFT.info(result1.nftTokenId)).amount).eq(mortgageAmount_1 - splitAmount)
            expect((await app2_mortgageNFT.info(result_split.newNFTTokenId)).amount).eq(splitAmount)
        });

        it("split with erc20", async function () {
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

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(30000)
            await app2_payToken.transfer(user1.address, buyAmount * BigInt(10))
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), buyAmount * BigInt(10))
            await app2_market.connect(user1).buy(tid, buyAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })

            let mortgageAmount_1 = BigInt(10) ** BigInt(18) * BigInt(11000)
            await token.connect(user1).approve(app2_market.getAddress(), mortgageAmount_1)
            let result1 = await app2_market.connect(user1).mortgageNew.staticCall(tid, mortgageAmount_1)
            await app2_market.connect(user1).mortgageNew(tid, mortgageAmount_1)

            let mortgageAmount_2 = BigInt(10) ** BigInt(18) * BigInt(19000)
            await token.connect(user1).approve(app2_market.getAddress(), mortgageAmount_2)
            let result2 = await app2_market.connect(user1).mortgageNew.staticCall(tid, mortgageAmount_2)
            await app2_market.connect(user1).mortgageNew(tid, mortgageAmount_2)

            expect(await app2_mortgageNFT.totalSupply()).eq(2)

            // split
            let splitAmount = mortgageAmount_1 - BigInt(10) ** BigInt(19)
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), MaxUint256)
            let result_split = await app2_market.connect(user1).split.staticCall(result1.nftTokenId, splitAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), result_split.payTokenAmount)

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let platform_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let res = await app2_market.connect(user1).split(result1.nftTokenId, splitAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let platform_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(result_split.payTokenAmount).eq("22348060793056")
            expect(result_split.newNFTTokenId).eq(3)
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 - result_split.payTokenAmount)

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)

            let app_owner_mortgage_fee = app2_owner_mortgage_fee_pay_token_balance_2 - app2_owner_mortgage_fee_pay_token_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_pay_token_balance_2 - platform_mortgage_fee_pay_token_balance_1
            let curve_amount_split = await app2_market.getPayTokenAmount(mortgageAmount_1 - splitAmount, splitAmount) - await app2_market.getPayTokenAmount(0, splitAmount)

            expect(result_split.payTokenAmount).eq(curve_amount_split)
            expect(app_owner_mortgage_fee).eq(0)
            expect(platform_mortgage_fee).eq(0)

            expect(app2_market_pay_token_balance_2).eq(app2_market_pay_token_balance_1 + curve_amount_split)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1)

            expect(await app2_mortgageNFT.totalSupply()).eq(3)
            expect(await app2_mortgageNFT.ownerOf(result1.nftTokenId)).eq(user1.address)
            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect(await app2_mortgageNFT.ownerOf(result_split.newNFTTokenId)).eq(user1.address)

            expect((await app2_mortgageNFT.info(result1.nftTokenId)).amount).eq(mortgageAmount_1 - splitAmount)
            expect((await app2_mortgageNFT.info(result_split.newNFTTokenId)).amount).eq(splitAmount)
        });

        it("split with erc20 | approve > need", async function () {
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

            let buyAmount = BigInt(10) ** BigInt(18) * BigInt(30000)
            await app2_payToken.transfer(user1.address, buyAmount * BigInt(10))
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), buyAmount * BigInt(10))
            await app2_market.connect(user1).buy(tid, buyAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })

            let mortgageAmount_1 = BigInt(10) ** BigInt(18) * BigInt(11000)
            await token.connect(user1).approve(app2_market.getAddress(), mortgageAmount_1)
            let result1 = await app2_market.connect(user1).mortgageNew.staticCall(tid, mortgageAmount_1)
            await app2_market.connect(user1).mortgageNew(tid, mortgageAmount_1)

            let mortgageAmount_2 = BigInt(10) ** BigInt(18) * BigInt(19000)
            await token.connect(user1).approve(app2_market.getAddress(), mortgageAmount_2)
            let result2 = await app2_market.connect(user1).mortgageNew.staticCall(tid, mortgageAmount_2)
            await app2_market.connect(user1).mortgageNew(tid, mortgageAmount_2)

            expect(await app2_mortgageNFT.totalSupply()).eq(2)

            // split
            let splitAmount = mortgageAmount_1 - BigInt(10) ** BigInt(19)
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), MaxUint256)
            let result_split = await app2_market.connect(user1).split.staticCall(result1.nftTokenId, splitAmount, { value: BigInt(10) ** BigInt(18) * BigInt(1000) })
            await app2_payToken.connect(user1).approve(await app2_market.getAddress(), result_split.payTokenAmount * BigInt(2))

            let user1_pay_token_balance_1 = await app2_payToken.balanceOf(await user1.getAddress())
            let platform_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_pay_token_balance_1 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_1 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_1 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_1 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_1 = await ethers.provider.getBalance(await user1.getAddress())

            let res = await app2_market.connect(user1).split(result1.nftTokenId, splitAmount)
            let ress = await res.wait()
            let gas = ress!.gasPrice * ress!.gasUsed

            let user1_pay_token_balance_2 = await app2_payToken.balanceOf(await user1.getAddress())
            let platform_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(platformMortgageFeeRecipient.address)
            let app2_owner_mortgage_fee_pay_token_balance_2 = await app2_payToken.balanceOf(app2_fees.appOwnerFeeRecipient.address)
            let app2_market_pay_token_balance_2 = await app2_payToken.balanceOf(app2_market.getAddress())

            let user1_token_balance_2 = await app2_market.balanceOf(tid, await user1.getAddress())
            let app2_market_token_balance_2 = await app2_market.balanceOf(tid, await app2_market.getAddress())

            let user1_eth_balance_2 = await ethers.provider.getBalance(await user1.getAddress())

            expect(result_split.payTokenAmount).eq("22348060793056")
            expect(result_split.newNFTTokenId).eq(3)
            expect(user1_pay_token_balance_2).eq(user1_pay_token_balance_1 - result_split.payTokenAmount)

            expect(user1_eth_balance_2).eq(user1_eth_balance_1 - gas)

            let app_owner_mortgage_fee = app2_owner_mortgage_fee_pay_token_balance_2 - app2_owner_mortgage_fee_pay_token_balance_1
            let platform_mortgage_fee = platform_mortgage_fee_pay_token_balance_2 - platform_mortgage_fee_pay_token_balance_1
            let curve_amount_split = await app2_market.getPayTokenAmount(mortgageAmount_1 - splitAmount, splitAmount) - await app2_market.getPayTokenAmount(0, splitAmount)

            expect(result_split.payTokenAmount).eq(curve_amount_split)
            expect(app_owner_mortgage_fee).eq(0)
            expect(platform_mortgage_fee).eq(0)

            expect(app2_market_pay_token_balance_2).eq(app2_market_pay_token_balance_1 + curve_amount_split)

            expect(await app2_market.totalSupply(tid)).eq(buyAmount)
            expect(user1_token_balance_2).eq(user1_token_balance_1)
            expect(app2_market_token_balance_2).eq(app2_market_token_balance_1)

            expect(await app2_mortgageNFT.totalSupply()).eq(3)
            expect(await app2_mortgageNFT.ownerOf(result1.nftTokenId)).eq(user1.address)
            expect(await app2_mortgageNFT.ownerOf(result2.nftTokenId)).eq(user1.address)
            expect(await app2_mortgageNFT.ownerOf(result_split.newNFTTokenId)).eq(user1.address)

            expect((await app2_mortgageNFT.info(result1.nftTokenId)).amount).eq(mortgageAmount_1 - splitAmount)
            expect((await app2_mortgageNFT.info(result_split.newNFTTokenId)).amount).eq(splitAmount)
        });
    });
});
