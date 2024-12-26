import { DegenGateAllContractInfo } from "./shared/deploy_degen_gate";
import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";

import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { ethers } from "hardhat";


describe("DegenGate.vaultManagers", function () {
    it("change vaultManagers by owner", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        const user = info.userWallet.getAddress()

        expect(await info.degenGate.singleBoxMintPointLimit()).eq(0)
        expect(await info.degenGate.oneDayBoxMintPointLimit()).eq(0)
        expect(await info.degenGate.vaultManagers(user)).eq(false)

        await expect(
            info.degenGate.connect(info.userWallet).setSingleBoxMintPointLimit(1)
        ).revertedWithCustomError(info.degenGate, "OwnableUnauthorizedAccount")

        await expect(
            info.degenGate.connect(info.userWallet).setOneDayBoxMintPointLimit(1)
        ).revertedWithCustomError(info.degenGate, "OwnableUnauthorizedAccount")

        await expect(
            info.degenGate.connect(info.userWallet).setVaultManager(user, true)
        ).revertedWithCustomError(info.degenGate, "OwnableUnauthorizedAccount")

        expect(await info.degenGate.owner()).eq(info.deployWallet.address)

        await info.degenGate.connect(info.deployWallet).setSingleBoxMintPointLimit(1)
        await info.degenGate.connect(info.deployWallet).setOneDayBoxMintPointLimit(24)
        await info.degenGate.connect(info.deployWallet).setVaultManager(user, true)

        expect(await info.degenGate.singleBoxMintPointLimit()).eq(1)
        expect(await info.degenGate.oneDayBoxMintPointLimit()).eq(24)
        expect(await info.degenGate.vaultManagers(user)).eq(true)

        await info.degenGate.connect(info.deployWallet).setSingleBoxMintPointLimit(20)
        await info.degenGate.connect(info.deployWallet).setOneDayBoxMintPointLimit(200)
        await info.degenGate.connect(info.deployWallet).setVaultManager(user, false)

        expect(await info.degenGate.singleBoxMintPointLimit()).eq(20)
        expect(await info.degenGate.oneDayBoxMintPointLimit()).eq(200)
        expect(await info.degenGate.vaultManagers(user)).eq(false)
    });

    it("boxMintPoint have limit", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        expect(await info.degenGate.owner()).eq(info.deployWallet.address)

        await info.degenGate.connect(info.deployWallet).setSingleBoxMintPointLimit(1000)
        await info.degenGate.connect(info.deployWallet).setOneDayBoxMintPointLimit(24000)
        await info.degenGate.connect(info.deployWallet).setVaultManager(info.deployWallet.getAddress(), true)

        expect(await info.degenGate.singleBoxMintPointLimit()).eq(1000)
        expect(await info.degenGate.oneDayBoxMintPointLimit()).eq(24000)
        expect(await info.degenGate.vaultManagers(info.deployWallet.getAddress())).eq(true)
        expect(await info.degenGate.vaultManagers(info.userWallet.getAddress())).eq(false)

        await expect(
            info.degenGate.connect(info.userWallet).boxMintPoint(info.userWallet.getAddress(), 1)
        ).revertedWith("SE")

        await expect(
            info.degenGate.connect(info.deployWallet).boxMintPoint(info.userWallet.getAddress(), 1001)
        ).revertedWith("SBMPLE")

        expect(await info.point.totalSupply()).eq(0)
        expect(await info.point.balanceOf(info.deployWallet.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.userWallet.getAddress())).eq(0)

        await info.degenGate.connect(info.deployWallet).boxMintPoint(info.userWallet.getAddress(), 1000)

        expect(await info.point.totalSupply()).eq(1000)
        expect(await info.point.balanceOf(info.deployWallet.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.userWallet.getAddress())).eq(1000)

        for (let i = 0; i < 23; i++) {
            await info.degenGate.connect(info.deployWallet).boxMintPoint(info.userWallet.getAddress(), 1000)
        }

        expect(await info.point.totalSupply()).eq(24000)
        expect(await info.point.balanceOf(info.deployWallet.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.userWallet.getAddress())).eq(24000)

        await expect(
            info.degenGate.connect(info.deployWallet).boxMintPoint(info.userWallet.getAddress(), 1)
        ).revertedWith("DBMPLE")
    });

    it("boxMintPoint no limit", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        expect(await info.degenGate.owner()).eq(info.deployWallet.address)

        await info.degenGate.connect(info.deployWallet).setVaultManager(info.deployWallet.getAddress(), true)

        expect(await info.degenGate.singleBoxMintPointLimit()).eq(0)
        expect(await info.degenGate.oneDayBoxMintPointLimit()).eq(0)
        expect(await info.degenGate.vaultManagers(info.deployWallet.getAddress())).eq(true)
        expect(await info.degenGate.vaultManagers(info.userWallet.getAddress())).eq(false)

        await expect(
            info.degenGate.connect(info.userWallet).boxMintPoint(info.userWallet.getAddress(), 1)
        ).revertedWith("SE")

        expect(await info.point.totalSupply()).eq(0)
        expect(await info.point.balanceOf(info.deployWallet.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.userWallet.getAddress())).eq(0)

        await info.degenGate.connect(info.deployWallet).boxMintPoint(info.userWallet.getAddress(), 10000)

        expect(await info.point.totalSupply()).eq(10000)
        expect(await info.point.balanceOf(info.deployWallet.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.userWallet.getAddress())).eq(10000)

        await info.degenGate.connect(info.deployWallet).setVaultManager(info.deployWallet.getAddress(), false)
        expect(await info.degenGate.vaultManagers(info.deployWallet.getAddress())).eq(false)

        await expect(
            info.degenGate.connect(info.deployWallet).boxMintPoint(info.userWallet.getAddress(), 1)
        ).revertedWith("SE")
    });

    it("pointToDegen", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;
        await info.degenGateVault.connect(info.deployWallet).addApproveDegen();

        let degenGateVaultInitDegen = BigInt(10) ** BigInt(18) * BigInt(10000)
        await info.mockDegen.connect(info.deployWallet).transfer(info.degenGateVault.getAddress(), degenGateVaultInitDegen)

        await info.degenGate.connect(info.deployWallet).setVaultManager(info.deployWallet.getAddress(), true)

        expect(await info.point.totalSupply()).eq(0)
        expect(await info.point.balanceOf(info.deployWallet.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.degenGate.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.userWallet.getAddress())).eq(0)

        await info.degenGate.connect(info.deployWallet).boxMintPoint(info.userWallet.getAddress(), 24000)

        expect(await info.point.totalSupply()).eq(24000)
        expect(await info.point.balanceOf(info.deployWallet.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.degenGate.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.userWallet.getAddress())).eq(24000)
        expect(await info.point.balanceOf(info.degenGateVault.getAddress())).eq(0)

        let degenTotalSupply = await info.mockDegen.totalSupply()
        expect(await info.mockDegen.balanceOf(info.degenGateVault.getAddress())).eq(degenGateVaultInitDegen)
        expect(await info.mockDegen.balanceOf(info.deployWallet.getAddress())).eq(degenTotalSupply - degenGateVaultInitDegen)
        expect(await info.mockDegen.balanceOf(info.degenGate.getAddress())).eq(0)
        expect(await info.mockDegen.balanceOf(info.userWallet.getAddress())).eq(0)

        await expect(info.degenGate.connect(info.userWallet).pointToDegen(10000)).revertedWithCustomError(info.point, "ERC20InsufficientAllowance")

        await info.point.connect(info.userWallet).approve(info.degenGate.getAddress(), 10000)

        await info.degenGate.connect(info.userWallet).pointToDegen(10000)

        expect(await info.point.totalSupply()).eq(24000 - 10000)
        expect(await info.point.balanceOf(info.deployWallet.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.degenGate.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.userWallet.getAddress())).eq(24000 - 10000)
        expect(await info.point.balanceOf(info.degenGateVault.getAddress())).eq(0)


        expect(await info.mockDegen.balanceOf(info.deployWallet.getAddress())).eq(degenTotalSupply - degenGateVaultInitDegen)
        expect(await info.mockDegen.balanceOf(info.degenGate.getAddress())).eq(0)
        expect(await info.mockDegen.balanceOf(info.userWallet.getAddress())).eq(0 + 10000)
        expect(await info.mockDegen.balanceOf(info.degenGateVault.getAddress())).eq(degenGateVaultInitDegen - BigInt(10000))

    });

    it("degenToPoint", async function () {
        const info = (await loadFixture(deployAllContracts)).degenGateInfo;

        await info.mockDegen.connect(info.deployWallet).transfer(info.userWallet.getAddress(), 24000)

        await info.degenGate.connect(info.deployWallet).setVaultManager(info.deployWallet.getAddress(), true)

        expect(await info.point.totalSupply()).eq(0)
        expect(await info.point.balanceOf(info.deployWallet.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.degenGate.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.userWallet.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.degenGateVault.getAddress())).eq(0)

        let degenTotalSupply = await info.mockDegen.totalSupply()
        expect(await info.mockDegen.balanceOf(info.deployWallet.getAddress())).eq(degenTotalSupply - BigInt(24000))
        expect(await info.mockDegen.balanceOf(info.degenGate.getAddress())).eq(0)
        expect(await info.mockDegen.balanceOf(info.userWallet.getAddress())).eq(24000)
        expect(await info.mockDegen.balanceOf(info.degenGateVault.getAddress())).eq(0)

        await expect(info.degenGate.connect(info.userWallet).degenToPoint(10000)).revertedWithCustomError(info.mockDegen, "ERC20InsufficientAllowance")

        await info.mockDegen.connect(info.userWallet).approve(info.degenGate.getAddress(), 10000)

        await info.degenGate.connect(info.userWallet).degenToPoint(10000)

        expect(await info.point.totalSupply()).eq(0 + 10000)
        expect(await info.point.balanceOf(info.deployWallet.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.degenGate.getAddress())).eq(0)
        expect(await info.point.balanceOf(info.userWallet.getAddress())).eq(0 + 10000)
        expect(await info.point.balanceOf(info.degenGateVault.getAddress())).eq(0)


        expect(await info.mockDegen.balanceOf(info.deployWallet.getAddress())).eq(degenTotalSupply - BigInt(24000))
        expect(await info.mockDegen.balanceOf(info.degenGate.getAddress())).eq(0)
        expect(await info.mockDegen.balanceOf(info.userWallet.getAddress())).eq(24000 - 10000)
        expect(await info.mockDegen.balanceOf(info.degenGateVault.getAddress())).eq(0 + 10000)

    });
});
