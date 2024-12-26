import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";

import { deployAllContracts } from "./shared/deploy";

import { Token } from "../typechain-types";
import { ethers } from "hardhat";

describe("XMeme", function () {
    it("deploy", async function () {
        const info = (await loadFixture(deployAllContracts));
        const xMemeInfo = info.xMemeAllContractInfo;
        const coreInfo = info.coreContractInfo;

        expect(await xMemeInfo.xMeme.foundry()).eq(await coreInfo.foundry.getAddress());
        expect(await xMemeInfo.xMeme.appId()).eq(xMemeInfo.appId);
        expect(await xMemeInfo.xMeme.feeNFT()).eq(await xMemeInfo.feeNFT.getAddress());
        expect(await xMemeInfo.xMeme.mortgageNFT()).eq(await xMemeInfo.mortgageNFT.getAddress());
        expect(await xMemeInfo.xMeme.market()).eq(await xMemeInfo.market.getAddress());

        expect(await xMemeInfo.xMeme.firstBuyFee()).eq(xMemeInfo.firstBuyFee);
        expect(await xMemeInfo.xMeme.fundRecipient()).eq(xMemeInfo.fundRecipientWallet.address);
        expect(await xMemeInfo.xMeme.signatureAddress()).eq(xMemeInfo.signatureWallet.address);
        expect(await xMemeInfo.xMeme.isSystemReady()).eq(false);
    });

    it("setSystemReady", async function () {
        const info = (await loadFixture(deployAllContracts));
        const xMemeInfo = info.xMemeAllContractInfo;

        expect(await xMemeInfo.xMeme.isSystemReady()).eq(false);

        expect(await xMemeInfo.xMeme.owner()).eq(xMemeInfo.deployWallet.address);

        let user = await xMemeInfo.wallets[xMemeInfo.nextWalletIndex + 1];

        await expect(xMemeInfo.xMeme.connect(user).setSystemReady(true)).to.be.revertedWithCustomError(xMemeInfo.xMeme, "OwnableUnauthorizedAccount");

        await xMemeInfo.xMeme.connect(xMemeInfo.deployWallet).setSystemReady(true);

        expect(await xMemeInfo.xMeme.isSystemReady()).eq(true);
    });

    it("setFirstBuyFee", async function () {
        const info = (await loadFixture(deployAllContracts));
        const xMemeInfo = info.xMemeAllContractInfo;

        expect(await xMemeInfo.xMeme.firstBuyFee()).eq(xMemeInfo.firstBuyFee);

        expect(await xMemeInfo.xMeme.owner()).eq(xMemeInfo.deployWallet.address);

        let user = await xMemeInfo.wallets[xMemeInfo.nextWalletIndex + 1];

        let newFirstBuyFee = xMemeInfo.firstBuyFee + BigInt(1);
        await expect(xMemeInfo.xMeme.connect(user).setFirstBuyFee(newFirstBuyFee)).to.be.revertedWithCustomError(xMemeInfo.xMeme, "OwnableUnauthorizedAccount");

        await xMemeInfo.xMeme.connect(xMemeInfo.deployWallet).setFirstBuyFee(newFirstBuyFee);

        expect(await xMemeInfo.xMeme.firstBuyFee()).eq(newFirstBuyFee);
    });

    it("setFundRecipient", async function () {
        const info = (await loadFixture(deployAllContracts));
        const xMemeInfo = info.xMemeAllContractInfo;

        expect(await xMemeInfo.xMeme.fundRecipient()).eq(xMemeInfo.fundRecipientWallet.address);

        expect(await xMemeInfo.xMeme.owner()).eq(xMemeInfo.deployWallet.address);

        let user = await xMemeInfo.wallets[xMemeInfo.nextWalletIndex + 1];

        let newFundRecipientWallet = await xMemeInfo.wallets[xMemeInfo.nextWalletIndex + 2];
        await expect(xMemeInfo.xMeme.connect(user).setFundRecipient(newFundRecipientWallet.address)).to.be.revertedWithCustomError(xMemeInfo.xMeme, "OwnableUnauthorizedAccount");

        await xMemeInfo.xMeme.connect(xMemeInfo.deployWallet).setFundRecipient(newFundRecipientWallet.address);

        expect(await xMemeInfo.xMeme.fundRecipient()).eq(newFundRecipientWallet.address);
    });

    it("setSignatureAddress", async function () {
        const info = (await loadFixture(deployAllContracts));
        const xMemeInfo = info.xMemeAllContractInfo;

        expect(await xMemeInfo.xMeme.signatureAddress()).eq(xMemeInfo.signatureWallet.address);

        expect(await xMemeInfo.xMeme.owner()).eq(xMemeInfo.deployWallet.address);

        let user = await xMemeInfo.wallets[xMemeInfo.nextWalletIndex + 1];

        let newSignatureAddress = await xMemeInfo.wallets[xMemeInfo.nextWalletIndex + 2];
        await expect(xMemeInfo.xMeme.connect(user).setSignatureAddress(newSignatureAddress.address)).to.be.revertedWithCustomError(xMemeInfo.xMeme, "OwnableUnauthorizedAccount");

        await xMemeInfo.xMeme.connect(xMemeInfo.deployWallet).setSignatureAddress(newSignatureAddress.address);

        expect(await xMemeInfo.xMeme.signatureAddress()).eq(newSignatureAddress.address);
    });

    it("collect", async function () {
        const info = (await loadFixture(deployAllContracts));
        const xMemeInfo = info.xMemeAllContractInfo;
        await xMemeInfo.xMeme.setSystemReady(true)

        expect(await xMemeInfo.xMeme.owner()).eq(xMemeInfo.deployWallet.address);

        let user = await xMemeInfo.wallets[xMemeInfo.nextWalletIndex + 1];

        await expect(xMemeInfo.xMeme.connect(user).collect(1)).to.be.revertedWithCustomError(xMemeInfo.xMeme, "OwnableUnauthorizedAccount");

        await expect(xMemeInfo.xMeme.connect(xMemeInfo.deployWallet).collect(1)).to.be.revertedWith("TEE");

        // multiply
        await xMemeInfo.xMeme.connect(xMemeInfo.deployWallet).createTokenAndMultiply("1", BigInt(10) ** BigInt(18), { value: BigInt(10) ** BigInt(20) });

        let value = await ethers.provider.getBalance(xMemeInfo.xMeme.getAddress())
        await expect(xMemeInfo.xMeme.connect(xMemeInfo.deployWallet).collect(value + BigInt(1))).to.be.revertedWith("TEE");

        await xMemeInfo.xMeme.connect(xMemeInfo.deployWallet).collect(value - BigInt(1))
        await xMemeInfo.xMeme.connect(xMemeInfo.deployWallet).collect(BigInt(1))
        expect(await ethers.provider.getBalance(xMemeInfo.xMeme.getAddress())).eq(BigInt(0))
    });
});

