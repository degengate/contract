import { ZERO_ADDRESS, deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { getTokenAmountWei, parseTokenURI } from "./shared/utils";
import { ethers } from "hardhat";
import { FeeNFT, Market, MortgageNFT, XMemeMortgageNFTView } from "../typechain-types";
import { MaxInt256, ZeroAddress } from "ethers";

describe("MortgageNFT", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts));
    const coreInfo = info.coreContractInfo;
    const xMemeInfo = info.xMemeAllContractInfo;

    expect(await xMemeInfo.mortgageNFT.appId()).eq(xMemeInfo.appId);
    expect(await xMemeInfo.mortgageNFT.foundry()).eq(await coreInfo.foundry.getAddress());
    expect(await xMemeInfo.mortgageNFT.market()).eq(await xMemeInfo.market.getAddress());
    expect(await xMemeInfo.mortgageNFT.mortgageNFTView()).eq(ZERO_ADDRESS);
  });

  it("default owner", async function () {
    const info = (await loadFixture(deployAllContracts));
    const coreInfo = info.coreContractInfo;
    const xMemeInfo = info.xMemeAllContractInfo;

    let defaultOwmer = (await coreInfo.foundry.apps(xMemeInfo.appId)).owner
    expect(xMemeInfo.appOwnerWallet.address).eq(defaultOwmer)

    expect(await xMemeInfo.mortgageNFT.owner()).eq(defaultOwmer);

    await xMemeInfo.mortgageNFT.connect(xMemeInfo.appOwnerWallet).transferOwnership(xMemeInfo.userWallet.address)
    expect(await xMemeInfo.mortgageNFT.owner()).eq(xMemeInfo.userWallet.address);
    expect(await xMemeInfo.mortgageNFT.owner()).not.eq(defaultOwmer);
    await xMemeInfo.mortgageNFT.connect(xMemeInfo.userWallet).transferOwnership(xMemeInfo.appOwnerWallet.address)
  });

  it("name symbol tokenURI setMortgageNFTView", async function () {
    const info = (await loadFixture(deployAllContracts));
    const coreInfo = info.coreContractInfo;
    const xMemeInfo = info.xMemeAllContractInfo;

    await xMemeInfo.xMeme.setSystemReady(true)

    let tid = "t1";
    let multiplyAmount = BigInt(10) ** BigInt(18) * BigInt(100);

    await xMemeInfo.xMeme.connect(xMemeInfo.userWallet).createTokenAndMultiply(tid, multiplyAmount, { value: BigInt(10) ** BigInt(20) });

    expect(await xMemeInfo.mortgageNFT.name()).eq("X-meme Option");
    expect(await xMemeInfo.mortgageNFT.symbol()).eq("X-meme Option");

    const tokenInfo = parseTokenURI(await xMemeInfo.mortgageNFT.tokenURI(1));

    expect(tokenInfo.name).eq("X-meme Option 1");
    expect(tokenInfo.description).eq(
      "If you need to customize the display content, please use the setMortgageNFTView function in the contract to set a custom display contract.",
    );
    expect(tokenInfo.image).eq("");

    let nftView = (await (
      await ethers.getContractFactory("XMemeMortgageNFTView")
    ).deploy(
      await xMemeInfo.mortgageNFT.getAddress(),
    )) as XMemeMortgageNFTView;

    await expect(
      xMemeInfo.mortgageNFT.setMortgageNFTView(await nftView.getAddress())
    ).revertedWithCustomError(xMemeInfo.mortgageNFT, "OwnableUnauthorizedAccount")
    await xMemeInfo.mortgageNFT.connect(xMemeInfo.appOwnerWallet).setMortgageNFTView(await nftView.getAddress());

    expect(await xMemeInfo.mortgageNFT.name()).eq("X-meme Option");
    expect(await xMemeInfo.mortgageNFT.symbol()).eq("XMO");
    expect(await xMemeInfo.mortgageNFT.mortgageNFTView()).eq(await nftView.getAddress());

    const tokenInfo2 = parseTokenURI(await xMemeInfo.mortgageNFT.tokenURI(1));

    expect(tokenInfo2.name).eq("t1 - #1 - 100");
    expect(tokenInfo2.description).eq(
      "This NFT represents a collateral option within the X-meme.\n⚠️ DISCLAIMER: Always perform due diligence before purchasing this NFT. Verify that the image reflects the correct number of option in the collateral. Refresh cached images on trading platforms to ensure you have the latest data.",
    );
    expect(tokenInfo2.image).not.eq("");
  });

  it("info tokenInfosOfOwner tokenInfosOfOwnerByTid", async function () {
    const info = (await loadFixture(deployAllContracts));
    const coreInfo = info.coreContractInfo;

    let app2_appid = await coreInfo.foundry.nextAppId()
    let app2_name = "app2";
    let app2_owner = coreInfo.wallets[coreInfo.nextWalletIndex];
    let app2_operator = coreInfo.wallets[coreInfo.nextWalletIndex + 1];
    let app2_fees = {
      appOwnerBuyFee: 0,
      appOwnerSellFee: 0,
      appOwnerMortgageFee: 0,
      appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2],
      nftOwnerBuyFee: 0,
      nftOwnerSellFee: 0,
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
      ZeroAddress,
      app2_fees);
    expect((await coreInfo.foundry.apps(app2_appid)).name).eq(app2_name);
    await coreInfo.foundry.connect(app2_owner).setAppOperator(app2_appid, app2_operator)

    let tid_1 = "t1";
    let tid_2 = "t2";
    await coreInfo.foundry.connect(app2_operator).createToken(app2_appid, tid_1, "0x12", [], [], [])
    await coreInfo.foundry.connect(app2_operator).createToken(app2_appid, tid_2, "0x12", [], [], [])

    let app2 = await coreInfo.foundry.apps(app2_appid);
    let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;
    let app2_mortgageNFT = (await ethers.getContractAt("MortgageNFT", app2.mortgageNFT)) as MortgageNFT;

    let userWallet = coreInfo.wallets[coreInfo.nextWalletIndex + 3];
    let user1Wallet = coreInfo.wallets[coreInfo.nextWalletIndex + 4];
    let nftOwner1 = coreInfo.wallets[coreInfo.nextWalletIndex + 5];

    let multiplyAmount_1 = BigInt(10) ** BigInt(18) * BigInt(100);
    await app2_market.connect(userWallet).multiply(tid_1, multiplyAmount_1, { value: BigInt(10) ** BigInt(20) });

    let multiplyAmount_2 = BigInt(10) ** BigInt(18) * BigInt(100);
    await app2_market.connect(userWallet).multiply(tid_2, multiplyAmount_2, { value: BigInt(10) ** BigInt(20) });

    // multiply user1 t1 11
    await app2_market.connect(user1Wallet)
      .multiply(tid_1, BigInt(10) ** BigInt(18) * BigInt(11), { value: BigInt(10) ** BigInt(20) })

    // multiply user1 t2 22
    await app2_market.connect(user1Wallet)
      .multiply(tid_2, BigInt(10) ** BigInt(18) * BigInt(22), { value: BigInt(10) ** BigInt(20) })

    let info1 = await app2_mortgageNFT.info(1);
    let info2 = await app2_mortgageNFT.info(2);
    let info3 = await app2_mortgageNFT.info(3);
    let info4 = await app2_mortgageNFT.info(4);
    expect(info1.tid).eq(tid_1);
    expect(info1.amount).eq(multiplyAmount_1);

    expect(info2.tid).eq(tid_2);
    expect(info2.amount).eq(multiplyAmount_2);

    expect(info3.tid).eq(tid_1);
    expect(info3.amount).eq(BigInt(10) ** BigInt(18) * BigInt(11));

    expect(info4.tid).eq(tid_2);
    expect(info4.amount).eq(BigInt(10) ** BigInt(18) * BigInt(22));

    let infos = await app2_mortgageNFT.tokenInfosOfOwner(userWallet.address);
    expect(infos.length).eq(2);
    expect(infos[0].tid).eq(info1.tid);
    expect(infos[1].tid).eq(info2.tid);
    expect(infos[0].amount).eq(info1.amount);
    expect(infos[1].amount).eq(info2.amount);

    let infos1 = await app2_mortgageNFT.tokenInfosOfOwner(user1Wallet.address);
    expect(infos1.length).eq(2);
    expect(infos1[0].tid).eq(info3.tid);
    expect(infos1[1].tid).eq(info4.tid);
    expect(infos1[0].amount).eq(info3.amount);
    expect(infos1[1].amount).eq(info4.amount);

    let infosBy1 = await app2_mortgageNFT.tokenInfosOfOwnerByTid(userWallet.address, tid_1);
    expect(infosBy1.length).eq(1);
    expect(infosBy1[0].tid).eq(info1.tid);
    expect(infosBy1[0].amount).eq(info1.amount);

    let infosBy2 = await app2_mortgageNFT.tokenInfosOfOwnerByTid(userWallet.address, tid_2);
    expect(infosBy2.length).eq(1);
    expect(infosBy2[0].tid).eq(info2.tid);
    expect(infosBy2[0].amount).eq(info2.amount);

    let infos1By1 = await app2_mortgageNFT.tokenInfosOfOwnerByTid(user1Wallet.address, tid_1);
    expect(infos1By1.length).eq(1);
    expect(infos1By1[0].tid).eq(info3.tid);
    expect(infos1By1[0].amount).eq(info3.amount);

    let infos1By2 = await app2_mortgageNFT.tokenInfosOfOwnerByTid(user1Wallet.address, tid_2);
    expect(infos1By2.length).eq(1);
    expect(infos1By2[0].tid).eq(info4.tid);
    expect(infos1By2[0].amount).eq(info4.amount);

    // redeem 1 10
    await app2_market
      .connect(userWallet)
      .redeem(1, BigInt(10) ** BigInt(18) * BigInt(10), { value: BigInt(10) ** BigInt(20) });

    // redeem 2 20
    await app2_market
      .connect(userWallet)
      .redeem(2, BigInt(10) ** BigInt(18) * BigInt(20), { value: BigInt(10) ** BigInt(20) });

    // multiplyAdd 3 10
    await app2_market
      .connect(user1Wallet)
      .multiplyAdd(3, BigInt(10) ** BigInt(18) * BigInt(10), { value: BigInt(10) ** BigInt(20) });

    // multiplyAdd 4 20
    await app2_market
      .connect(user1Wallet)
      .multiplyAdd(4, BigInt(10) ** BigInt(18) * BigInt(20), { value: BigInt(10) ** BigInt(20) });

    // multiply user 5 t1 20
    await app2_market
      .connect(userWallet)
      .multiplyNew(tid_1, BigInt(10) ** BigInt(18) * BigInt(20), { value: BigInt(10) ** BigInt(20) });

    // multiply user1 6 t2 30
    await app2_market
      .connect(user1Wallet)
      .multiplyNew(tid_2, BigInt(10) ** BigInt(18) * BigInt(30), { value: BigInt(10) ** BigInt(20) });

    // multiply user 7 t2 30
    await app2_market
      .connect(userWallet)
      .multiplyNew(tid_2, BigInt(10) ** BigInt(18) * BigInt(30), { value: BigInt(10) ** BigInt(20) });

    // multiply user1 8 t1 20
    await app2_market
      .connect(user1Wallet)
      .multiplyNew(tid_1, BigInt(10) ** BigInt(18) * BigInt(20), { value: BigInt(10) ** BigInt(20) });

    // multiply user 9 t1 40
    await app2_market
      .connect(userWallet)
      .multiplyNew(tid_1, BigInt(10) ** BigInt(18) * BigInt(40), { value: BigInt(10) ** BigInt(20) });

    // multiply user1 10 t2 50
    await app2_market
      .connect(user1Wallet)
      .multiplyNew(tid_2, BigInt(10) ** BigInt(18) * BigInt(50), { value: BigInt(10) ** BigInt(20) });

    /**
     * 1 user  t1
     * 2 user  t2
     * 3 user1 t1
     * 4 user1 t2
     * 5 user  t1
     * 6 user1 t2
     * 7 user  t2
     * 8 user1 t1
     * 9 user  t1
     * 10 user1 t2
     */
    info1 = await app2_mortgageNFT.info(1);
    info2 = await app2_mortgageNFT.info(2);
    info3 = await app2_mortgageNFT.info(3);
    info4 = await app2_mortgageNFT.info(4);
    let info5 = await app2_mortgageNFT.info(5);
    let info6 = await app2_mortgageNFT.info(6);
    let info7 = await app2_mortgageNFT.info(7);
    let info8 = await app2_mortgageNFT.info(8);
    let info9 = await app2_mortgageNFT.info(9);
    let info10 = await app2_mortgageNFT.info(10);

    expect(info1.tid).eq(tid_1);
    expect(info1.amount).eq(multiplyAmount_1 - BigInt(10) ** BigInt(18) * BigInt(10));

    expect(info2.tid).eq(tid_2);
    expect(info2.amount).eq(multiplyAmount_2 - BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info3.tid).eq(tid_1);
    expect(info3.amount).eq(BigInt(10) ** BigInt(18) * BigInt(11) + BigInt(10) ** BigInt(18) * BigInt(10));

    expect(info4.tid).eq(tid_2);
    expect(info4.amount).eq(BigInt(10) ** BigInt(18) * BigInt(22) + BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info5.tid).eq(tid_1);
    expect(info5.amount).eq(BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info6.tid).eq(tid_2);
    expect(info6.amount).eq(BigInt(10) ** BigInt(18) * BigInt(30));

    expect(info7.tid).eq(tid_2);
    expect(info7.amount).eq(BigInt(10) ** BigInt(18) * BigInt(30));

    expect(info8.tid).eq(tid_1);
    expect(info8.amount).eq(BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info9.tid).eq(tid_1);
    expect(info9.amount).eq(BigInt(10) ** BigInt(18) * BigInt(40));

    expect(info10.tid).eq(tid_2);
    expect(info10.amount).eq(BigInt(10) ** BigInt(18) * BigInt(50));

    infos = await app2_mortgageNFT.tokenInfosOfOwner(userWallet.address);
    expect(infos.length).eq(5);
    expect(infos[0].tid).eq(info1.tid);
    expect(infos[1].tid).eq(info2.tid);
    expect(infos[2].tid).eq(info5.tid);
    expect(infos[3].tid).eq(info7.tid);
    expect(infos[4].tid).eq(info9.tid);

    expect(infos[0].amount).eq(info1.amount);
    expect(infos[1].amount).eq(info2.amount);
    expect(infos[2].amount).eq(info5.amount);
    expect(infos[3].amount).eq(info7.amount);
    expect(infos[4].amount).eq(info9.amount);

    infos1 = await app2_mortgageNFT.tokenInfosOfOwner(user1Wallet.address);
    expect(infos1.length).eq(5);
    expect(infos1[0].tid).eq(info3.tid);
    expect(infos1[1].tid).eq(info4.tid);
    expect(infos1[2].tid).eq(info6.tid);
    expect(infos1[3].tid).eq(info8.tid);
    expect(infos1[4].tid).eq(info10.tid);

    expect(infos1[0].amount).eq(info3.amount);
    expect(infos1[1].amount).eq(info4.amount);
    expect(infos1[2].amount).eq(info6.amount);
    expect(infos1[3].amount).eq(info8.amount);
    expect(infos1[4].amount).eq(info10.amount);

    infosBy1 = await app2_mortgageNFT.tokenInfosOfOwnerByTid(userWallet.address, tid_1);
    expect(infosBy1.length).eq(3);
    expect(infosBy1[0].tid).eq(info1.tid);
    expect(infosBy1[1].tid).eq(info5.tid);
    expect(infosBy1[2].tid).eq(info9.tid);

    expect(infosBy1[0].amount).eq(info1.amount);
    expect(infosBy1[1].amount).eq(info5.amount);
    expect(infosBy1[2].amount).eq(info9.amount);

    infosBy2 = await app2_mortgageNFT.tokenInfosOfOwnerByTid(userWallet.address, tid_2);
    expect(infosBy2.length).eq(2);
    expect(infosBy2[0].tid).eq(info2.tid);
    expect(infosBy2[1].tid).eq(info7.tid);

    expect(infosBy2[0].amount).eq(info2.amount);
    expect(infosBy2[1].amount).eq(info7.amount);

    infos1By1 = await app2_mortgageNFT.tokenInfosOfOwnerByTid(user1Wallet.address, tid_1);
    expect(infos1By1.length).eq(2);
    expect(infos1By1[0].tid).eq(info3.tid);
    expect(infos1By1[1].tid).eq(info8.tid);

    expect(infos1By1[0].amount).eq(info3.amount);
    expect(infos1By1[1].amount).eq(info8.amount);

    infos1By2 = await app2_mortgageNFT.tokenInfosOfOwnerByTid(user1Wallet.address, tid_2);
    expect(infos1By2.length).eq(3);
    expect(infos1By2[0].tid).eq(info4.tid);
    expect(infos1By2[1].tid).eq(info6.tid);
    expect(infos1By2[2].tid).eq(info10.tid);

    expect(infos1By2[0].amount).eq(info4.amount);
    expect(infos1By2[1].amount).eq(info6.amount);
    expect(infos1By2[2].amount).eq(info10.amount);

    // user redeem 2
    await app2_market.connect(userWallet).redeem(2, info2.amount, { value: BigInt(10) ** BigInt(20) });

    // user1 redeem 3
    await app2_market.connect(user1Wallet).redeem(3, info3.amount, { value: BigInt(10) ** BigInt(20) });

    // user  redeem 5
    await app2_market.connect(userWallet).redeem(5, info5.amount, { value: BigInt(10) ** BigInt(20) });

    // user1 redeem 6
    await app2_market.connect(user1Wallet).redeem(6, info6.amount, { value: BigInt(10) ** BigInt(20) });

    /**
     * 1 user  t1
     * 2 null
     * 3 null
     * 4 user1 t2
     * 5 null
     * 6 null
     * 7 user  t2
     * 8 user1 t1
     * 9 user  t1
     * 10 user1 t2
     */
    info1 = await app2_mortgageNFT.info(1);
    info2 = await app2_mortgageNFT.info(2);
    info3 = await app2_mortgageNFT.info(3);
    info4 = await app2_mortgageNFT.info(4);
    info5 = await app2_mortgageNFT.info(5);
    info6 = await app2_mortgageNFT.info(6);
    info7 = await app2_mortgageNFT.info(7);
    info8 = await app2_mortgageNFT.info(8);
    info9 = await app2_mortgageNFT.info(9);
    info10 = await app2_mortgageNFT.info(10);

    expect(info1.tid).eq(tid_1);
    expect(info1.amount).eq(multiplyAmount_1 - BigInt(10) ** BigInt(18) * BigInt(10));

    expect(info2.tid).eq("");
    expect(info2.amount).eq(0);

    expect(info3.tid).eq("");
    expect(info3.amount).eq(0);

    expect(info4.tid).eq(tid_2);
    expect(info4.amount).eq(BigInt(10) ** BigInt(18) * BigInt(22) + BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info5.tid).eq("");
    expect(info5.amount).eq(0);

    expect(info6.tid).eq("");
    expect(info6.amount).eq(0);

    expect(info7.tid).eq(tid_2);
    expect(info7.amount).eq(BigInt(10) ** BigInt(18) * BigInt(30));

    expect(info8.tid).eq(tid_1);
    expect(info8.amount).eq(BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info9.tid).eq(tid_1);
    expect(info9.amount).eq(BigInt(10) ** BigInt(18) * BigInt(40));

    expect(info10.tid).eq(tid_2);
    expect(info10.amount).eq(BigInt(10) ** BigInt(18) * BigInt(50));

    infos = await app2_mortgageNFT.tokenInfosOfOwner(userWallet.address);
    expect(infos.length).eq(3);
    expect(infos[0].tid).eq(info1.tid);
    expect(infos[1].tid).eq(info9.tid);
    expect(infos[2].tid).eq(info7.tid);

    expect(infos[0].amount).eq(info1.amount);
    expect(infos[1].amount).eq(info9.amount);
    expect(infos[2].amount).eq(info7.amount);

    infos1 = await app2_mortgageNFT.tokenInfosOfOwner(user1Wallet.address);
    expect(infos1.length).eq(3);

    expect(infos1[0].tid).eq(info10.tid);
    expect(infos1[1].tid).eq(info4.tid);
    expect(infos1[2].tid).eq(info8.tid);

    expect(infos1[0].amount).eq(info10.amount);
    expect(infos1[1].amount).eq(info4.amount);
    expect(infos1[2].amount).eq(info8.amount);

    infosBy1 = await app2_mortgageNFT.tokenInfosOfOwnerByTid(userWallet.address, tid_1);
    expect(infosBy1.length).eq(2);
    expect(infosBy1[0].tid).eq(info1.tid);
    expect(infosBy1[1].tid).eq(info9.tid);

    expect(infosBy1[0].amount).eq(info1.amount);
    expect(infosBy1[1].amount).eq(info9.amount);

    infosBy2 = await app2_mortgageNFT.tokenInfosOfOwnerByTid(userWallet.address, tid_2);
    expect(infosBy2.length).eq(1);
    expect(infosBy2[0].tid).eq(info7.tid);
    expect(infosBy2[0].amount).eq(info7.amount);

    infos1By1 = await app2_mortgageNFT.tokenInfosOfOwnerByTid(user1Wallet.address, tid_1);
    expect(infos1By1.length).eq(1);

    expect(infos1By1[0].tid).eq(info8.tid);
    expect(infos1By1[0].amount).eq(info8.amount);

    infos1By2 = await app2_mortgageNFT.tokenInfosOfOwnerByTid(user1Wallet.address, tid_2);
    expect(infos1By2.length).eq(2);

    expect(infos1By2[0].tid).eq(info10.tid);
    expect(infos1By2[1].tid).eq(info4.tid);

    expect(infos1By2[0].amount).eq(info10.amount);
    expect(infos1By2[1].amount).eq(info4.amount);

    // empty
    expect((await app2_mortgageNFT.info(20)).amount).eq(0);
    expect((await app2_mortgageNFT.info(20)).tid).eq("");

    let infosEmpty = await app2_mortgageNFT.tokenInfosOfOwner(nftOwner1.address);
    expect(infosEmpty.length).eq(0);

    let infosByTidEmtpy1 = await app2_mortgageNFT.tokenInfosOfOwnerByTid(userWallet.address, "t3");
    expect(infosByTidEmtpy1.length).eq(0);

    let infos1ByTidEmtpy2 = await app2_mortgageNFT.tokenInfosOfOwnerByTid(nftOwner1.address, tid_1);
    expect(infos1ByTidEmtpy2.length).eq(0);
  });

  it("initialize add burn mint remove", async function () {
    const info = (await loadFixture(deployAllContracts)).xMemeAllContractInfo;

    await expect(info.mortgageNFT.initialize(await info.market.getAddress())).revertedWith("onlyFoundry");

    await expect(info.mortgageNFT.add(1, 1)).revertedWith("onlyMarket");

    await expect(info.mortgageNFT.burn(1)).revertedWith("onlyMarket");

    await expect(info.mortgageNFT.mint(info.deployWallet.address, "t1", 1)).revertedWith("onlyMarket");

    await expect(info.mortgageNFT.remove(1, 1)).revertedWith("onlyMarket");
  });

  it("transferFrom zero_address", async function () {
    const info = (await loadFixture(deployAllContracts)).xMemeAllContractInfo;

    await info.xMeme.setSystemReady(true)

    let nftOwner1 = info.wallets[info.nextWalletIndex];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 1];

    let tid = "t1";
    let multiplyAmount = 100;

    await info.xMeme.connect(info.userWallet).createTokenAndMultiply(tid, multiplyAmount, { value: BigInt(10) ** BigInt(20) });

    expect(await info.mortgageNFT.ownerOf(1)).eq(info.userWallet.address);

    await expect(
      info.mortgageNFT.connect(info.userWallet).transferFrom(info.userWallet.address, ZERO_ADDRESS, 1),
    ).revertedWithCustomError(info.mortgageNFT, "ERC721InvalidReceiver")

    await expect(
      info.mortgageNFT
        .connect(info.userWallet)
      ["safeTransferFrom(address,address,uint256)"](info.userWallet.address, ZERO_ADDRESS, 1),
    ).revertedWithCustomError(info.mortgageNFT, "ERC721InvalidReceiver")

    await expect(
      info.mortgageNFT
        .connect(info.userWallet)
      ["safeTransferFrom(address,address,uint256,bytes)"](info.userWallet.address, ZERO_ADDRESS, 1, "0x"),
    ).revertedWithCustomError(info.mortgageNFT, "ERC721InvalidReceiver")

    await info.mortgageNFT.connect(info.userWallet).transferFrom(info.userWallet.address, nftOwner1.address, 1);
    expect(await info.mortgageNFT.ownerOf(1)).eq(nftOwner1.address);

    await info.mortgageNFT
      .connect(nftOwner1)
    ["safeTransferFrom(address,address,uint256)"](nftOwner1.address, nftOwner2.address, 1);
    expect(await info.mortgageNFT.ownerOf(1)).eq(nftOwner2.address);

    await info.mortgageNFT
      .connect(nftOwner2)
    ["safeTransferFrom(address,address,uint256,bytes)"](nftOwner2.address, info.userWallet.address, 1, "0x");
    expect(await info.mortgageNFT.ownerOf(1)).eq(info.userWallet.address);
  });

  it("mint loop", async function () {
    const info = (await loadFixture(deployAllContracts));
    const coreInfo = info.coreContractInfo;

    let app2_appid = await coreInfo.foundry.nextAppId()
    let app2_name = "app2";
    let app2_owner = coreInfo.wallets[coreInfo.nextWalletIndex];
    let app2_operator = coreInfo.wallets[coreInfo.nextWalletIndex + 1];
    let app2_fees = {
      appOwnerBuyFee: 0,
      appOwnerSellFee: 0,
      appOwnerMortgageFee: 0,
      appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 2],
      nftOwnerBuyFee: 0,
      nftOwnerSellFee: 0,
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
      ZeroAddress,
      app2_fees);
    expect((await coreInfo.foundry.apps(app2_appid)).name).eq(app2_name);
    await coreInfo.foundry.connect(app2_owner).setAppOperator(app2_appid, app2_operator)

    let app2 = await coreInfo.foundry.apps(app2_appid);
    let app2_market = (await ethers.getContractAt("Market", app2.market)) as Market;
    let app2_mortgageNFT = (await ethers.getContractAt("MortgageNFT", app2.mortgageNFT)) as MortgageNFT;
    let app2_feeNFT = (await ethers.getContractAt("FeeNFT", app2.feeNFT)) as FeeNFT;

    let userWallet = coreInfo.wallets[coreInfo.nextWalletIndex + 3];
    let user1Wallet = coreInfo.wallets[coreInfo.nextWalletIndex + 4];
    let nftOwner1 = coreInfo.wallets[coreInfo.nextWalletIndex + 5];

    await expect(app2_feeNFT.ownerOf(1)).revertedWithCustomError(app2_feeNFT, "ERC721NonexistentToken")
    await expect(app2_feeNFT.ownerOf(2)).revertedWithCustomError(app2_feeNFT, "ERC721NonexistentToken")

    let tid_1 = "t1";
    await coreInfo.foundry.connect(app2_operator).createToken(app2_appid, tid_1, "0x12", [
      5000, 95000
    ], [
      userWallet.address,
      coreInfo.deployWallet.address
    ], ["0x24", "0x25"])

    expect(await app2_feeNFT.ownerOf(1)).eq(userWallet.address);
    expect(await app2_feeNFT.ownerOf(2)).eq(coreInfo.deployWallet.address);

    await app2_market
      .connect(userWallet)
      .buy(tid_1, getTokenAmountWei(10000), { value: BigInt(10) ** BigInt(20) });

    let tokenAddr = await info.coreContractInfo.foundry.token(app2_appid, tid_1);
    let token = await ethers.getContractAt("Token", tokenAddr);

    for (let i = 1; i <= 100; i++) {
      expect(await app2_mortgageNFT.totalSupply()).eq(i - 1);
      await expect(app2_mortgageNFT.ownerOf(i)).revertedWithCustomError(app2_mortgageNFT, "ERC721NonexistentToken")

      let tInfo = await app2_mortgageNFT.info(i);
      expect(tInfo.tid).eq("");
      expect(tInfo.amount).eq(0);

      let n = i % 3;

      let count = getTokenAmountWei(101 - i);

      if (n == 1) {
        await token.connect(userWallet).approve(await app2_market.getAddress(), count);
        await app2_market.connect(userWallet).mortgageNew(tid_1, count);
      } else if (n == 2) {
        await app2_market
          .connect(userWallet)
          .multiplyNew(tid_1, count, { value: BigInt(10) ** BigInt(20) });
      } else if (n == 0) {
        await app2_market.connect(userWallet).split(i - 1, count, { value: BigInt(10) ** BigInt(20) });
      }

      expect(await app2_mortgageNFT.totalSupply()).eq(i);
      expect(await app2_mortgageNFT.ownerOf(i)).eq(userWallet.address);

      tInfo = await app2_mortgageNFT.info(i);
      expect(tInfo.tid).eq(tid_1 + "");
      expect(tInfo.amount).eq(count);
    }
  });
});
