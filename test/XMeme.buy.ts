import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";

import { deployAllContracts } from "./shared/deploy";

import { Token } from "../typechain-types";
import { ethers } from "hardhat";

describe("XMeme.buy", function () {
    it("createTokenAndBuy and buy and claim and sell", async function () {
        const baseInfo = (await loadFixture(deployAllContracts));
        const coreInfo = baseInfo.coreContractInfo;
        const info = baseInfo.xMemeAllContractInfo;

        let newONFTOwner = info.wallets[info.nextWalletIndex + 1]

        await expect(
            info.xMeme.connect(info.userWallet).createTokenAndBuy("1", 1, { value: BigInt(10) ** BigInt(20) })
        ).revertedWith("SRE");

        await info.xMeme.setSystemReady(true)

        const tid = "1"
        const tokenAmount = BigInt(10) ** BigInt(18)

        let user_1_eth = await ethers.provider.getBalance(info.userWallet.address);
        let app_owner_fee_1_eth = await ethers.provider.getBalance(info.appOwnerFeeWallet.address);
        let xmeme_1_eth = await ethers.provider.getBalance(await info.xMeme.getAddress());

        let payEthAmount = await info.xMeme.connect(info.userWallet).createTokenAndBuy.staticCall(tid, tokenAmount, { value: BigInt(10) ** BigInt(20) });
        let res = await info.xMeme.connect(info.userWallet).createTokenAndBuy(tid, tokenAmount, { value: BigInt(10) ** BigInt(20) });
        let resw = await res.wait();
        let gas_1 = resw!.gasPrice! * resw!.gasUsed!

        let tokenAddr = await coreInfo.foundry.token(info.appId, tid);
        let token: Token = (await ethers.getContractAt("Token", tokenAddr)) as Token;

        let user_2_eth = await ethers.provider.getBalance(info.userWallet.address);
        let user_2_token = await token.balanceOf(info.userWallet.address);
        let app_owner_fee_2_eth = await ethers.provider.getBalance(info.appOwnerFeeWallet.address);
        let xmeme_2_eth = await ethers.provider.getBalance(await info.xMeme.getAddress());

        expect(app_owner_fee_2_eth - app_owner_fee_1_eth).eq("600000600000")
        expect(xmeme_2_eth - xmeme_1_eth).eq("1000001000001")
        expect(payEthAmount).eq("10101600101600101")
        expect(payEthAmount).eq(
            (await info.curve.curveMath(0, tokenAmount)) +
            (app_owner_fee_2_eth - app_owner_fee_1_eth) +
            (xmeme_2_eth - xmeme_1_eth) +
            info.firstBuyFee
        )

        expect(user_1_eth - gas_1 - payEthAmount).eq(user_2_eth)

        expect(user_2_token).eq(tokenAmount)


        let payEthAmount2 = await info.market.connect(info.userWallet).buy.staticCall(tid, tokenAmount, { value: BigInt(10) ** BigInt(20) });
        let res2 = await info.market.connect(info.userWallet).buy(tid, tokenAmount, { value: BigInt(10) ** BigInt(20) });
        let resw2 = await res2.wait();
        let gas_2 = resw2!.gasPrice! * resw2!.gasUsed!

        let user_3_eth = await ethers.provider.getBalance(info.userWallet.address);
        let user_3_token = await token.balanceOf(info.userWallet.address);
        let app_owner_fee_3_eth = await ethers.provider.getBalance(info.appOwnerFeeWallet.address);
        let xmeme_3_eth = await ethers.provider.getBalance(await info.xMeme.getAddress());


        expect(app_owner_fee_3_eth - app_owner_fee_2_eth).eq("600001800004")
        expect(xmeme_3_eth - xmeme_2_eth).eq("1000003000007")
        expect(payEthAmount2).eq("101600304800711")
        expect(payEthAmount2).eq(
            (await info.curve.curveMath(tokenAmount, tokenAmount)) +
            (app_owner_fee_3_eth - app_owner_fee_2_eth) +
            (xmeme_3_eth - xmeme_2_eth)
        )

        expect(user_2_eth - gas_2 - payEthAmount2).eq(user_3_eth)

        expect(user_3_token - user_2_token).eq(tokenAmount)

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

        await token.connect(info.userWallet).approve(await info.market.getAddress(), tokenAmount);

        let onft_owner_3_eth = await ethers.provider.getBalance(newONFTOwner.address);
        let user_3_eth_new = await ethers.provider.getBalance(info.userWallet.address);

        let payEthAmount3 = await info.market.connect(info.userWallet).sell.staticCall(tid, tokenAmount);
        let res3 = await info.market.connect(info.userWallet).sell(tid, tokenAmount);
        let resw3 = await res3.wait();
        let gas_3 = resw3!.gasPrice! * resw3!.gasUsed!

        let user_4_eth = await ethers.provider.getBalance(info.userWallet.address);
        let user_4_token = await token.balanceOf(info.userWallet.address);
        let app_owner_fee_4_eth = await ethers.provider.getBalance(info.appOwnerFeeWallet.address);
        let xmeme_4_eth = await ethers.provider.getBalance(await info.xMeme.getAddress());
        let onft_owner_4_eth = await ethers.provider.getBalance(newONFTOwner.address);

        expect(await token.totalSupply()).eq(tokenAmount)

        expect(user_3_token - tokenAmount).eq(user_4_token)
        expect(user_3_eth_new - gas_3 + payEthAmount3).eq(user_4_eth)

        expect(app_owner_fee_4_eth - app_owner_fee_3_eth).eq("600001800004")
        expect(xmeme_4_eth - xmeme_3_eth).eq(0)
        expect(onft_owner_4_eth - onft_owner_3_eth).eq("1000003000007")

        expect(payEthAmount3).eq("98400295200689")
        expect(payEthAmount3).eq(
            (await info.curve.curveMath(tokenAmount, tokenAmount)) -
            (app_owner_fee_4_eth - app_owner_fee_3_eth) -
            (onft_owner_4_eth - onft_owner_3_eth)
        )
    });
});

