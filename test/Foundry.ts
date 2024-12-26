import { deployAllContracts, ZERO_ADDRESS } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { ZeroAddress } from "ethers";
import { FeeNFT, SimpleToken } from "../typechain-types";

describe("Foundry", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts));
    let foundry = info.coreContractInfo.foundry;

    expect(await foundry.FEE_DENOMINATOR()).eq(100000);
    expect(await foundry.TOTAL_PERCENT()).eq(100000);

    expect(await foundry.foundryData()).eq(await info.coreContractInfo.foundryData.getAddress());

    expect(await foundry.isInitialized()).eq(true);

    expect(await foundry.feeNFTFactory()).eq(await info.coreContractInfo.feeNFTFactory.getAddress());
    expect(await foundry.mortgageNFTFactory()).eq(await info.coreContractInfo.mortgageNFTFactory.getAddress());
    expect(await foundry.marketFactory()).eq(await info.coreContractInfo.marketFactory.getAddress());
    expect(await foundry.tokenFactory()).eq(await info.coreContractInfo.tokenFactory.getAddress());

    expect(await foundry.defaultMortgageFee()).eq(info.coreContractInfo.defaultMortgageFee);
    expect(await foundry.defaultMortgageFeeRecipient()).eq(info.coreContractInfo.defaultMortgageFeeWallet.address);

    expect(await foundry.curveFactoryWhitelist(await info.coreContractInfo.cpfCurveFactory.getAddress())).eq(true);
    expect(await foundry.curveFactoryWhitelist(ZERO_ADDRESS)).eq(false);

    expect(await foundry.nextAppId()).eq(2);

    expect(await foundry.owner()).eq(await info.coreContractInfo.deployWallet.getAddress());

    let xmemeInfo = await foundry.apps(1);
    expect(xmemeInfo.name).eq(info.xMemeAllContractInfo.appName);

    await expect(foundry.apps(0)).revertedWith("AE");
    await expect(foundry.apps(2)).revertedWith("AE");
  });

  it("createApp curveFactoryWhitelist", async function () {
    const info = (await loadFixture(deployAllContracts));
    let foundry = info.coreContractInfo.foundry;

    let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex];

    expect(await foundry.curveFactoryWhitelist(await info.coreContractInfo.cpfCurveFactory.getAddress())).eq(true);
    expect(await foundry.curveFactoryWhitelist(ZERO_ADDRESS)).eq(false);

    await expect(
      foundry.connect(user1).updateCurveFactoryWhitelist(await info.coreContractInfo.cpfCurveFactory.getAddress(), false)
    ).revertedWithCustomError(foundry, "OwnableUnauthorizedAccount");

    await foundry.connect(info.coreContractInfo.deployWallet).updateCurveFactoryWhitelist(await info.coreContractInfo.cpfCurveFactory.getAddress(), false)

    expect(await foundry.curveFactoryWhitelist(await info.coreContractInfo.cpfCurveFactory.getAddress())).eq(false);
    expect(await foundry.curveFactoryWhitelist(ZERO_ADDRESS)).eq(false);

    let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256"],
      [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
    )

    await expect(
      foundry.createApp(
        "app2",
        info.coreContractInfo.deployWallet.address,
        await info.coreContractInfo.cpfCurveFactory.getAddress(),
        curveParams,
        ZERO_ADDRESS,
        {
          appOwnerBuyFee: 100,
          appOwnerSellFee: 200,
          appOwnerMortgageFee: 300,
          appOwnerFeeRecipient: info.coreContractInfo.deployWallet.address,
          nftOwnerBuyFee: 400,
          nftOwnerSellFee: 500,
        })
    ).revertedWith("CFWE");

    await foundry.connect(info.coreContractInfo.deployWallet).updateCurveFactoryWhitelist(await info.coreContractInfo.cpfCurveFactory.getAddress(), true)

    await foundry.createApp(
      "app2",
      info.coreContractInfo.deployWallet.address,
      await info.coreContractInfo.cpfCurveFactory.getAddress(),
      curveParams,
      ZERO_ADDRESS,
      {
        appOwnerBuyFee: 100,
        appOwnerSellFee: 200,
        appOwnerMortgageFee: 300,
        appOwnerFeeRecipient: info.coreContractInfo.deployWallet.address,
        nftOwnerBuyFee: 400,
        nftOwnerSellFee: 500,
      });
    expect((await foundry.apps(2)).name).eq("app2");

    await foundry.connect(info.coreContractInfo.deployWallet).updateCurveFactoryWhitelist(await info.coreContractInfo.cpfCurveFactory.getAddress(), false)

    await expect(
      foundry.createApp(
        "app2",
        info.coreContractInfo.deployWallet.address,
        await info.coreContractInfo.cpfCurveFactory.getAddress(),
        curveParams,
        ZERO_ADDRESS,
        {
          appOwnerBuyFee: 100,
          appOwnerSellFee: 200,
          appOwnerMortgageFee: 300,
          appOwnerFeeRecipient: info.coreContractInfo.deployWallet.address,
          nftOwnerBuyFee: 400,
          nftOwnerSellFee: 500,
        })
    ).revertedWith("CFWE");

    await foundry.connect(info.coreContractInfo.deployWallet).updateCurveFactoryWhitelist(ZeroAddress, true)

    await foundry.createApp(
      "app3",
      info.coreContractInfo.deployWallet.address,
      await info.coreContractInfo.cpfCurveFactory.getAddress(),
      curveParams,
      ZERO_ADDRESS,
      {
        appOwnerBuyFee: 100,
        appOwnerSellFee: 200,
        appOwnerMortgageFee: 300,
        appOwnerFeeRecipient: info.coreContractInfo.deployWallet.address,
        nftOwnerBuyFee: 400,
        nftOwnerSellFee: 500,
      });
    expect((await foundry.apps(3)).name).eq("app3");

  });

  it("nextAppId apps appFees", async function () {
    const info = (await loadFixture(deployAllContracts));
    let foundry = info.coreContractInfo.foundry;
    let foundryData = info.coreContractInfo.foundryData;

    let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex];

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

    expect(await foundry.nextAppId()).eq(3);
    expect(await foundryData.nextAppId()).eq(3);

    await expect(foundry.apps(2)).revertedWith("AE");
    expect((await foundryData.apps(2)).name).eq(app2_name);

    await expect(foundry.appFees(2)).revertedWith("AE");
    expect((await foundryData.appFees(2)).appOwnerBuyFee).eq(app2_appOwnerBuyFee);
  });

  it("setAppOperator", async function () {
    const info = (await loadFixture(deployAllContracts));
    let foundry = info.coreContractInfo.foundry;
    let foundryData = info.coreContractInfo.foundryData;

    let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex];

    await foundryData.connect(info.xMemeAllContractInfo.deployWallet).updateFoundryWhitelist(user1.address, true)
    expect(await foundryData.foundryWhitelist(user1.address)).eq(true);

    let app2_name = "app2";
    let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];
    let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3];
    let app2_curve = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
    let app2_feeNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];
    let app2_mortgageNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];
    let app2_market = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7];
    let app2_payToken = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 8];

    let app2_appOwnerBuyFee = 100;
    let app2_appOwnerSellFee = 200;
    let app2_appOwnerMortgageFee = 300;
    let app2_appOwnerFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 10];;
    let app2_nftOwnerBuyFee = 400;
    let app2_nftOwnerSellFee = 500;
    let app2_platformMortgageFee = 600;
    let app2_platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 11];

    await foundryData.connect(user1).createApp({
      name: app2_name,
      owner: app2_owner,
      operator: ZeroAddress,
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

    expect(await foundry.nextAppId()).eq(3);
    expect(await foundryData.nextAppId()).eq(3);

    let app3_name = "app3";
    let app3_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 12];
    let app3_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 13];

    let app3_payToken = (await (
      await ethers.getContractFactory("SimpleToken")
    ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

    let app3_fees = {
      appOwnerBuyFee: 200,
      appOwnerSellFee: 300,
      appOwnerMortgageFee: 400,
      appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 14],
      nftOwnerBuyFee: 500,
      nftOwnerSellFee: 600,
    }

    let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256"],
      [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
    )

    await foundry.createApp(
      app3_name,
      app3_owner,
      await info.coreContractInfo.cpfCurveFactory.getAddress(),
      curveParams,
      app3_payToken,
      app3_fees);
    expect((await foundry.apps(3)).name).eq(app3_name);

    expect(await foundry.nextAppId()).eq(4);
    expect(await foundryData.nextAppId()).eq(4);

    await expect(foundry.setAppOperator(2, app2_operator)).revertedWith("AE");
    await expect(foundry.setAppOperator(3, app3_operator)).revertedWith("AOE");

    await expect(foundry.connect(app2_owner).setAppOperator(2, app2_operator)).revertedWith("AE");
    await foundry.connect(app3_owner).setAppOperator(3, app3_operator)
    await expect(foundry.connect(app3_owner).setAppOperator(3, app2_operator)).revertedWith("AOPE");

    expect((await foundry.apps(3)).operator).eq(app3_operator);

  });

  it("setAppOwner", async function () {
    const info = (await loadFixture(deployAllContracts));
    let foundry = info.coreContractInfo.foundry;
    let foundryData = info.coreContractInfo.foundryData;

    let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex];

    await foundryData.connect(info.xMemeAllContractInfo.deployWallet).updateFoundryWhitelist(user1.address, true)
    expect(await foundryData.foundryWhitelist(user1.address)).eq(true);

    let app2_name = "app2";
    let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];
    let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3];
    let app2_curve = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
    let app2_feeNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];
    let app2_mortgageNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];
    let app2_market = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7];
    let app2_payToken = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 8];

    let app2_appOwnerBuyFee = 100;
    let app2_appOwnerSellFee = 200;
    let app2_appOwnerMortgageFee = 300;
    let app2_appOwnerFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 10];;
    let app2_nftOwnerBuyFee = 400;
    let app2_nftOwnerSellFee = 500;
    let app2_platformMortgageFee = 600;
    let app2_platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 11];

    await foundryData.connect(user1).createApp({
      name: app2_name,
      owner: app2_owner,
      operator: ZeroAddress,
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

    expect(await foundry.nextAppId()).eq(3);
    expect(await foundryData.nextAppId()).eq(3);

    let app3_name = "app3";
    let app3_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 12];
    let app3_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 13];

    let app3_payToken = (await (
      await ethers.getContractFactory("SimpleToken")
    ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

    let app3_fees = {
      appOwnerBuyFee: 200,
      appOwnerSellFee: 300,
      appOwnerMortgageFee: 400,
      appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 14],
      nftOwnerBuyFee: 500,
      nftOwnerSellFee: 600,
    }

    let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256"],
      [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
    )

    await foundry.createApp(
      app3_name,
      app3_owner,
      await info.coreContractInfo.cpfCurveFactory.getAddress(),
      curveParams,
      app3_payToken,
      app3_fees);
    expect((await foundry.apps(3)).name).eq(app3_name);

    expect(await foundry.nextAppId()).eq(4);
    expect(await foundryData.nextAppId()).eq(4);

    await expect(foundry.setAppOwner(2, app2_operator)).revertedWith("AE");
    await expect(foundry.setAppOwner(3, app3_operator)).revertedWith("AOE");

    await expect(foundry.connect(app2_owner).setAppOwner(2, app2_operator)).revertedWith("AE");
    await foundry.connect(app3_owner).setAppOwner(3, app2_owner)
    expect((await foundry.apps(3)).owner).eq(app2_owner);
    await expect(foundry.connect(app3_owner).setAppOwner(3, app3_owner)).revertedWith("AOE");
    await foundry.connect(app2_owner).setAppOwner(3, app3_owner)
    expect((await foundry.apps(3)).owner).eq(app3_owner);
  });

  it("setAppOwnerFeeRecipient", async function () {
    const info = (await loadFixture(deployAllContracts));
    let foundry = info.coreContractInfo.foundry;
    let foundryData = info.coreContractInfo.foundryData;

    let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex];

    await foundryData.connect(info.xMemeAllContractInfo.deployWallet).updateFoundryWhitelist(user1.address, true)
    expect(await foundryData.foundryWhitelist(user1.address)).eq(true);

    let app2_name = "app2";
    let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];
    let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3];
    let app2_curve = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
    let app2_feeNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];
    let app2_mortgageNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];
    let app2_market = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7];
    let app2_payToken = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 8];

    let app2_appOwnerBuyFee = 100;
    let app2_appOwnerSellFee = 200;
    let app2_appOwnerMortgageFee = 300;
    let app2_appOwnerFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 10];;
    let app2_nftOwnerBuyFee = 400;
    let app2_nftOwnerSellFee = 500;
    let app2_platformMortgageFee = 600;
    let app2_platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 11];

    await foundryData.connect(user1).createApp({
      name: app2_name,
      owner: app2_owner,
      operator: ZeroAddress,
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

    expect(await foundry.nextAppId()).eq(3);
    expect(await foundryData.nextAppId()).eq(3);

    let app3_name = "app3";
    let app3_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 12];
    let app3_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 13];

    let app3_payToken = (await (
      await ethers.getContractFactory("SimpleToken")
    ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

    let app3_fees = {
      appOwnerBuyFee: 200,
      appOwnerSellFee: 300,
      appOwnerMortgageFee: 400,
      appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 14],
      nftOwnerBuyFee: 500,
      nftOwnerSellFee: 600,
    }

    let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256"],
      [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
    )

    await foundry.createApp(
      app3_name,
      app3_owner,
      await info.coreContractInfo.cpfCurveFactory.getAddress(),
      curveParams,
      app3_payToken,
      app3_fees);
    expect((await foundry.apps(3)).name).eq(app3_name);

    expect(await foundry.nextAppId()).eq(4);
    expect(await foundryData.nextAppId()).eq(4);

    await expect(foundry.setAppOwnerFeeRecipient(2, app2_appOwnerFeeRecipient)).revertedWith("AE");
    await expect(foundry.setAppOwnerFeeRecipient(3, app3_fees.appOwnerFeeRecipient)).revertedWith("AOE");

    await expect(foundry.connect(app2_owner).setAppOwnerFeeRecipient(2, app2_appOwnerFeeRecipient)).revertedWith("AE");
    await foundry.connect(app3_owner).setAppOwnerFeeRecipient(3, app2_appOwnerFeeRecipient)

    expect(app2_appOwnerFeeRecipient).not.eq(app3_fees.appOwnerFeeRecipient)

    let app3_fees_result = await foundry.appFees(3)
    expect(app3_fees_result.appOwnerBuyFee).eq(app3_fees.appOwnerBuyFee)
    expect(app3_fees_result.appOwnerSellFee).eq(app3_fees.appOwnerSellFee)
    expect(app3_fees_result.appOwnerMortgageFee).eq(app3_fees.appOwnerMortgageFee)
    expect(app3_fees_result.appOwnerFeeRecipient).eq(app2_appOwnerFeeRecipient)
    expect(app3_fees_result.nftOwnerBuyFee).eq(app3_fees.nftOwnerBuyFee)
    expect(app3_fees_result.nftOwnerSellFee).eq(app3_fees.nftOwnerSellFee)
    expect(app3_fees_result.platformMortgageFee).eq(info.coreContractInfo.defaultMortgageFee)
    expect(app3_fees_result.platformMortgageFeeRecipient).eq(info.coreContractInfo.defaultMortgageFeeWallet.address)


    await foundry.connect(app3_owner).setAppOwnerFeeRecipient(3, app3_fees.appOwnerFeeRecipient)

    app3_fees_result = await foundry.appFees(3)
    expect(app3_fees_result.appOwnerBuyFee).eq(app3_fees.appOwnerBuyFee)
    expect(app3_fees_result.appOwnerSellFee).eq(app3_fees.appOwnerSellFee)
    expect(app3_fees_result.appOwnerMortgageFee).eq(app3_fees.appOwnerMortgageFee)
    expect(app3_fees_result.appOwnerFeeRecipient).eq(app3_fees.appOwnerFeeRecipient)
    expect(app3_fees_result.nftOwnerBuyFee).eq(app3_fees.nftOwnerBuyFee)
    expect(app3_fees_result.nftOwnerSellFee).eq(app3_fees.nftOwnerSellFee)
    expect(app3_fees_result.platformMortgageFee).eq(info.coreContractInfo.defaultMortgageFee)
    expect(app3_fees_result.platformMortgageFeeRecipient).eq(info.coreContractInfo.defaultMortgageFeeWallet.address)

  });

  it("setPlatformMortgageFee", async function () {
    const info = (await loadFixture(deployAllContracts));
    let foundry = info.coreContractInfo.foundry;
    let foundryData = info.coreContractInfo.foundryData;

    let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex];

    await foundryData.connect(info.xMemeAllContractInfo.deployWallet).updateFoundryWhitelist(user1.address, true)
    expect(await foundryData.foundryWhitelist(user1.address)).eq(true);

    let app2_name = "app2";
    let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];
    let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3];
    let app2_curve = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
    let app2_feeNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];
    let app2_mortgageNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];
    let app2_market = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7];
    let app2_payToken = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 8];

    let app2_appOwnerBuyFee = 100;
    let app2_appOwnerSellFee = 200;
    let app2_appOwnerMortgageFee = 300;
    let app2_appOwnerFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 10];;
    let app2_nftOwnerBuyFee = 400;
    let app2_nftOwnerSellFee = 500;
    let app2_platformMortgageFee = 600;
    let app2_platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 11];

    await foundryData.connect(user1).createApp({
      name: app2_name,
      owner: app2_owner,
      operator: ZeroAddress,
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

    expect(await foundry.nextAppId()).eq(3);
    expect(await foundryData.nextAppId()).eq(3);

    let app3_name = "app3";
    let app3_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 12];
    let app3_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 13];

    let app3_payToken = (await (
      await ethers.getContractFactory("SimpleToken")
    ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

    let app3_fees = {
      appOwnerBuyFee: 200,
      appOwnerSellFee: 300,
      appOwnerMortgageFee: 400,
      appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 14],
      nftOwnerBuyFee: 500,
      nftOwnerSellFee: 600,
    }

    let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256"],
      [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
    )

    await foundry.createApp(
      app3_name,
      app3_owner,
      await info.coreContractInfo.cpfCurveFactory.getAddress(),
      curveParams,
      app3_payToken,
      app3_fees);
    expect((await foundry.apps(3)).name).eq(app3_name);

    expect(await foundry.nextAppId()).eq(4);
    expect(await foundryData.nextAppId()).eq(4);

    await expect(foundry.connect(user1).setPlatformMortgageFee(2, app2_platformMortgageFee + 1)).revertedWithCustomError(foundry, "OwnableUnauthorizedAccount");
    await expect(foundry.connect(user1).setPlatformMortgageFee(3, info.coreContractInfo.defaultMortgageFee + 1)).revertedWithCustomError(foundry, "OwnableUnauthorizedAccount");

    await expect(foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFee(2, app2_platformMortgageFee + 1)).revertedWith("AE");
    await foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFee(3, info.coreContractInfo.defaultMortgageFee + 1)

    let app3_fees_result = await foundry.appFees(3)
    expect(app3_fees_result.appOwnerBuyFee).eq(app3_fees.appOwnerBuyFee)
    expect(app3_fees_result.appOwnerSellFee).eq(app3_fees.appOwnerSellFee)
    expect(app3_fees_result.appOwnerMortgageFee).eq(app3_fees.appOwnerMortgageFee)
    expect(app3_fees_result.appOwnerFeeRecipient).eq(app3_fees.appOwnerFeeRecipient)
    expect(app3_fees_result.nftOwnerBuyFee).eq(app3_fees.nftOwnerBuyFee)
    expect(app3_fees_result.nftOwnerSellFee).eq(app3_fees.nftOwnerSellFee)
    expect(app3_fees_result.platformMortgageFee).eq(info.coreContractInfo.defaultMortgageFee + 1)
    expect(app3_fees_result.platformMortgageFeeRecipient).eq(info.coreContractInfo.defaultMortgageFeeWallet.address)


    await foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFee(3, info.coreContractInfo.defaultMortgageFee + 2)

    app3_fees_result = await foundry.appFees(3)
    expect(app3_fees_result.appOwnerBuyFee).eq(app3_fees.appOwnerBuyFee)
    expect(app3_fees_result.appOwnerSellFee).eq(app3_fees.appOwnerSellFee)
    expect(app3_fees_result.appOwnerMortgageFee).eq(app3_fees.appOwnerMortgageFee)
    expect(app3_fees_result.appOwnerFeeRecipient).eq(app3_fees.appOwnerFeeRecipient)
    expect(app3_fees_result.nftOwnerBuyFee).eq(app3_fees.nftOwnerBuyFee)
    expect(app3_fees_result.nftOwnerSellFee).eq(app3_fees.nftOwnerSellFee)
    expect(app3_fees_result.platformMortgageFee).eq(info.coreContractInfo.defaultMortgageFee + 2)
    expect(app3_fees_result.platformMortgageFeeRecipient).eq(info.coreContractInfo.defaultMortgageFeeWallet.address)

  });

  it("setPlatformMortgageFeeRecipient", async function () {
    const info = (await loadFixture(deployAllContracts));
    let foundry = info.coreContractInfo.foundry;
    let foundryData = info.coreContractInfo.foundryData;

    let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex];

    await foundryData.connect(info.xMemeAllContractInfo.deployWallet).updateFoundryWhitelist(user1.address, true)
    expect(await foundryData.foundryWhitelist(user1.address)).eq(true);

    let app2_name = "app2";
    let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];
    let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3];
    let app2_curve = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
    let app2_feeNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];
    let app2_mortgageNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];
    let app2_market = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7];
    let app2_payToken = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 8];

    let app2_appOwnerBuyFee = 100;
    let app2_appOwnerSellFee = 200;
    let app2_appOwnerMortgageFee = 300;
    let app2_appOwnerFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 10];;
    let app2_nftOwnerBuyFee = 400;
    let app2_nftOwnerSellFee = 500;
    let app2_platformMortgageFee = 600;
    let app2_platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 11];

    await foundryData.connect(user1).createApp({
      name: app2_name,
      owner: app2_owner,
      operator: ZeroAddress,
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

    expect(await foundry.nextAppId()).eq(3);
    expect(await foundryData.nextAppId()).eq(3);

    let app3_name = "app3";
    let app3_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 12];
    let app3_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 13];

    let app3_payToken = (await (
      await ethers.getContractFactory("SimpleToken")
    ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

    let app3_fees = {
      appOwnerBuyFee: 200,
      appOwnerSellFee: 300,
      appOwnerMortgageFee: 400,
      appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 14],
      nftOwnerBuyFee: 500,
      nftOwnerSellFee: 600,
    }

    let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256"],
      [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
    )

    await foundry.createApp(
      app3_name,
      app3_owner,
      await info.coreContractInfo.cpfCurveFactory.getAddress(),
      curveParams,
      app3_payToken,
      app3_fees);
    expect((await foundry.apps(3)).name).eq(app3_name);

    expect(await foundry.nextAppId()).eq(4);
    expect(await foundryData.nextAppId()).eq(4);

    await expect(foundry.connect(user1).setPlatformMortgageFeeRecipient(2, user1)).revertedWithCustomError(foundry, "OwnableUnauthorizedAccount");
    await expect(foundry.connect(user1).setPlatformMortgageFeeRecipient(3, user1)).revertedWithCustomError(foundry, "OwnableUnauthorizedAccount");

    await expect(foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFeeRecipient(2, user1)).revertedWith("AE");
    await foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFeeRecipient(3, user1)

    let app3_fees_result = await foundry.appFees(3)
    expect(app3_fees_result.appOwnerBuyFee).eq(app3_fees.appOwnerBuyFee)
    expect(app3_fees_result.appOwnerSellFee).eq(app3_fees.appOwnerSellFee)
    expect(app3_fees_result.appOwnerMortgageFee).eq(app3_fees.appOwnerMortgageFee)
    expect(app3_fees_result.appOwnerFeeRecipient).eq(app3_fees.appOwnerFeeRecipient)
    expect(app3_fees_result.nftOwnerBuyFee).eq(app3_fees.nftOwnerBuyFee)
    expect(app3_fees_result.nftOwnerSellFee).eq(app3_fees.nftOwnerSellFee)
    expect(app3_fees_result.platformMortgageFee).eq(info.coreContractInfo.defaultMortgageFee)
    expect(app3_fees_result.platformMortgageFeeRecipient).eq(user1)


    await foundry.connect(info.coreContractInfo.deployWallet).setPlatformMortgageFeeRecipient(3, info.coreContractInfo.defaultMortgageFeeWallet.address)

    app3_fees_result = await foundry.appFees(3)
    expect(app3_fees_result.appOwnerBuyFee).eq(app3_fees.appOwnerBuyFee)
    expect(app3_fees_result.appOwnerSellFee).eq(app3_fees.appOwnerSellFee)
    expect(app3_fees_result.appOwnerMortgageFee).eq(app3_fees.appOwnerMortgageFee)
    expect(app3_fees_result.appOwnerFeeRecipient).eq(app3_fees.appOwnerFeeRecipient)
    expect(app3_fees_result.nftOwnerBuyFee).eq(app3_fees.nftOwnerBuyFee)
    expect(app3_fees_result.nftOwnerSellFee).eq(app3_fees.nftOwnerSellFee)
    expect(app3_fees_result.platformMortgageFee).eq(info.coreContractInfo.defaultMortgageFee)
    expect(app3_fees_result.platformMortgageFeeRecipient).eq(info.coreContractInfo.defaultMortgageFeeWallet.address)

  });

  it("createToken appid exist and operator and tokenExist and length error and totalPercent error", async function () {
    const info = (await loadFixture(deployAllContracts));
    let foundry = info.coreContractInfo.foundry;
    let foundryData = info.coreContractInfo.foundryData;

    let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex];

    await foundryData.connect(info.xMemeAllContractInfo.deployWallet).updateFoundryWhitelist(user1.address, true)
    expect(await foundryData.foundryWhitelist(user1.address)).eq(true);

    let app2_name = "app2";
    let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];
    let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3];
    let app2_curve = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
    let app2_feeNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];
    let app2_mortgageNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];
    let app2_market = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7];
    let app2_payToken = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 8];

    let app2_appOwnerBuyFee = 100;
    let app2_appOwnerSellFee = 200;
    let app2_appOwnerMortgageFee = 300;
    let app2_appOwnerFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 10];;
    let app2_nftOwnerBuyFee = 400;
    let app2_nftOwnerSellFee = 500;
    let app2_platformMortgageFee = 600;
    let app2_platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 11];

    await foundryData.connect(user1).createApp({
      name: app2_name,
      owner: app2_owner,
      operator: ZeroAddress,
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

    expect(await foundry.nextAppId()).eq(3);
    expect(await foundryData.nextAppId()).eq(3);

    let app3_name = "app3";
    let app3_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 12];
    let app3_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 13];

    let app3_payToken = (await (
      await ethers.getContractFactory("SimpleToken")
    ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

    let app3_fees = {
      appOwnerBuyFee: 200,
      appOwnerSellFee: 300,
      appOwnerMortgageFee: 400,
      appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 14],
      nftOwnerBuyFee: 500,
      nftOwnerSellFee: 600,
    }

    let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256"],
      [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
    )

    await foundry.createApp(
      app3_name,
      app3_owner,
      await info.coreContractInfo.cpfCurveFactory.getAddress(),
      curveParams,
      app3_payToken,
      app3_fees);
    expect((await foundry.apps(3)).name).eq(app3_name);

    expect(await foundry.nextAppId()).eq(4);
    expect(await foundryData.nextAppId()).eq(4);

    await expect(foundry.createToken(4, "token1", "0x", [], [], [])).revertedWith("AE");
    await expect(foundry.createToken(2, "token1", "0x", [], [], [])).revertedWith("AE");

    await foundry.connect(app3_owner).setAppOperator(3, app3_operator)

    await expect(
      foundry.connect(user1).createToken(3, "token1", "0x", [], [], [])
    ).revertedWith("AOPE");

    await foundry.connect(app3_operator).createToken(3, "token1", "0x", [], [], [])

    await expect(foundry.connect(app3_operator).createToken(3, "token1", "0x", [], [], [])).revertedWith("TE");

    await expect(foundry.connect(app3_operator).createToken(3, "token2", "0x", [100], [], [])).revertedWith("LE1");
    await expect(foundry.connect(app3_operator).createToken(3, "token2", "0x", [100], [user1.address], [])).revertedWith("LE2");
    await expect(foundry.connect(app3_operator).createToken(3, "token2", "0x", [100], [user1.address], ["0x"])).revertedWith("TPE");
  });

  it("createToken tData and nftData and nftOwner and nftPercent", async function () {
    const info = (await loadFixture(deployAllContracts));
    let foundry = info.coreContractInfo.foundry;
    let foundryData = info.coreContractInfo.foundryData;

    let user1 = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex];

    await foundryData.connect(info.xMemeAllContractInfo.deployWallet).updateFoundryWhitelist(user1.address, true)
    expect(await foundryData.foundryWhitelist(user1.address)).eq(true);

    let app2_name = "app2";
    let app2_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2];
    let app2_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 3];
    let app2_curve = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 4];
    let app2_feeNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 5];
    let app2_mortgageNFT = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 6];
    let app2_market = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 7];
    let app2_payToken = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 8];

    let app2_appOwnerBuyFee = 100;
    let app2_appOwnerSellFee = 200;
    let app2_appOwnerMortgageFee = 300;
    let app2_appOwnerFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 10];;
    let app2_nftOwnerBuyFee = 400;
    let app2_nftOwnerSellFee = 500;
    let app2_platformMortgageFee = 600;
    let app2_platformMortgageFeeRecipient = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 11];

    await foundryData.connect(user1).createApp({
      name: app2_name,
      owner: app2_owner,
      operator: ZeroAddress,
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

    expect(await foundry.nextAppId()).eq(3);
    expect(await foundryData.nextAppId()).eq(3);

    let app3_name = "app3";
    let app3_owner = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 12];
    let app3_operator = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 13];

    let app3_payToken = (await (
      await ethers.getContractFactory("SimpleToken")
    ).deploy(BigInt(10) ** BigInt(27))) as SimpleToken;

    let app3_fees = {
      appOwnerBuyFee: 200,
      appOwnerSellFee: 300,
      appOwnerMortgageFee: 400,
      appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 14],
      nftOwnerBuyFee: 500,
      nftOwnerSellFee: 600,
    }

    let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256"],
      [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
    )

    await foundry.createApp(
      app3_name,
      app3_owner,
      await info.coreContractInfo.cpfCurveFactory.getAddress(),
      curveParams,
      app3_payToken,
      app3_fees);
    expect((await foundry.apps(3)).name).eq(app3_name);

    expect(await foundry.nextAppId()).eq(4);
    expect(await foundryData.nextAppId()).eq(4);

    await expect(foundry.createToken(4, "token1", "0x", [], [], [])).revertedWith("AE");
    await expect(foundry.createToken(2, "token1", "0x", [], [], [])).revertedWith("AE");

    await foundry.connect(app3_owner).setAppOperator(3, app3_operator)

    await expect(
      foundry.connect(user1).createToken(3, "token1", "0x", [], [], [])
    ).revertedWith("AOPE");

    expect(await foundry.tokenExist(3, "token1")).eq(false)

    let token1_info = await foundry.connect(app3_operator).createToken.staticCall(3, "token1", "0x", [], [], [])
    await foundry.connect(app3_operator).createToken(3, "token1", "0x12", [], [], [])

    expect(await foundry.token(3, "token1")).eq(token1_info.tokenAddr)
    expect(token1_info.tokenIds.length).eq(0)
    expect(await foundry.tokenExist(3, "token1")).eq(true)
    expect(await foundry.tokenData(3, "token1")).eq("0x12")

    let app3 = await foundry.apps(3)
    let feeNFT = (await ethers.getContractAt("FeeNFT", app3.feeNFT)) as FeeNFT;
    let token1_nft_info = await feeNFT.tidToInfos("token1")
    expect(token1_nft_info.tokenIds.length).eq(0)
    expect(token1_nft_info.percents.length).eq(0)
    expect(token1_nft_info.data.length).eq(0)
    expect(token1_nft_info.owners.length).eq(0)

    let token2_info = await foundry.connect(app3_operator).createToken.staticCall(3, "token2", "0x24", [5000, 95000], [user1.address, app3_owner], ["0x25", "0x26"])
    await foundry.connect(app3_operator).createToken(3, "token2", "0x24", [5000, 95000], [user1.address, app3_owner], ["0x25", "0x26"])

    expect(await foundry.token(3, "token2")).eq(token2_info.tokenAddr)
    expect(token2_info.tokenIds.length).eq(2)
    expect(token2_info.tokenIds[0]).eq(1)
    expect(token2_info.tokenIds[1]).eq(2)
    expect(await foundry.tokenExist(3, "token2")).eq(true)
    expect(await foundry.tokenData(3, "token2")).eq("0x24")

    let token2_nft_info = await feeNFT.tidToInfos("token2")
    expect(token2_nft_info.tokenIds.length).eq(2)
    expect(token2_nft_info.percents.length).eq(2)
    expect(token2_nft_info.data.length).eq(2)
    expect(token2_nft_info.owners.length).eq(2)

    expect(token2_nft_info.tokenIds[0]).eq(1)
    expect(token2_nft_info.percents[0]).eq(5000)
    expect(token2_nft_info.data[0]).eq("0x25")
    expect(token2_nft_info.owners[0]).eq(user1.address)

    expect(token2_nft_info.tokenIds[1]).eq(2)
    expect(token2_nft_info.percents[1]).eq(95000)
    expect(token2_nft_info.data[1]).eq("0x26")
    expect(token2_nft_info.owners[1]).eq(app3_owner)

  });
});
