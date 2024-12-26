import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ZeroAddress } from "ethers";
import { ethers } from "hardhat";
import { Market, SimpleToken } from "../typechain-types";

describe("Market", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts));
    const xMemeInfo = info.xMemeAllContractInfo;
    const coreInfo = info.coreContractInfo;

    let xMemeAppInfo = await coreInfo.foundry.apps(xMemeInfo.appId);
    let xMemeAppFeeInfo = await coreInfo.foundry.appFees(xMemeInfo.appId);

    expect(await xMemeInfo.market.feeDenominator()).eq(await coreInfo.foundry.FEE_DENOMINATOR());
    expect(await xMemeInfo.market.totalPercent()).eq(await coreInfo.foundry.TOTAL_PERCENT());
    expect(await xMemeInfo.market.foundry()).eq(await coreInfo.foundry.getAddress());
    expect(await xMemeInfo.market.appId()).eq(xMemeInfo.appId);

    expect(await xMemeInfo.market.curve()).eq(xMemeAppInfo.curve);
    expect(await xMemeInfo.market.payToken()).eq(xMemeAppInfo.payToken).eq(ZeroAddress);

    expect(await xMemeInfo.market.feeNFT()).eq(xMemeAppInfo.feeNFT);
    expect(await xMemeInfo.market.mortgageNFT()).eq(xMemeAppInfo.mortgageNFT);

    let appFee = await xMemeInfo.market.appFee();
    expect(appFee.appOwnerBuyFee).eq(xMemeAppFeeInfo.appOwnerBuyFee);
    expect(appFee.appOwnerSellFee).eq(xMemeAppFeeInfo.appOwnerSellFee);
    expect(appFee.appOwnerMortgageFee).eq(xMemeAppFeeInfo.appOwnerMortgageFee);
    expect(appFee.appOwnerFeeRecipient).eq(xMemeAppFeeInfo.appOwnerFeeRecipient);
    expect(appFee.nftOwnerBuyFee).eq(xMemeAppFeeInfo.nftOwnerBuyFee);
    expect(appFee.nftOwnerSellFee).eq(xMemeAppFeeInfo.nftOwnerSellFee);
    expect(appFee.platformMortgageFee).eq(xMemeAppFeeInfo.platformMortgageFee);
    expect(appFee.platformMortgageFeeRecipient).eq(xMemeAppFeeInfo.platformMortgageFeeRecipient);
  });

  it("appFee", async function () {
    const info = (await loadFixture(deployAllContracts));
    const coreInfo = info.coreContractInfo;

    expect(coreInfo.defaultMortgageFee).eq(await coreInfo.foundry.defaultMortgageFee());
    expect(coreInfo.defaultMortgageFeeWallet.address).eq(await coreInfo.foundry.defaultMortgageFeeRecipient());

    let app2_appid = await coreInfo.foundry.nextAppId();
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

    await coreInfo.foundry.createApp(
      app2_name,
      app2_owner,
      await info.coreContractInfo.cpfCurveFactory.getAddress(),
      curveParams,
      app2_payToken,
      app2_fees);
    expect((await coreInfo.foundry.apps(app2_appid)).name).eq(app2_name);

    await coreInfo.foundry.connect(app2_owner).setAppOperator(app2_appid, app2_operator)

    let query_app2_fee = await coreInfo.foundry.appFees(app2_appid);
    expect(query_app2_fee.appOwnerBuyFee).eq(app2_fees.appOwnerBuyFee);
    expect(query_app2_fee.appOwnerSellFee).eq(app2_fees.appOwnerSellFee);
    expect(query_app2_fee.appOwnerMortgageFee).eq(app2_fees.appOwnerMortgageFee);
    expect(query_app2_fee.appOwnerFeeRecipient).eq(app2_fees.appOwnerFeeRecipient);
    expect(query_app2_fee.nftOwnerBuyFee).eq(app2_fees.nftOwnerBuyFee);
    expect(query_app2_fee.nftOwnerSellFee).eq(app2_fees.nftOwnerSellFee);
    expect(query_app2_fee.platformMortgageFee).eq(await coreInfo.foundry.defaultMortgageFee());
    expect(query_app2_fee.platformMortgageFeeRecipient).eq(await coreInfo.foundry.defaultMortgageFeeRecipient());


    let app2_info = await coreInfo.foundry.apps(app2_appid);
    let app2_market = (await ethers.getContractAt("Market", app2_info.market)) as Market;

    let app2_market_fee = await app2_market.appFee();
    expect(app2_market_fee.appOwnerBuyFee).eq(app2_fees.appOwnerBuyFee);
    expect(app2_market_fee.appOwnerSellFee).eq(app2_fees.appOwnerSellFee);
    expect(app2_market_fee.appOwnerMortgageFee).eq(app2_fees.appOwnerMortgageFee);
    expect(app2_market_fee.appOwnerFeeRecipient).eq(app2_fees.appOwnerFeeRecipient);
    expect(app2_market_fee.nftOwnerBuyFee).eq(app2_fees.nftOwnerBuyFee);
    expect(app2_market_fee.nftOwnerSellFee).eq(app2_fees.nftOwnerSellFee);
    expect(app2_market_fee.platformMortgageFee).eq(await coreInfo.foundry.defaultMortgageFee());
    expect(app2_market_fee.platformMortgageFeeRecipient).eq(await coreInfo.foundry.defaultMortgageFeeRecipient());

  });

  it("initialize", async function () {
    const info = (await loadFixture(deployAllContracts)).xMemeAllContractInfo;

    await expect(
      info.market.initialize(await info.feeNFT.getAddress(), await info.mortgageNFT.getAddress()),
    ).revertedWith("onlyFoundry");
  });

  it("totalSupply", async function () {
    const info = (await loadFixture(deployAllContracts)).xMemeAllContractInfo;
    await info.xMeme.setSystemReady(true)

    const tid = "1"
    const tokenAmount = BigInt(10) ** BigInt(18) * BigInt(1234)
    await info.xMeme.connect(info.userWallet).createTokenAndBuy(tid, tokenAmount, { value: BigInt(10) ** BigInt(20) });

    expect(await info.market.totalSupply(tid)).eq(tokenAmount);

    await expect(info.market.totalSupply("2")).revertedWithoutReason()
  });

  it("balanceOf", async function () {
    const info = (await loadFixture(deployAllContracts)).xMemeAllContractInfo;
    await info.xMeme.setSystemReady(true)

    const tid = "1"
    const tokenAmount = BigInt(10) ** BigInt(18) * BigInt(1234)
    await info.xMeme.connect(info.userWallet).createTokenAndBuy(tid, tokenAmount, { value: BigInt(10) ** BigInt(20) });

    expect(await info.market.balanceOf(tid, info.userWallet.address)).eq(tokenAmount);
    expect(await info.market.balanceOf(tid, await info.market.getAddress())).eq(0);

    const tid2 = "2"
    const tokenAmount2 = BigInt(10) ** BigInt(18) * BigInt(1234)

    await expect(info.market.balanceOf(tid2, info.userWallet.address)).revertedWithoutReason()

    await info.xMeme.connect(info.userWallet).createTokenAndMultiply(tid2, tokenAmount2, { value: BigInt(10) ** BigInt(20) });

    expect(await info.market.balanceOf(tid2, info.userWallet.address)).eq(0);
    expect(await info.market.balanceOf(tid2, await info.market.getAddress())).eq(tokenAmount2);

  });

  it("token", async function () {
    const info = (await loadFixture(deployAllContracts));
    const coreInfo = info.coreContractInfo;
    const xMemeInfo = info.xMemeAllContractInfo;

    await xMemeInfo.xMeme.setSystemReady(true)

    const tid = "1"
    const tokenAmount = BigInt(10) ** BigInt(18) * BigInt(1234)
    await xMemeInfo.xMeme.connect(xMemeInfo.userWallet).createTokenAndBuy(tid, tokenAmount, { value: BigInt(10) ** BigInt(20) });

    expect(await xMemeInfo.market.token(tid)).eq(await coreInfo.foundry.token(xMemeInfo.appId, tid));

    const tid2 = "2"
    const tokenAmount2 = BigInt(10) ** BigInt(18) * BigInt(1234)

    expect(await xMemeInfo.market.token(tid2)).eq(ZeroAddress);

    await xMemeInfo.xMeme.connect(xMemeInfo.userWallet).createTokenAndMultiply(tid2, tokenAmount2, { value: BigInt(10) ** BigInt(20) });

    expect(await xMemeInfo.market.token(tid2)).eq(await coreInfo.foundry.token(xMemeInfo.appId, tid2));
  });

  it("getPayTokenAmount", async function () {
    const info = (await loadFixture(deployAllContracts)).xMemeAllContractInfo;

    expect(await info.market.getPayTokenAmount(100, 1000)).eq(await info.curve.curveMath(100, 1000));
    expect(await info.market.getPayTokenAmount(101, 1002)).eq(await info.curve.curveMath(101, 1002));
  });

  it("getBuyPayTokenAmount", async function () {
    const info = (await loadFixture(deployAllContracts));
    const coreInfo = info.coreContractInfo;
    const xMemeInfo = info.xMemeAllContractInfo;

    await xMemeInfo.xMeme.setSystemReady(true)

    const tid = "1"
    const tokenAmount = BigInt(10) ** BigInt(18) * BigInt(1234)
    await xMemeInfo.xMeme.connect(xMemeInfo.userWallet).createTokenAndBuy(tid, tokenAmount, { value: BigInt(10) ** BigInt(20) });

    const tid2 = "2"
    const tokenAmount2 = BigInt(10) ** BigInt(18) * BigInt(2345)

    await xMemeInfo.xMeme.connect(xMemeInfo.userWallet).createTokenAndMultiply(tid2, tokenAmount2, { value: BigInt(10) ** BigInt(20) });

    expect(
      await xMemeInfo.market.getBuyPayTokenAmount(tid, BigInt(10) ** BigInt(18))
    ).eq(await xMemeInfo.curve.curveMath(tokenAmount, BigInt(10) ** BigInt(18)));

    expect(
      await xMemeInfo.market.getBuyPayTokenAmount(tid2, BigInt(10) ** BigInt(20))
    ).eq(await xMemeInfo.curve.curveMath(tokenAmount2, BigInt(10) ** BigInt(20)));
  });

  it("getSellPayTokenAmount", async function () {
    const info = (await loadFixture(deployAllContracts));
    const coreInfo = info.coreContractInfo;
    const xMemeInfo = info.xMemeAllContractInfo;

    await xMemeInfo.xMeme.setSystemReady(true)

    const tid = "1"
    const tokenAmount = BigInt(10) ** BigInt(18) * BigInt(1234)
    await xMemeInfo.xMeme.connect(xMemeInfo.userWallet).createTokenAndBuy(tid, tokenAmount, { value: BigInt(10) ** BigInt(20) });

    const tid2 = "2"
    const tokenAmount2 = BigInt(10) ** BigInt(18) * BigInt(2345)

    await xMemeInfo.xMeme.connect(xMemeInfo.userWallet).createTokenAndMultiply(tid2, tokenAmount2, { value: BigInt(10) ** BigInt(20) });

    expect(
      await xMemeInfo.market.getSellPayTokenAmount(tid, BigInt(10) ** BigInt(18))
    ).eq(await xMemeInfo.curve.curveMath(tokenAmount - BigInt(10) ** BigInt(18), BigInt(10) ** BigInt(18)));

    expect(
      await xMemeInfo.market.getSellPayTokenAmount(tid2, BigInt(10) ** BigInt(20))
    ).eq(await xMemeInfo.curve.curveMath(tokenAmount2 - BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(20)));
  });

});
