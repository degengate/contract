import { ethers } from "hardhat";
import { deployAllContracts, ZERO_ADDRESS } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Curve, PublicNFT } from "../typechain-types";

describe("Foundry", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    expect(await info.foundry.FEE_DENOMINATOR()).eq(100000);
    expect(await info.foundry.TOTAL_PERCENT()).eq(100000);

    expect(await info.foundry.publicNFTFactory()).eq(await info.publicNFTFactory.getAddress());
    expect(await info.foundry.mortgageNFTFactory()).eq(await info.mortgageNFTFactory.getAddress());
    expect(await info.foundry.marketFactory()).eq(await info.marketFactory.getAddress());

    expect(await info.foundry.defaultMortgageFee()).eq(info.mortgageFee);
    expect(await info.foundry.defaultMortgageFeeRecipient()).eq(info.mortgageFeeWallet.address);

    expect(await info.foundry.nextAppId()).eq(2);

    expect(await info.foundry.mortgageFee(info.appId)).eq(info.mortgageFee);
    expect(await info.foundry.mortgageFeeRecipient(info.appId)).eq(info.mortgageFeeWallet.address);

    expect(await info.foundry.owner()).eq(await info.deployWallet.getAddress());

    let degenGateInfo = await info.foundry.apps(info.appId);
    expect(degenGateInfo.name).eq(info.appName);
    expect(degenGateInfo.owner).eq(info.degenGateOwnerWallet.address).not.eq(ZERO_ADDRESS);
    expect(degenGateInfo.operator)
      .eq(await info.degenGate.getAddress())
      .not.eq(ZERO_ADDRESS);
    expect(degenGateInfo.publicNFT)
      .eq(await info.publicNFT.getAddress())
      .not.eq(ZERO_ADDRESS);
    expect(degenGateInfo.mortgageNFT)
      .eq(await info.mortgageNFT.getAddress())
      .not.eq(ZERO_ADDRESS);
    expect(degenGateInfo.market)
      .eq(await info.market.getAddress())
      .not.eq(ZERO_ADDRESS);
  });

  it("apps", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    let degenGateInfo = await info.foundry.apps(info.appId);
    expect(degenGateInfo.name).eq(info.appName);
    expect(degenGateInfo.owner).eq(info.degenGateOwnerWallet.address).not.eq(ZERO_ADDRESS);
    expect(degenGateInfo.operator)
      .eq(await info.degenGate.getAddress())
      .not.eq(ZERO_ADDRESS);
    expect(degenGateInfo.publicNFT)
      .eq(await info.publicNFT.getAddress())
      .not.eq(ZERO_ADDRESS);
    expect(degenGateInfo.mortgageNFT)
      .eq(await info.mortgageNFT.getAddress())
      .not.eq(ZERO_ADDRESS);
    expect(degenGateInfo.market)
      .eq(await info.market.getAddress())
      .not.eq(ZERO_ADDRESS);

    let emptyInfo0 = await info.foundry.apps(0);
    expect(emptyInfo0.name).eq("");
    expect(emptyInfo0.owner).eq(ZERO_ADDRESS);
    expect(emptyInfo0.operator).eq(ZERO_ADDRESS);
    expect(emptyInfo0.publicNFT).eq(ZERO_ADDRESS);
    expect(emptyInfo0.mortgageNFT).eq(ZERO_ADDRESS);
    expect(emptyInfo0.market).eq(ZERO_ADDRESS);

    let emptyInfo2 = await info.foundry.apps(2);
    expect(emptyInfo2.name).eq("");
    expect(emptyInfo2.owner).eq(ZERO_ADDRESS);
    expect(emptyInfo2.operator).eq(ZERO_ADDRESS);
    expect(emptyInfo2.publicNFT).eq(ZERO_ADDRESS);
    expect(emptyInfo2.mortgageNFT).eq(ZERO_ADDRESS);
    expect(emptyInfo2.market).eq(ZERO_ADDRESS);

    // deploy curve
    let curve = (await (await ethers.getContractFactory("Curve")).deploy()) as Curve;

    let buySellFee = info.buySellFee + 11;
    // create app
    let app2OwnerWallet = info.wallets[info.nextWalletIndex];
    let app2OperatorWallet = info.wallets[info.nextWalletIndex + 1];
    let tx = await info.foundry.createApp(
      "app2",
      app2OwnerWallet.address,
      app2OperatorWallet.address,
      await curve.getAddress(),
      ZERO_ADDRESS,
      buySellFee,
    );
    console.log("publicNFTFactory ", await info.publicNFTFactory.getAddress())

    await expect(tx)
      .to.emit(info.foundry, "CreateApp")
      .withArgs(
        2,
        "app2",
        app2OwnerWallet.address,
        app2OperatorWallet.address,
        await curve.getAddress(),
        ZERO_ADDRESS,
        buySellFee,
        "0xE451980132E65465d0a498c53f0b5227326Dd73F",
        "0x6D544390Eb535d61e196c87d6B9c80dCD8628Acd",
        "0xb0279Db6a2F1E01fbC8483FCCef0Be2bC6299cC3",
        info.deployWallet.address,
      );

    degenGateInfo = await info.foundry.apps(info.appId);
    expect(degenGateInfo.name).eq(info.appName);
    expect(degenGateInfo.owner).eq(info.degenGateOwnerWallet.address).not.eq(ZERO_ADDRESS);
    expect(degenGateInfo.operator)
      .eq(await info.degenGate.getAddress())
      .not.eq(ZERO_ADDRESS);
    expect(degenGateInfo.publicNFT)
      .eq(await info.publicNFT.getAddress())
      .not.eq(ZERO_ADDRESS);
    expect(degenGateInfo.mortgageNFT)
      .eq(await info.mortgageNFT.getAddress())
      .not.eq(ZERO_ADDRESS);
    expect(degenGateInfo.market)
      .eq(await info.market.getAddress())
      .not.eq(ZERO_ADDRESS);

    emptyInfo0 = await info.foundry.apps(0);
    expect(emptyInfo0.name).eq("");
    expect(emptyInfo0.owner).eq(ZERO_ADDRESS);
    expect(emptyInfo0.operator).eq(ZERO_ADDRESS);
    expect(emptyInfo0.publicNFT).eq(ZERO_ADDRESS);
    expect(emptyInfo0.mortgageNFT).eq(ZERO_ADDRESS);
    expect(emptyInfo0.market).eq(ZERO_ADDRESS);

    let info2 = await info.foundry.apps(2);
    expect(info2.name).eq("app2");
    expect(info2.owner).eq(app2OwnerWallet.address);
    expect(info2.operator).eq(app2OperatorWallet.address);
    expect(info2.publicNFT).not.eq(ZERO_ADDRESS);
    expect(info2.mortgageNFT).not.eq(ZERO_ADDRESS);
    expect(info2.market).not.eq(ZERO_ADDRESS);
  });

  it("setMortgageFee mortgageFee", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    expect(await info.foundry.mortgageFee(info.appId)).eq(info.mortgageFee);
    expect(await info.foundry.mortgageFee(0)).eq(0);
    expect(await info.foundry.mortgageFee(2)).eq(0);

    // deploy curve
    let curve = (await (await ethers.getContractFactory("Curve")).deploy()) as Curve;

    let buySellFee = info.buySellFee + 11;
    // create app
    let app2OwnerWallet = info.wallets[info.nextWalletIndex];
    let app2OperatorWallet = info.wallets[info.nextWalletIndex + 1];
    await info.foundry.createApp(
      "app2",
      app2OwnerWallet.address,
      app2OperatorWallet.address,
      await curve.getAddress(),
      ZERO_ADDRESS,
      buySellFee,
    );

    let newOwner = info.wallets[info.nextWalletIndex + 2];
    expect(await info.foundry.owner()).eq(info.deployWallet.address);
    await info.foundry.connect(info.deployWallet).transferOwnership(newOwner.address);
    expect(await info.foundry.owner()).eq(newOwner.address);
    await expect(info.foundry.connect(info.deployWallet).transferOwnership(newOwner.address)).revertedWith(
      "Ownable: caller is not the owner",
    );

    expect(await info.foundry.mortgageFee(info.appId)).eq(info.mortgageFee);
    expect(await info.foundry.mortgageFee(0)).eq(0);
    expect(await info.foundry.mortgageFee(2)).eq(info.mortgageFee);

    let newMortgageFee = info.mortgageFee + 1;
    await expect(info.foundry.connect(info.deployWallet).setMortgageFee(info.appId, newMortgageFee)).revertedWith(
      "Ownable: caller is not the owner",
    );

    await info.foundry.connect(newOwner).setMortgageFee(info.appId, newMortgageFee);
    expect(await info.foundry.mortgageFee(info.appId)).eq(newMortgageFee);
    expect(await info.foundry.mortgageFee(0)).eq(0);
    expect(await info.foundry.mortgageFee(2)).eq(info.mortgageFee);
  });

  it("mortgageFeeRecipient", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    expect(await info.foundry.mortgageFeeRecipient(info.appId)).eq(info.mortgageFeeWallet.address);
    expect(await info.foundry.mortgageFeeRecipient(0)).eq(ZERO_ADDRESS);
    expect(await info.foundry.mortgageFeeRecipient(2)).eq(ZERO_ADDRESS);

    // deploy curve
    let curve = (await (await ethers.getContractFactory("Curve")).deploy()) as Curve;

    let buySellFee = info.buySellFee + 11;
    // create app
    let app2OwnerWallet = info.wallets[info.nextWalletIndex];
    let app2OperatorWallet = info.wallets[info.nextWalletIndex + 1];
    await info.foundry.createApp(
      "app2",
      app2OwnerWallet.address,
      app2OperatorWallet.address,
      await curve.getAddress(),
      ZERO_ADDRESS,
      buySellFee,
    );

    let newOwner = info.wallets[info.nextWalletIndex + 2];
    expect(await info.foundry.owner()).eq(info.deployWallet.address);
    await info.foundry.connect(info.deployWallet).transferOwnership(newOwner.address);
    expect(await info.foundry.owner()).eq(newOwner.address);
    await expect(info.foundry.connect(info.deployWallet).transferOwnership(newOwner.address)).revertedWith(
      "Ownable: caller is not the owner",
    );

    expect(await info.foundry.mortgageFeeRecipient(info.appId)).eq(info.mortgageFeeWallet.address);
    expect(await info.foundry.mortgageFeeRecipient(0)).eq(ZERO_ADDRESS);
    expect(await info.foundry.mortgageFeeRecipient(2)).eq(info.mortgageFeeWallet.address);

    let newMortgageFeeRecipient = info.wallets[info.nextWalletIndex + 2];
    await expect(
      info.foundry.connect(info.deployWallet).setMortgageFeeRecipient(info.appId, newMortgageFeeRecipient.address),
    ).revertedWith("Ownable: caller is not the owner");

    await info.foundry.connect(newOwner).setMortgageFeeRecipient(info.appId, newMortgageFeeRecipient.address);

    expect(newMortgageFeeRecipient).not.eq(info.mortgageFeeWallet.address);
    expect(await info.foundry.mortgageFeeRecipient(info.appId)).eq(newMortgageFeeRecipient.address);
    expect(await info.foundry.mortgageFeeRecipient(0)).eq(ZERO_ADDRESS);
    expect(await info.foundry.mortgageFeeRecipient(2)).eq(info.mortgageFeeWallet.address);
  });

  it("nextappid", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    expect(await info.foundry.nextAppId()).eq(2);

    // deploy curve
    let curve = (await (await ethers.getContractFactory("Curve")).deploy()) as Curve;

    let buySellFee = info.buySellFee + 11;
    // create app
    let app2OwnerWallet = info.wallets[info.nextWalletIndex];
    let app2OperatorWallet = info.wallets[info.nextWalletIndex + 1];
    await info.foundry.createApp(
      "app2",
      app2OwnerWallet.address,
      app2OperatorWallet.address,
      await curve.getAddress(),
      ZERO_ADDRESS,
      buySellFee,
    );

    expect(await info.foundry.nextAppId()).eq(3);
  });

  it("setAppOwner", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    expect((await info.foundry.apps(info.appId)).owner).eq(info.degenGateOwnerWallet.address);

    let newAppOwnerWallet = info.wallets[info.nextWalletIndex];
    await expect(info.foundry.setAppOwner(info.appId, newAppOwnerWallet.address)).revertedWith("AOE");

    await info.foundry.connect(info.degenGateOwnerWallet).setAppOwner(info.appId, newAppOwnerWallet.address);

    expect((await info.foundry.apps(info.appId)).owner).eq(newAppOwnerWallet.address);
    expect(info.degenGateOwnerWallet.address).not.eq(newAppOwnerWallet.address);

    await expect(
      info.foundry.connect(info.degenGateOwnerWallet).setAppOwner(info.appId, newAppOwnerWallet.address),
    ).revertedWith("AOE");

    await info.foundry.connect(newAppOwnerWallet).setAppOwner(info.appId, newAppOwnerWallet.address);
  });

  it("createToken", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    expect((await info.foundry.apps(info.appId)).operator).eq(await info.degenGate.getAddress());

    // create app
    let app2OwnerWallet = info.wallets[info.nextWalletIndex + 1];
    let app2OperatorWallet = info.wallets[info.nextWalletIndex + 2];

    let firstAppId = 1

    await expect(
      info.foundry
        .connect(app2OperatorWallet)
        .createToken(
          firstAppId + 1,
          "t2",
          "0x",
          [5000, 95000],
          [info.deployWallet.address, info.deployWallet.address],
          ["0x", "0x"],
        ),
    ).revertedWith("AE");

    await info.foundry.createApp(
      "app2",
      app2OwnerWallet.address,
      app2OperatorWallet.address,
      await info.curve.getAddress(),
      ZERO_ADDRESS,
      info.buySellFee,
    );

    await info.foundry
      .connect(app2OperatorWallet)
      .createToken(
        firstAppId + 1,
        "t2",
        "0x22",
        [5000, 95000],
        [info.deployWallet.address, info.deployWallet.address],
        ["0x21", "0x22"],
      );

    let appId_2 = 2;

    await expect(
      info.foundry.createToken(
        appId_2,
        "t1",
        "0x",
        [5000, 95000],
        [info.deployWallet.address, info.deployWallet.address],
        ["0x", "0x"],
      ),
    ).revertedWith("AOPE");

    await expect(
      info.foundry
        .connect(app2OperatorWallet)
        .createToken(
          0,
          "t1",
          "0x",
          [5000, 95000],
          [info.deployWallet.address, info.deployWallet.address],
          ["0x", "0x"],
        ),
    ).revertedWith("AE");

    await expect(
      info.foundry
        .connect(app2OperatorWallet)
        .createToken(
          appId_2 + 1,
          "t1",
          "0x",
          [5000, 95000],
          [info.deployWallet.address, info.deployWallet.address],
          ["0x", "0x"],
        ),
    ).revertedWith("AE");

    await expect(
      info.foundry
        .connect(app2OperatorWallet)
        .createToken(
          appId_2,
          "t1",
          "0x",
          [5001, 95000],
          [info.deployWallet.address, info.deployWallet.address],
          ["0x", "0x"],
        ),
    ).revertedWith("TPE");

    await expect(
      info.foundry
        .connect(app2OperatorWallet)
        .createToken(appId_2, "t1", "0x", [5000, 95000], [ZERO_ADDRESS, info.deployWallet.address], ["0x", "0x"]),
    ).revertedWith("ADDE");

    await expect(
      info.foundry
        .connect(app2OperatorWallet)
        .createToken(appId_2, "t1", "0x", [5000, 95000], [info.deployWallet.address, ZERO_ADDRESS], ["0x", "0x"]),
    ).revertedWith("ADDE");

    await expect(
      info.foundry
        .connect(app2OperatorWallet)
        .createToken(
          appId_2,
          "t1",
          "0x",
          [5000, 95000],
          [info.deployWallet.address, info.deployWallet.address],
          ["0x"],
        ),
    ).revertedWith("LE2");

    await expect(
      info.foundry
        .connect(app2OperatorWallet)
        .createToken(appId_2, "t1", "0x", [5000, 95000], [info.deployWallet.address], ["0x", "0x"]),
    ).revertedWith("LE1");

    await expect(
      info.foundry
        .connect(app2OperatorWallet)
        .createToken(
          appId_2,
          "t1",
          "0x",
          [5000],
          [info.deployWallet.address, info.deployWallet.address],
          ["0x", "0x"],
        ),
    ).revertedWith("LE1");

    let tx = await info.foundry
      .connect(app2OperatorWallet)
      .createToken(
        appId_2,
        "t1",
        "0x11",
        [5000, 95000],
        [info.wallets[1].address, info.wallets[2].address],
        ["0x11", "0x12"],
      );

    await expect(tx)
      .to.emit(info.foundry, "CreateToken")
      .withArgs(
        appId_2,
        "t1",
        "0x11",
        [3, 4],
        [5000, 95000],
        [info.wallets[1].address, info.wallets[2].address],
        ["0x11", "0x12"],
        app2OperatorWallet.address,
      );

    await expect(
      info.foundry
        .connect(app2OperatorWallet)
        .createToken(
          appId_2,
          "t1",
          "0x",
          [5000, 95000],
          [info.deployWallet.address, info.deployWallet.address],
          ["0x", "0x"],
        ),
    ).revertedWith("TE");

    await info.foundry
      .connect(app2OperatorWallet)
      .createToken(
        appId_2,
        "t3",
        "0x33",
        [5000, 95000],
        [info.wallets[3].address, info.wallets[4].address],
        ["0x31", "0x32"],
      );

    expect(await info.foundry.tokenData(appId_2, "t1")).eq("0x11");
    expect(await info.foundry.tokenData(appId_2, "t2")).eq("0x22");
    expect(await info.foundry.tokenData(appId_2, "t3")).eq("0x33");


    let publicNFT = (await ethers.getContractAt("PublicNFT", (await info.foundry.apps(appId_2)).publicNFT)) as PublicNFT;

    const info1 = await publicNFT.tokenIdToInfo(1);
    const info2 = await publicNFT.tokenIdToInfo(2);
    const info3 = await publicNFT.tokenIdToInfo(3);
    const info4 = await publicNFT.tokenIdToInfo(4);
    const info5 = await publicNFT.tokenIdToInfo(5);
    const info6 = await publicNFT.tokenIdToInfo(6);

    expect(info1.tid).eq("t2");
    expect(info2.tid).eq("t2");
    expect(info1.percent).eq(5000);
    expect(info2.percent).eq(95000);
    expect(info1.data).eq("0x21");
    expect(info2.data).eq("0x22");
    expect(info1._owner).eq(info.deployWallet.address);
    expect(info2._owner).eq(info.deployWallet.address);

    expect(info3.tid).eq("t1");
    expect(info4.tid).eq("t1");
    expect(info3.percent).eq(5000);
    expect(info4.percent).eq(95000);
    expect(info3.data).eq("0x11");
    expect(info4.data).eq("0x12");
    expect(info3._owner).eq(info.wallets[1].address);
    expect(info4._owner).eq(info.wallets[2].address);

    expect(info5.tid).eq("t3");
    expect(info6.tid).eq("t3");
    expect(info5.percent).eq(5000);
    expect(info6.percent).eq(95000);
    expect(info5.data).eq("0x31");
    expect(info6.data).eq("0x32");
    expect(info5._owner).eq(info.wallets[3].address);
    expect(info6._owner).eq(info.wallets[4].address);

  });

  it("createApp loop", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    expect(await info.foundry.nextAppId()).eq(2);

    let address2Bool: any = {};
    let app1Info = await info.foundry.apps(1);
    address2Bool[app1Info.publicNFT] = true;
    address2Bool[app1Info.mortgageNFT] = true;
    address2Bool[app1Info.market] = true;

    // deploy curve
    let curve = (await (await ethers.getContractFactory("Curve")).deploy()) as Curve;

    let buySellFee = info.buySellFee + 11;
    // create app
    let app2OwnerWallet = info.wallets[info.nextWalletIndex];
    let app2OperatorWallet = info.wallets[info.nextWalletIndex + 1];

    for (let i = 2; i <= 100; i++) {
      let appInfo = await info.foundry.apps(i);
      expect(appInfo.name).eq("");
      expect(appInfo.publicNFT).eq(ZERO_ADDRESS);
      expect(appInfo.mortgageNFT).eq(ZERO_ADDRESS);
      expect(appInfo.market).eq(ZERO_ADDRESS);

      let appName = `app${i}`;
      expect(await info.foundry.nextAppId()).eq(i);
      await info.foundry.createApp(
        appName,
        app2OwnerWallet.address,
        app2OperatorWallet.address,
        await curve.getAddress(),
        ZERO_ADDRESS,
        buySellFee,
      );
      expect(await info.foundry.nextAppId()).eq(i + 1);

      appInfo = await info.foundry.apps(i);
      expect(appInfo.name).eq(appName);

      expect(address2Bool[appInfo.publicNFT]).eq(undefined);
      expect(address2Bool[appInfo.mortgageNFT]).eq(undefined);
      expect(address2Bool[appInfo.market]).eq(undefined);

      address2Bool[appInfo.publicNFT] = true;
      address2Bool[appInfo.mortgageNFT] = true;
      address2Bool[appInfo.market] = true;
    }
  });

  it("createToken loop", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    expect((await info.foundry.apps(info.appId)).operator).eq(await info.degenGate.getAddress());

    // create app
    let app2OwnerWallet = info.wallets[info.nextWalletIndex + 1];
    let app2OperatorWallet = info.wallets[info.nextWalletIndex + 2];

    await info.foundry.createApp(
      "app2",
      app2OwnerWallet.address,
      app2OperatorWallet.address,
      await info.curve.getAddress(),
      ZERO_ADDRESS,
      info.buySellFee,
    );

    let appId_2 = info.appId + 1;
    let publicNFT = (await ethers.getContractAt("PublicNFT", (await info.foundry.apps(appId_2)).publicNFT)) as PublicNFT;

    for (let i = 1; i <= 100; i++) {
      let tid = `tid${i}`;
      let tData = ethers.AbiCoder.defaultAbiCoder().encode(["string", "uint256"], [tid, i]);
      let nft1Data = ethers.AbiCoder.defaultAbiCoder().encode(["string", "uint256", "uint256"], [tid, i, 1]);
      let nft2Data = ethers.AbiCoder.defaultAbiCoder().encode(["string", "uint256", "uint256"], [tid, i, 2]);

      expect(await info.foundry.tokenData(appId_2, tid)).eq("0x");
      expect(await info.foundry.tokenExist(appId_2, tid)).eq(false);

      expect(await publicNFT.totalSupply()).eq(2 * i - 2);

      await expect(publicNFT.ownerOf(2 * i - 1)).revertedWith("ERC721: invalid token ID");
      await expect(publicNFT.ownerOf(2 * i)).revertedWith("ERC721: invalid token ID");

      await expect(publicNFT.tokenIdToInfo(2 * i - 1)).revertedWith("ERC721: invalid token ID");
      await expect(publicNFT.tokenIdToInfo(2 * i)).revertedWith("ERC721: invalid token ID");

      let tokenIds = await publicNFT.tidToTokenIds(tid);
      expect(tokenIds.length).eq(0);

      let infos = await publicNFT.tidToInfos(tid);
      expect(infos.tokenIds.length).eq(0);
      expect(infos.percents.length).eq(0);
      expect(infos.data.length).eq(0);
      expect(infos.owners.length).eq(0);

      let tx = await info.foundry
        .connect(app2OperatorWallet)
        .createToken(
          appId_2,
          tid,
          tData,
          [5000, 95000],
          [info.wallets[1].address, info.wallets[2].address],
          [nft1Data, nft2Data],
        );

      await expect(tx)
        .to.emit(info.foundry, "CreateToken")
        .withArgs(
          appId_2,
          tid,
          tData,
          [2 * i - 1, 2 * i],
          [5000, 95000],
          [info.wallets[1].address, info.wallets[2].address],
          [nft1Data, nft2Data],
          app2OperatorWallet.address,
        );

      expect(await info.foundry.tokenData(appId_2, tid)).eq(tData);
      expect(await info.foundry.tokenExist(appId_2, tid)).eq(true);

      expect(await publicNFT.ownerOf(2 * i - 1)).eq(info.wallets[1].address);
      expect(await publicNFT.ownerOf(2 * i)).eq(info.wallets[2].address);

      let info1 = await publicNFT.tokenIdToInfo(2 * i - 1);
      let info2 = await publicNFT.tokenIdToInfo(2 * i);

      expect(info1.tid).eq(tid);
      expect(info2.tid).eq(tid);
      expect(info1.percent).eq(5000);
      expect(info2.percent).eq(95000);
      expect(info1.data).eq(nft1Data);
      expect(info2.data).eq(nft2Data);
      expect(info1._owner).eq(info.wallets[1].address);
      expect(info2._owner).eq(info.wallets[2].address);

      expect(await publicNFT.totalSupply()).eq(2 * i);

      tokenIds = await publicNFT.tidToTokenIds(tid);
      expect(tokenIds.length).eq(2);

      expect(tokenIds[0]).eq(2 * i - 1);
      expect(tokenIds[1]).eq(2 * i);

      infos = await publicNFT.tidToInfos(tid);
      expect(infos.tokenIds.length).eq(2);
      expect(infos.percents.length).eq(2);
      expect(infos.data.length).eq(2);
      expect(infos.owners.length).eq(2);

      expect(infos.tokenIds[0]).eq(2 * i - 1);
      expect(infos.tokenIds[1]).eq(2 * i);

      expect(infos.percents[0]).eq(5000);
      expect(infos.percents[1]).eq(95000);

      expect(infos.data[0]).eq(nft1Data);
      expect(infos.data[1]).eq(nft2Data);

      expect(infos.owners[0]).eq(info.wallets[1].address);
      expect(infos.owners[1]).eq(info.wallets[2].address);
    }
  });
});
