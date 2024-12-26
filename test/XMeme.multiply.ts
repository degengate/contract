import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";

import { deployAllContracts } from "./shared/deploy";

import { Token } from "../typechain-types";
import { ethers } from "hardhat";

describe("XMeme.multiply", function () {
    it("createTokenAndMultiply revert", async function () {
        const baseInfo = (await loadFixture(deployAllContracts));
        const coreInfo = baseInfo.coreContractInfo;
        const info = baseInfo.xMemeAllContractInfo;

        await expect(
            info.xMeme.connect(info.userWallet).createTokenAndMultiply("1", 1, { value: BigInt(10) ** BigInt(20) })
        ).revertedWith("SRE");

        await info.xMeme.setSystemReady(true)

        // multiply 0
        const tid = "1"
        await expect(info.xMeme.connect(info.userWallet).createTokenAndMultiply(tid, 0, { value: BigInt(10) ** BigInt(20) })).to.be.revertedWith("TAE");

        // multiply 100w
        await expect(info.xMeme.connect(info.userWallet).createTokenAndMultiply(tid, BigInt(10) ** BigInt(24), { value: BigInt(10) ** BigInt(20) })).to.be.revertedWithPanic(0x12)

        // value < need
        let result = await info.xMeme.connect(info.userWallet).createTokenAndMultiply.staticCall(tid, BigInt(10) ** BigInt(18), { value: BigInt(10) ** BigInt(20) })
        await expect(info.xMeme.connect(info.userWallet).createTokenAndMultiply(tid, BigInt(10) ** BigInt(18), { value: result.payEthAmount - BigInt(1) })).to.be.revertedWith("VE");

        // have tid
        await info.xMeme.connect(info.userWallet).createTokenAndMultiply(tid, BigInt(10) ** BigInt(18), { value: result.payEthAmount })
        await expect(info.xMeme.connect(info.userWallet).createTokenAndMultiply(tid, BigInt(10) ** BigInt(18), { value: result.payEthAmount * BigInt(2) })).to.be.revertedWith("TE");
    });

    it("createTokenAndMultiply and multiply", async function () {
        const baseInfo = (await loadFixture(deployAllContracts));
        const coreInfo = baseInfo.coreContractInfo;
        const info = baseInfo.xMemeAllContractInfo;

        let newONFTOwner = info.wallets[info.nextWalletIndex + 1]

        await info.xMeme.setSystemReady(true)

        const tid = "1"
        const multiplyAmount = BigInt(10) ** BigInt(18) * BigInt(50)

        let user_1_eth = await ethers.provider.getBalance(info.userWallet.address);
        let app_owner_fee_1_eth = await ethers.provider.getBalance(info.appOwnerFeeWallet.address);
        let xmeme_1_eth = await ethers.provider.getBalance(await info.xMeme.getAddress());
        let platformMortgageFee_1_eth = await ethers.provider.getBalance(await info.platformMortgageFeeWallet.getAddress());
        let market_1_eth = await ethers.provider.getBalance(await info.market.getAddress());
        let fundRecipient_1_eth = await ethers.provider.getBalance(await info.fundRecipientWallet.getAddress());

        let result = await info.xMeme.connect(info.userWallet).createTokenAndMultiply.staticCall(tid, multiplyAmount, { value: BigInt(10) ** BigInt(20) });
        let payEthAmount = result.payEthAmount;
        await info.xMeme.connect(info.userWallet).createTokenAndMultiply.staticCall(tid, multiplyAmount, { value: payEthAmount });
        let res = await info.xMeme.connect(info.userWallet).createTokenAndMultiply(tid, multiplyAmount, { value: payEthAmount * BigInt(2) });
        let resw = await res.wait();
        let gas_1 = resw!.gasPrice! * resw!.gasUsed!

        let tokenAddr = await coreInfo.foundry.token(info.appId, tid);
        let token: Token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

        let user_2_eth = await ethers.provider.getBalance(info.userWallet.address);
        let app_owner_fee_2_eth = await ethers.provider.getBalance(info.appOwnerFeeWallet.address);
        let xmeme_2_eth = await ethers.provider.getBalance(await info.xMeme.getAddress());
        let platformMortgageFee_2_eth = await ethers.provider.getBalance(await info.platformMortgageFeeWallet.getAddress());
        let market_2_eth = await ethers.provider.getBalance(await info.market.getAddress());
        let fundRecipient_2_eth = await ethers.provider.getBalance(await info.fundRecipientWallet.getAddress());

        let user_2_token = await token.balanceOf(info.userWallet.address);
        let market_2_token = await token.balanceOf(await info.market.getAddress());

        // 0.6 + 0.3
        expect(app_owner_fee_2_eth - app_owner_fee_1_eth).eq("45002250112504")
        // 1
        expect(xmeme_2_eth - xmeme_1_eth).eq("50002500125006")
        // 0.1
        expect(platformMortgageFee_2_eth - platformMortgageFee_1_eth).eq("5000250012500")
        expect(payEthAmount).eq("10100005000250010")
        expect(payEthAmount).eq(
            (platformMortgageFee_2_eth - platformMortgageFee_1_eth) +
            (app_owner_fee_2_eth - app_owner_fee_1_eth) +
            (xmeme_2_eth - xmeme_1_eth) +
            info.firstBuyFee
        )

        expect(fundRecipient_2_eth).eq(fundRecipient_1_eth + info.firstBuyFee)

        expect(user_2_eth).eq(user_1_eth - gas_1 - payEthAmount)

        expect(market_2_token).eq(multiplyAmount)
        expect(user_2_token).eq(0)

        expect(market_2_eth).eq(market_1_eth).eq(0)

        expect(await info.mortgageNFT.ownerOf(result.mortgageNFTtokenId)).eq(info.userWallet.address)
        let info1 = await info.mortgageNFT.info(result.mortgageNFTtokenId);
        expect(info1.tid).eq(tid)
        expect(info1.amount).eq(multiplyAmount)

        let result2 = await info.market.connect(info.userWallet).multiply.staticCall(tid, multiplyAmount, { value: BigInt(10) ** BigInt(20) });
        let payEthAmount2 = result2.payTokenAmount;
        let res2 = await info.market.connect(info.userWallet).multiply(tid, multiplyAmount, { value: BigInt(10) ** BigInt(20) });
        let resw2 = await res2.wait();
        let gas_2 = resw2!.gasPrice! * resw2!.gasUsed!

        let user_3_eth = await ethers.provider.getBalance(info.userWallet.address);
        let user_3_token = await token.balanceOf(info.userWallet.address);
        let market_3_token = await token.balanceOf(await info.market.getAddress());
        let app_owner_fee_3_eth = await ethers.provider.getBalance(info.appOwnerFeeWallet.address);
        let xmeme_3_eth = await ethers.provider.getBalance(await info.xMeme.getAddress());
        let platformMortgageFee_3_eth = await ethers.provider.getBalance(await info.platformMortgageFeeWallet.getAddress());

        // 0.6 + 0.3
        expect(app_owner_fee_3_eth - app_owner_fee_2_eth).eq("45006750787584")
        // 1
        expect(xmeme_3_eth - xmeme_2_eth).eq("50007500875093")
        // 0.1
        expect(platformMortgageFee_3_eth - platformMortgageFee_2_eth).eq("5000750087509")
        expect(payEthAmount2).eq("100015001750186")
        expect(payEthAmount2).eq(
            (platformMortgageFee_3_eth - platformMortgageFee_2_eth) +
            (app_owner_fee_3_eth - app_owner_fee_2_eth) +
            (xmeme_3_eth - xmeme_2_eth)
        )

        expect(user_2_eth - gas_2 - payEthAmount2).eq(user_3_eth)

        expect(user_3_token - user_2_token).eq(0)
        expect(market_3_token - market_2_token).eq(multiplyAmount)

        let info2 = await info.mortgageNFT.info(result.mortgageNFTtokenId);
        expect(info2.tid).eq(tid)
        expect(info2.amount).eq(multiplyAmount * BigInt(2))


        let signature = await info.signatureWallet.signMessage(
            ethers.toBeArray(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        [
                            "string",
                            "address",
                        ],
                        [tid, await newONFTOwner.getAddress()],
                    ),
                ),
            ),
        );

        expect(await info.feeNFT.ownerOf(1)).eq(await info.xMeme.getAddress())
        expect(await info.xMeme.isClaim(tid)).eq(false)
        await info.xMeme.connect(newONFTOwner).claim(tid, signature);
        expect(await info.feeNFT.ownerOf(1)).eq(newONFTOwner.address)
        expect(await info.xMeme.isClaim(tid)).eq(true)

        await info.market.connect(info.deployWallet).multiply(tid, multiplyAmount * BigInt(1000), { value: BigInt(10) ** BigInt(21) });

        let user_4_eth = await ethers.provider.getBalance(info.userWallet.address);
        let user_4_token = await token.balanceOf(info.userWallet.address);
        let market_4_token = await token.balanceOf(await info.market.getAddress());
        let app_owner_fee_4_eth = await ethers.provider.getBalance(info.appOwnerFeeWallet.address);
        let xmeme_4_eth = await ethers.provider.getBalance(await info.xMeme.getAddress());
        let platformMortgageFee_4_eth = await ethers.provider.getBalance(await info.platformMortgageFeeWallet.getAddress());
        let onft_owner_4_eth = await ethers.provider.getBalance(newONFTOwner.address);

        let result3 = await info.market.connect(info.userWallet).cash.staticCall(1, multiplyAmount);
        let res3 = await info.market.connect(info.userWallet).cash(result.mortgageNFTtokenId, multiplyAmount);
        let resw3 = await res3.wait();
        let gas_3 = resw3!.gasPrice! * resw3!.gasUsed!

        let user_5_eth = await ethers.provider.getBalance(info.userWallet.address);
        let user_5_token = await token.balanceOf(info.userWallet.address);
        let market_5_token = await token.balanceOf(await info.market.getAddress());
        let app_owner_fee_5_eth = await ethers.provider.getBalance(info.appOwnerFeeWallet.address);
        let xmeme_5_eth = await ethers.provider.getBalance(await info.xMeme.getAddress());
        let platformMortgageFee_5_eth = await ethers.provider.getBalance(await info.platformMortgageFeeWallet.getAddress());
        let onft_owner_5_eth = await ethers.provider.getBalance(newONFTOwner.address);

        let info3 = await info.mortgageNFT.info(result.mortgageNFTtokenId);
        expect(info3.tid).eq(tid)
        expect(info3.amount).eq(multiplyAmount)

        expect(user_4_eth - gas_3 + result3).eq(user_5_eth)
        expect(market_4_token - multiplyAmount).eq(market_5_token)
        expect(user_5_token).eq(user_4_token).eq(0)

        expect(app_owner_fee_5_eth - app_owner_fee_4_eth).eq("33246246453061")
        expect(platformMortgageFee_5_eth - platformMortgageFee_4_eth).eq(0)
        expect(onft_owner_5_eth - onft_owner_4_eth).eq("55410410755103")
        expect(xmeme_5_eth - xmeme_4_eth).eq(0)

    });
});

