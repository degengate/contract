import { ethers } from "hardhat";
import { deployAllContracts, ZERO_ADDRESS } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ZeroAddress } from "ethers";

describe("FoundryData", function () {
    it("deploy", async function () {
        const info = (await loadFixture(deployAllContracts));

        let foundryData = info.coreContractInfo.foundryData;

        expect(await foundryData.owner()).eq(await info.coreContractInfo.deployWallet.getAddress());
        expect(await foundryData.nextAppId()).eq(2);

        expect(await foundryData.foundryWhitelist(await info.coreContractInfo.foundry.getAddress())).eq(true);
    });

    it("updateFoundryWhitelist", async function () {
        const info = (await loadFixture(deployAllContracts));
        let foundryData = info.coreContractInfo.foundryData;

        let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex];
        let user2 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];

        let app2_name = "app2";
        let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2].address;
        let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3].address;
        let app2_curve = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4].address;
        let app2_feeNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5].address;
        let app2_mortgageNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6].address;
        let app2_market = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7].address;
        let app2_payToken = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 8].address;

        let app2_appOwnerBuyFee = 100;
        let app2_appOwnerSellFee = 200;
        let app2_appOwnerMortgageFee = 300;
        let app2_appOwnerFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 10].address;;
        let app2_nftOwnerBuyFee = 400;
        let app2_nftOwnerSellFee = 500;
        let app2_platformMortgageFee = 600;
        let app2_platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 11].address;

        await expect(
            foundryData.connect(user1).updateFoundryWhitelist(user2.address, true)
        ).revertedWithCustomError(foundryData, "OwnableUnauthorizedAccount");

        await expect(
            foundryData.createApp({
                name: app2_name,
                owner: app2_owner,
                operator: app2_operator,
                curve: app2_curve,
                feeNFT: app2_feeNFT,
                mortgageNFT: app2_mortgageNFT,
                market: app2_market,
                payToken: app2_payToken,
                foundry: user1.address,
            }, {
                appOwnerBuyFee: app2_appOwnerBuyFee,
                appOwnerSellFee: app2_appOwnerSellFee,
                appOwnerMortgageFee: app2_appOwnerMortgageFee,
                appOwnerFeeRecipient: app2_appOwnerFeeRecipient,
                nftOwnerBuyFee: app2_nftOwnerBuyFee,
                nftOwnerSellFee: app2_nftOwnerSellFee,
                platformMortgageFee: app2_platformMortgageFee,
                platformMortgageFeeRecipient: app2_platformMortgageFeeRecipient,
            })
        ).revertedWith("FWE");

        await foundryData.connect(info.xMemeAllContractInfo.deployWallet).updateFoundryWhitelist(user1.address, true)
        expect(await foundryData.foundryWhitelist(user1.address)).eq(true);

        await foundryData.connect(user1).createApp({
            name: app2_name,
            owner: app2_owner,
            operator: app2_operator,
            curve: app2_curve,
            feeNFT: app2_feeNFT,
            mortgageNFT: app2_mortgageNFT,
            market: app2_market,
            payToken: app2_payToken,
            foundry: user1.address,
        }, {
            appOwnerBuyFee: app2_appOwnerBuyFee,
            appOwnerSellFee: app2_appOwnerSellFee,
            appOwnerMortgageFee: app2_appOwnerMortgageFee,
            appOwnerFeeRecipient: app2_appOwnerFeeRecipient,
            nftOwnerBuyFee: app2_nftOwnerBuyFee,
            nftOwnerSellFee: app2_nftOwnerSellFee,
            platformMortgageFee: app2_platformMortgageFee,
            platformMortgageFeeRecipient: app2_platformMortgageFeeRecipient,
        });

        expect(await foundryData.nextAppId()).eq(3);
    });

    it("createApp", async function () {
        const info = (await loadFixture(deployAllContracts));
        let foundryData = info.coreContractInfo.foundryData;

        let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex];
        let user2 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];

        let app2_name = "app2";
        let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2].address;
        let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3].address;
        let app2_curve = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4].address;
        let app2_feeNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5].address;
        let app2_mortgageNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6].address;
        let app2_market = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7].address;
        let app2_payToken = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 8].address;

        let app2_appOwnerBuyFee = 100;
        let app2_appOwnerSellFee = 200;
        let app2_appOwnerMortgageFee = 300;
        let app2_appOwnerFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 10].address;;
        let app2_nftOwnerBuyFee = 400;
        let app2_nftOwnerSellFee = 500;
        let app2_platformMortgageFee = 600;
        let app2_platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 11].address;

        await expect(
            foundryData.createApp({
                name: app2_name,
                owner: app2_owner,
                operator: app2_operator,
                curve: app2_curve,
                feeNFT: app2_feeNFT,
                mortgageNFT: app2_mortgageNFT,
                market: app2_market,
                payToken: app2_payToken,
                foundry: user1.address,
            }, {
                appOwnerBuyFee: app2_appOwnerBuyFee,
                appOwnerSellFee: app2_appOwnerSellFee,
                appOwnerMortgageFee: app2_appOwnerMortgageFee,
                appOwnerFeeRecipient: app2_appOwnerFeeRecipient,
                nftOwnerBuyFee: app2_nftOwnerBuyFee,
                nftOwnerSellFee: app2_nftOwnerSellFee,
                platformMortgageFee: app2_platformMortgageFee,
                platformMortgageFeeRecipient: app2_platformMortgageFeeRecipient,
            })
        ).revertedWith("FWE");

        await foundryData.connect(info.xMemeAllContractInfo.deployWallet).updateFoundryWhitelist(user1.address, true)
        expect(await foundryData.foundryWhitelist(user1.address)).eq(true);

        await expect(
            foundryData.connect(user1).createApp({
                name: app2_name,
                owner: app2_owner,
                operator: app2_operator,
                curve: app2_curve,
                feeNFT: app2_feeNFT,
                mortgageNFT: app2_mortgageNFT,
                market: app2_market,
                payToken: app2_payToken,
                foundry: user2.address,
            }, {
                appOwnerBuyFee: app2_appOwnerBuyFee,
                appOwnerSellFee: app2_appOwnerSellFee,
                appOwnerMortgageFee: app2_appOwnerMortgageFee,
                appOwnerFeeRecipient: app2_appOwnerFeeRecipient,
                nftOwnerBuyFee: app2_nftOwnerBuyFee,
                nftOwnerSellFee: app2_nftOwnerSellFee,
                platformMortgageFee: app2_platformMortgageFee,
                platformMortgageFeeRecipient: app2_platformMortgageFeeRecipient,
            })).rejectedWith("FE");

        await foundryData.connect(user1).createApp({
            name: app2_name,
            owner: app2_owner,
            operator: app2_operator,
            curve: app2_curve,
            feeNFT: app2_feeNFT,
            mortgageNFT: app2_mortgageNFT,
            market: app2_market,
            payToken: app2_payToken,
            foundry: user1.address,
        }, {
            appOwnerBuyFee: app2_appOwnerBuyFee,
            appOwnerSellFee: app2_appOwnerSellFee,
            appOwnerMortgageFee: app2_appOwnerMortgageFee,
            appOwnerFeeRecipient: app2_appOwnerFeeRecipient,
            nftOwnerBuyFee: app2_nftOwnerBuyFee,
            nftOwnerSellFee: app2_nftOwnerSellFee,
            platformMortgageFee: app2_platformMortgageFee,
            platformMortgageFeeRecipient: app2_platformMortgageFeeRecipient,
        });

        let app2 = await foundryData.apps(2);
        expect(app2.name).eq(app2_name);
        expect(app2.owner).eq(app2_owner);
        expect(app2.operator).eq(app2_operator);
        expect(app2.curve).eq(app2_curve);
        expect(app2.feeNFT).eq(app2_feeNFT);
        expect(app2.mortgageNFT).eq(app2_mortgageNFT);
        expect(app2.market).eq(app2_market);
        expect(app2.payToken).eq(app2_payToken);
        expect(app2.foundry).eq(user1.address);

        let app2Fee = await foundryData.appFees(2);
        expect(app2Fee.appOwnerBuyFee).eq(app2_appOwnerBuyFee);
        expect(app2Fee.appOwnerSellFee).eq(app2_appOwnerSellFee);
        expect(app2Fee.appOwnerMortgageFee).eq(app2_appOwnerMortgageFee);
        expect(app2Fee.appOwnerFeeRecipient).eq(app2_appOwnerFeeRecipient);
        expect(app2Fee.nftOwnerBuyFee).eq(app2_nftOwnerBuyFee);
        expect(app2Fee.nftOwnerSellFee).eq(app2_nftOwnerSellFee);
        expect(app2Fee.platformMortgageFee).eq(app2_platformMortgageFee);
        expect(app2Fee.platformMortgageFeeRecipient).eq(app2_platformMortgageFeeRecipient);

        let app1 = await foundryData.apps(1);
        expect(app1.name).eq(info.xMemeAllContractInfo.appName);
        expect(app1.owner).eq(info.xMemeAllContractInfo.appOwnerWallet.address);
        expect(app1.operator).eq(await info.xMemeAllContractInfo.xMeme.getAddress());
        expect(app1.curve).eq(await info.xMemeAllContractInfo.curve.getAddress());
        expect(app1.feeNFT).eq(await info.xMemeAllContractInfo.feeNFT.getAddress());
        expect(app1.mortgageNFT).eq(await info.xMemeAllContractInfo.mortgageNFT.getAddress());
        expect(app1.market).eq(await info.xMemeAllContractInfo.market.getAddress());
        expect(app1.payToken).eq(ZeroAddress);
        expect(app1.foundry).eq(await info.coreContractInfo.foundry.getAddress());

        let app1Fee = await foundryData.appFees(1);
        expect(app1Fee.appOwnerBuyFee).eq(info.xMemeAllContractInfo.appOwnerBuyFee);
        expect(app1Fee.appOwnerSellFee).eq(info.xMemeAllContractInfo.appOwnerSellFee);
        expect(app1Fee.appOwnerMortgageFee).eq(info.xMemeAllContractInfo.appOwnerMortgageFee);
        expect(app1Fee.appOwnerFeeRecipient).eq(info.xMemeAllContractInfo.appOwnerFeeWallet.address);
        expect(app1Fee.nftOwnerBuyFee).eq(info.xMemeAllContractInfo.feeNftBuyFee);
        expect(app1Fee.nftOwnerSellFee).eq(info.xMemeAllContractInfo.feeNftSellFee);
        expect(app1Fee.platformMortgageFee).eq(info.xMemeAllContractInfo.platformMortgageFee);
        expect(app1Fee.platformMortgageFeeRecipient).eq(info.xMemeAllContractInfo.platformMortgageFeeWallet.address);

        expect(await foundryData.appExist(0)).eq(false);
        expect(await foundryData.appExist(1)).eq(true);
        expect(await foundryData.appExist(2)).eq(true);
        expect(await foundryData.appExist(3)).eq(false);
    });

    it("setAppOperator", async function () {
        const info = (await loadFixture(deployAllContracts));
        let foundryData = info.coreContractInfo.foundryData;

        let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex];
        let user2 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];

        await foundryData.connect(info.xMemeAllContractInfo.deployWallet).updateFoundryWhitelist(user1.address, true)
        expect(await foundryData.foundryWhitelist(user1.address)).eq(true);

        let app2_name = "app2";
        let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2].address;
        let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3].address;
        let app2_curve = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4].address;
        let app2_feeNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5].address;
        let app2_mortgageNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6].address;
        let app2_market = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7].address;
        let app2_payToken = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 8].address;

        let app2_appOwnerBuyFee = 100;
        let app2_appOwnerSellFee = 200;
        let app2_appOwnerMortgageFee = 300;
        let app2_appOwnerFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 10].address;;
        let app2_nftOwnerBuyFee = 400;
        let app2_nftOwnerSellFee = 500;
        let app2_platformMortgageFee = 600;
        let app2_platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 11].address;

        await foundryData.connect(user1).createApp({
            name: app2_name,
            owner: app2_owner,
            operator: app2_operator,
            curve: app2_curve,
            feeNFT: app2_feeNFT,
            mortgageNFT: app2_mortgageNFT,
            market: app2_market,
            payToken: app2_payToken,
            foundry: user1.address,
        }, {
            appOwnerBuyFee: app2_appOwnerBuyFee,
            appOwnerSellFee: app2_appOwnerSellFee,
            appOwnerMortgageFee: app2_appOwnerMortgageFee,
            appOwnerFeeRecipient: app2_appOwnerFeeRecipient,
            nftOwnerBuyFee: app2_nftOwnerBuyFee,
            nftOwnerSellFee: app2_nftOwnerSellFee,
            platformMortgageFee: app2_platformMortgageFee,
            platformMortgageFeeRecipient: app2_platformMortgageFeeRecipient,
        });

        let app2 = await foundryData.apps(2);
        expect(app2.name).eq(app2_name);
        expect(app2.owner).eq(app2_owner);
        expect(app2.operator).eq(app2_operator);
        expect(app2.curve).eq(app2_curve);
        expect(app2.feeNFT).eq(app2_feeNFT);
        expect(app2.mortgageNFT).eq(app2_mortgageNFT);
        expect(app2.market).eq(app2_market);
        expect(app2.payToken).eq(app2_payToken);
        expect(app2.foundry).eq(user1.address);

        let app2Fee = await foundryData.appFees(2);
        expect(app2Fee.appOwnerBuyFee).eq(app2_appOwnerBuyFee);
        expect(app2Fee.appOwnerSellFee).eq(app2_appOwnerSellFee);
        expect(app2Fee.appOwnerMortgageFee).eq(app2_appOwnerMortgageFee);
        expect(app2Fee.appOwnerFeeRecipient).eq(app2_appOwnerFeeRecipient);
        expect(app2Fee.nftOwnerBuyFee).eq(app2_nftOwnerBuyFee);
        expect(app2Fee.nftOwnerSellFee).eq(app2_nftOwnerSellFee);
        expect(app2Fee.platformMortgageFee).eq(app2_platformMortgageFee);
        expect(app2Fee.platformMortgageFeeRecipient).eq(app2_platformMortgageFeeRecipient);

        let app1 = await foundryData.apps(1);
        expect(app1.name).eq(info.xMemeAllContractInfo.appName);
        expect(app1.owner).eq(info.xMemeAllContractInfo.appOwnerWallet.address);
        expect(app1.operator).eq(await info.xMemeAllContractInfo.xMeme.getAddress());
        expect(app1.curve).eq(await info.xMemeAllContractInfo.curve.getAddress());
        expect(app1.feeNFT).eq(await info.xMemeAllContractInfo.feeNFT.getAddress());
        expect(app1.mortgageNFT).eq(await info.xMemeAllContractInfo.mortgageNFT.getAddress());
        expect(app1.market).eq(await info.xMemeAllContractInfo.market.getAddress());
        expect(app1.payToken).eq(ZeroAddress);
        expect(app1.foundry).eq(await info.coreContractInfo.foundry.getAddress());

        let app1Fee = await foundryData.appFees(1);
        expect(app1Fee.appOwnerBuyFee).eq(info.xMemeAllContractInfo.appOwnerBuyFee);
        expect(app1Fee.appOwnerSellFee).eq(info.xMemeAllContractInfo.appOwnerSellFee);
        expect(app1Fee.appOwnerMortgageFee).eq(info.xMemeAllContractInfo.appOwnerMortgageFee);
        expect(app1Fee.appOwnerFeeRecipient).eq(info.xMemeAllContractInfo.appOwnerFeeWallet.address);
        expect(app1Fee.nftOwnerBuyFee).eq(info.xMemeAllContractInfo.feeNftBuyFee);
        expect(app1Fee.nftOwnerSellFee).eq(info.xMemeAllContractInfo.feeNftSellFee);
        expect(app1Fee.platformMortgageFee).eq(info.xMemeAllContractInfo.platformMortgageFee);
        expect(app1Fee.platformMortgageFeeRecipient).eq(info.xMemeAllContractInfo.platformMortgageFeeWallet.address);

        await foundryData.connect(user1).setAppOperator(2, user2.address);
        app2 = await foundryData.apps(2);
        expect(app2.operator).eq(user2.address);

        await expect(foundryData.connect(user1).setAppOperator(1, user2.address)).revertedWith("FE");

    });

    it("setAppOwner", async function () {
        const info = (await loadFixture(deployAllContracts));
        let foundryData = info.coreContractInfo.foundryData;

        let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex];
        let user2 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];

        await foundryData.connect(info.xMemeAllContractInfo.deployWallet).updateFoundryWhitelist(user1.address, true)
        expect(await foundryData.foundryWhitelist(user1.address)).eq(true);

        let app2_name = "app2";
        let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2].address;
        let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3].address;
        let app2_curve = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4].address;
        let app2_feeNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5].address;
        let app2_mortgageNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6].address;
        let app2_market = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7].address;
        let app2_payToken = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 8].address;

        let app2_appOwnerBuyFee = 100;
        let app2_appOwnerSellFee = 200;
        let app2_appOwnerMortgageFee = 300;
        let app2_appOwnerFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 10].address;;
        let app2_nftOwnerBuyFee = 400;
        let app2_nftOwnerSellFee = 500;
        let app2_platformMortgageFee = 600;
        let app2_platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 11].address;

        await foundryData.connect(user1).createApp({
            name: app2_name,
            owner: app2_owner,
            operator: app2_operator,
            curve: app2_curve,
            feeNFT: app2_feeNFT,
            mortgageNFT: app2_mortgageNFT,
            market: app2_market,
            payToken: app2_payToken,
            foundry: user1.address,
        }, {
            appOwnerBuyFee: app2_appOwnerBuyFee,
            appOwnerSellFee: app2_appOwnerSellFee,
            appOwnerMortgageFee: app2_appOwnerMortgageFee,
            appOwnerFeeRecipient: app2_appOwnerFeeRecipient,
            nftOwnerBuyFee: app2_nftOwnerBuyFee,
            nftOwnerSellFee: app2_nftOwnerSellFee,
            platformMortgageFee: app2_platformMortgageFee,
            platformMortgageFeeRecipient: app2_platformMortgageFeeRecipient,
        });

        let app2 = await foundryData.apps(2);
        expect(app2.name).eq(app2_name);
        expect(app2.owner).eq(app2_owner);
        expect(app2.operator).eq(app2_operator);
        expect(app2.curve).eq(app2_curve);
        expect(app2.feeNFT).eq(app2_feeNFT);
        expect(app2.mortgageNFT).eq(app2_mortgageNFT);
        expect(app2.market).eq(app2_market);
        expect(app2.payToken).eq(app2_payToken);
        expect(app2.foundry).eq(user1.address);

        let app2Fee = await foundryData.appFees(2);
        expect(app2Fee.appOwnerBuyFee).eq(app2_appOwnerBuyFee);
        expect(app2Fee.appOwnerSellFee).eq(app2_appOwnerSellFee);
        expect(app2Fee.appOwnerMortgageFee).eq(app2_appOwnerMortgageFee);
        expect(app2Fee.appOwnerFeeRecipient).eq(app2_appOwnerFeeRecipient);
        expect(app2Fee.nftOwnerBuyFee).eq(app2_nftOwnerBuyFee);
        expect(app2Fee.nftOwnerSellFee).eq(app2_nftOwnerSellFee);
        expect(app2Fee.platformMortgageFee).eq(app2_platformMortgageFee);
        expect(app2Fee.platformMortgageFeeRecipient).eq(app2_platformMortgageFeeRecipient);

        let app1 = await foundryData.apps(1);
        expect(app1.name).eq(info.xMemeAllContractInfo.appName);
        expect(app1.owner).eq(info.xMemeAllContractInfo.appOwnerWallet.address);
        expect(app1.operator).eq(await info.xMemeAllContractInfo.xMeme.getAddress());
        expect(app1.curve).eq(await info.xMemeAllContractInfo.curve.getAddress());
        expect(app1.feeNFT).eq(await info.xMemeAllContractInfo.feeNFT.getAddress());
        expect(app1.mortgageNFT).eq(await info.xMemeAllContractInfo.mortgageNFT.getAddress());
        expect(app1.market).eq(await info.xMemeAllContractInfo.market.getAddress());
        expect(app1.payToken).eq(ZeroAddress);
        expect(app1.foundry).eq(await info.coreContractInfo.foundry.getAddress());

        let app1Fee = await foundryData.appFees(1);
        expect(app1Fee.appOwnerBuyFee).eq(info.xMemeAllContractInfo.appOwnerBuyFee);
        expect(app1Fee.appOwnerSellFee).eq(info.xMemeAllContractInfo.appOwnerSellFee);
        expect(app1Fee.appOwnerMortgageFee).eq(info.xMemeAllContractInfo.appOwnerMortgageFee);
        expect(app1Fee.appOwnerFeeRecipient).eq(info.xMemeAllContractInfo.appOwnerFeeWallet.address);
        expect(app1Fee.nftOwnerBuyFee).eq(info.xMemeAllContractInfo.feeNftBuyFee);
        expect(app1Fee.nftOwnerSellFee).eq(info.xMemeAllContractInfo.feeNftSellFee);
        expect(app1Fee.platformMortgageFee).eq(info.xMemeAllContractInfo.platformMortgageFee);
        expect(app1Fee.platformMortgageFeeRecipient).eq(info.xMemeAllContractInfo.platformMortgageFeeWallet.address);

        await foundryData.connect(user1).setAppOwner(2, user2.address);
        app2 = await foundryData.apps(2);
        expect(app2.owner).eq(user2.address);

        await expect(foundryData.connect(user1).setAppOwner(1, user2.address)).revertedWith("FE");

    });

    it("updateAppFee", async function () {
        const info = (await loadFixture(deployAllContracts));
        let foundryData = info.coreContractInfo.foundryData;

        let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex];
        let user2 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 1];

        await foundryData.connect(info.xMemeAllContractInfo.deployWallet).updateFoundryWhitelist(user1.address, true)
        expect(await foundryData.foundryWhitelist(user1.address)).eq(true);

        let app2_name = "app2";
        let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2].address;
        let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3].address;
        let app2_curve = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4].address;
        let app2_feeNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5].address;
        let app2_mortgageNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6].address;
        let app2_market = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7].address;
        let app2_payToken = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 8].address;

        let app2_appOwnerBuyFee = 100;
        let app2_appOwnerSellFee = 200;
        let app2_appOwnerMortgageFee = 300;
        let app2_appOwnerFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 10].address;;
        let app2_nftOwnerBuyFee = 400;
        let app2_nftOwnerSellFee = 500;
        let app2_platformMortgageFee = 600;
        let app2_platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 11].address;

        await foundryData.connect(user1).createApp({
            name: app2_name,
            owner: app2_owner,
            operator: app2_operator,
            curve: app2_curve,
            feeNFT: app2_feeNFT,
            mortgageNFT: app2_mortgageNFT,
            market: app2_market,
            payToken: app2_payToken,
            foundry: user1.address,
        }, {
            appOwnerBuyFee: app2_appOwnerBuyFee,
            appOwnerSellFee: app2_appOwnerSellFee,
            appOwnerMortgageFee: app2_appOwnerMortgageFee,
            appOwnerFeeRecipient: app2_appOwnerFeeRecipient,
            nftOwnerBuyFee: app2_nftOwnerBuyFee,
            nftOwnerSellFee: app2_nftOwnerSellFee,
            platformMortgageFee: app2_platformMortgageFee,
            platformMortgageFeeRecipient: app2_platformMortgageFeeRecipient,
        });

        let app2 = await foundryData.apps(2);
        expect(app2.name).eq(app2_name);
        expect(app2.owner).eq(app2_owner);
        expect(app2.operator).eq(app2_operator);
        expect(app2.curve).eq(app2_curve);
        expect(app2.feeNFT).eq(app2_feeNFT);
        expect(app2.mortgageNFT).eq(app2_mortgageNFT);
        expect(app2.market).eq(app2_market);
        expect(app2.payToken).eq(app2_payToken);
        expect(app2.foundry).eq(user1.address);

        let app2Fee = await foundryData.appFees(2);
        expect(app2Fee.appOwnerBuyFee).eq(app2_appOwnerBuyFee);
        expect(app2Fee.appOwnerSellFee).eq(app2_appOwnerSellFee);
        expect(app2Fee.appOwnerMortgageFee).eq(app2_appOwnerMortgageFee);
        expect(app2Fee.appOwnerFeeRecipient).eq(app2_appOwnerFeeRecipient);
        expect(app2Fee.nftOwnerBuyFee).eq(app2_nftOwnerBuyFee);
        expect(app2Fee.nftOwnerSellFee).eq(app2_nftOwnerSellFee);
        expect(app2Fee.platformMortgageFee).eq(app2_platformMortgageFee);
        expect(app2Fee.platformMortgageFeeRecipient).eq(app2_platformMortgageFeeRecipient);

        let app1 = await foundryData.apps(1);
        expect(app1.name).eq(info.xMemeAllContractInfo.appName);
        expect(app1.owner).eq(info.xMemeAllContractInfo.appOwnerWallet.address);
        expect(app1.operator).eq(await info.xMemeAllContractInfo.xMeme.getAddress());
        expect(app1.curve).eq(await info.xMemeAllContractInfo.curve.getAddress());
        expect(app1.feeNFT).eq(await info.xMemeAllContractInfo.feeNFT.getAddress());
        expect(app1.mortgageNFT).eq(await info.xMemeAllContractInfo.mortgageNFT.getAddress());
        expect(app1.market).eq(await info.xMemeAllContractInfo.market.getAddress());
        expect(app1.payToken).eq(ZeroAddress);
        expect(app1.foundry).eq(await info.coreContractInfo.foundry.getAddress());

        let app1Fee = await foundryData.appFees(1);
        expect(app1Fee.appOwnerBuyFee).eq(info.xMemeAllContractInfo.appOwnerBuyFee);
        expect(app1Fee.appOwnerSellFee).eq(info.xMemeAllContractInfo.appOwnerSellFee);
        expect(app1Fee.appOwnerMortgageFee).eq(info.xMemeAllContractInfo.appOwnerMortgageFee);
        expect(app1Fee.appOwnerFeeRecipient).eq(info.xMemeAllContractInfo.appOwnerFeeWallet.address);
        expect(app1Fee.nftOwnerBuyFee).eq(info.xMemeAllContractInfo.feeNftBuyFee);
        expect(app1Fee.nftOwnerSellFee).eq(info.xMemeAllContractInfo.feeNftSellFee);
        expect(app1Fee.platformMortgageFee).eq(info.xMemeAllContractInfo.platformMortgageFee);
        expect(app1Fee.platformMortgageFeeRecipient).eq(info.xMemeAllContractInfo.platformMortgageFeeWallet.address);

        await foundryData.connect(user1).updateAppFee(2, {
            appOwnerBuyFee: app2_appOwnerBuyFee + 1,
            appOwnerSellFee: app2_appOwnerSellFee + 1,
            appOwnerMortgageFee: app2_appOwnerMortgageFee + 1,
            appOwnerFeeRecipient: app2_appOwnerFeeRecipient,
            nftOwnerBuyFee: app2_nftOwnerBuyFee + 1,
            nftOwnerSellFee: app2_nftOwnerSellFee + 1,
            platformMortgageFee: app2_platformMortgageFee + 1,
            platformMortgageFeeRecipient: app2_platformMortgageFeeRecipient,
        });
        app2Fee = await foundryData.appFees(2);
        expect(app2Fee.appOwnerBuyFee).eq(app2_appOwnerBuyFee + 1);
        expect(app2Fee.appOwnerSellFee).eq(app2_appOwnerSellFee + 1);
        expect(app2Fee.appOwnerMortgageFee).eq(app2_appOwnerMortgageFee + 1);
        expect(app2Fee.appOwnerFeeRecipient).eq(app2_appOwnerFeeRecipient);
        expect(app2Fee.nftOwnerBuyFee).eq(app2_nftOwnerBuyFee + 1);
        expect(app2Fee.nftOwnerSellFee).eq(app2_nftOwnerSellFee + 1);
        expect(app2Fee.platformMortgageFee).eq(app2_platformMortgageFee + 1);
        expect(app2Fee.platformMortgageFeeRecipient).eq(app2_platformMortgageFeeRecipient);

        await expect(foundryData.connect(user1).updateAppFee(1, {
            appOwnerBuyFee: app2_appOwnerBuyFee,
            appOwnerSellFee: app2_appOwnerSellFee,
            appOwnerMortgageFee: app2_appOwnerMortgageFee,
            appOwnerFeeRecipient: app2_appOwnerFeeRecipient,
            nftOwnerBuyFee: app2_nftOwnerBuyFee,
            nftOwnerSellFee: app2_nftOwnerSellFee,
            platformMortgageFee: app2_platformMortgageFee,
            platformMortgageFeeRecipient: app2_platformMortgageFeeRecipient,
        })).revertedWith("FE");

    });
});
