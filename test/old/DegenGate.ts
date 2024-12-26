import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";

describe("DegenGate", function () {

    it("view", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        expect(await info.degenGate.foundry()).eq(await info.foundry.getAddress());
        expect(await info.degenGate.appId()).eq(await info.appId);

        expect(await info.degenGate.mortgageNFT()).eq(await info.mortgageNFT.getAddress());
        expect(await info.degenGate.market()).eq(await info.market.getAddress());
        expect(await info.degenGate.degen()).eq(await info.mockDegen.getAddress());
        expect(await info.degenGate.vault()).eq(await info.degenGateVault.getAddress());

        expect(await info.degenGate.nftClaim()).eq(await info.degenGateNFTClaim.getAddress());
        expect(await info.degenGate.fundRecipient()).eq(info.degenGateFundRecipientWallet.address);
        expect(await info.degenGate.signatureAddress()).eq(info.signatureWallet.address);

        expect(await info.degenGate.point()).eq(await info.point.getAddress());

        expect(await info.degenGate.owner()).eq(info.deployWallet.address);

    });

    it("setFundRecipient", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        expect(await info.degenGate.fundRecipient()).eq(info.degenGateFundRecipientWallet.address);

        expect(await info.degenGate.owner()).eq(info.deployWallet.address)
        await expect(
            info.degenGate.connect(info.userWallet).setFundRecipient(info.userWallet.address)
        ).revertedWithCustomError(info.degenGate, "OwnableUnauthorizedAccount")
        await info.degenGate.connect(info.deployWallet).setFundRecipient(info.userWallet.address)
        expect(await info.degenGate.fundRecipient()).eq(info.userWallet.address);
    })

    it("setSignatureAddress", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        expect(await info.degenGate.signatureAddress()).eq(info.signatureWallet.address);

        expect(await info.degenGate.owner()).eq(info.deployWallet.address)
        await expect(
            info.degenGate.connect(info.userWallet).setSignatureAddress(info.userWallet.address)
        ).revertedWithCustomError(info.degenGate, "OwnableUnauthorizedAccount")
        await info.degenGate.connect(info.deployWallet).setSignatureAddress(info.userWallet.address)
        expect(await info.degenGate.signatureAddress()).eq(info.userWallet.address);
    })
});

