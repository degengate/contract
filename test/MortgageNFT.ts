import { ZERO_ADDRESS, deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { getTokenAmountWei, parseTokenURI } from "./shared/utils";
import { ethers } from "hardhat";
import { MortgageNFT, MortgageNFTView } from "../typechain-types";
import { MaxInt256 } from "ethers";

describe("MortgageNFT", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    expect(await info.mortgageNFT.appId()).eq(info.appId);
    expect(await info.mortgageNFT.foundry()).eq(await info.foundry.getAddress());
    expect(await info.mortgageNFT.market()).eq(await info.market.getAddress());
    expect(await info.mortgageNFT.mortgageNFTView()).eq(ZERO_ADDRESS);
  });

  it("default owner", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    let defaultOwmer = (await info.foundry.apps(info.appId)).owner
    expect(info.degenGateOwnerWallet.address).eq(defaultOwmer)

    expect(await info.mortgageNFT.owner()).eq(defaultOwmer);

    await info.mortgageNFT.connect(info.degenGateOwnerWallet).transferOwnership(info.userWallet.address)
    expect(await info.mortgageNFT.owner()).eq(info.userWallet.address);
    expect(await info.mortgageNFT.owner()).not.eq(defaultOwmer);
    await info.mortgageNFT.connect(info.userWallet).transferOwnership(info.degenGateOwnerWallet.address)
  });

  it("name symbol tokenURI setMortgageNFTView", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    // create token
    let params = {
      info: {
        tid: "t1",
        tName: "a",
        cid: "b",
        cName: "b",
        followers: 123,
        omf: 2212,
      },
      wrap: {
        degenAmount: 0,
        specialPointAmount: 0
      },
      deadline: deadline,
      nftPrice: 0,
    };
    let signature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "tuple(uint256 degenAmount, uint256 specialPointAmount)",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.wrap, params.nftPrice, params.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    // createTokenWrap
    await info.degenGate.connect(info.userWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

    let paramsMultiply = {
      tid: params.info.tid,
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
      wrap: {
        degenAmount: 0,
        specialPointAmount: BigInt(10) ** BigInt(18) * BigInt(200),
      },
      deadline: deadline,
    }

    let paramsMultiplySignature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "string",
              "uint256",
              "tuple(uint256 degenAmount, uint256 specialPointAmount)",
              "uint256",
              "address",
            ],
            [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    await info.degenGate.connect(info.userWallet).multiply(
      paramsMultiply.tid,
      paramsMultiply.multiplyAmount,
      paramsMultiply.wrap,
      paramsMultiply.deadline,
      paramsMultiplySignature
    )

    expect(await info.mortgageNFT.name()).eq("degenGate Position");
    expect(await info.mortgageNFT.symbol()).eq("degenGate Position");

    const tokenInfo = parseTokenURI(await info.mortgageNFT.tokenURI(1));

    expect(tokenInfo.name).eq("degenGate Position 1");
    expect(tokenInfo.description).eq(
      "If you need to customize the display content, please use the setMortgageNFTView function in the contract to set a custom display contract.",
    );
    expect(tokenInfo.image).eq("");

    let mortgageNFTView = (await (
      await ethers.getContractFactory("MortgageNFTView")
    ).deploy(
      await info.foundry.getAddress(),
      info.appId,
      await info.mortgageNFT.getAddress(),
      await info.degenGateNFTClaim.getAddress(),
    )) as MortgageNFTView;

    await expect(
      info.mortgageNFT.setMortgageNFTView(await mortgageNFTView.getAddress())
    ).revertedWithCustomError(info.mortgageNFT, "OwnableUnauthorizedAccount")
    await info.mortgageNFT.connect(info.degenGateOwnerWallet).setMortgageNFTView(await mortgageNFTView.getAddress());

    expect(await info.mortgageNFT.name()).eq("Castle Option");
    expect(await info.mortgageNFT.symbol()).eq("CO");
    expect(await info.mortgageNFT.mortgageNFTView()).eq(await mortgageNFTView.getAddress());

    const tokenInfo2 = parseTokenURI(await info.mortgageNFT.tokenURI(1));

    expect(tokenInfo2.name).eq("@a - #1 - 100");
    expect(tokenInfo2.description).eq(
      "This NFT represents a collateral option within the Gate of Degen.\n⚠️ DISCLAIMER: Always perform due diligence before purchasing this NFT. Verify that the image reflects the correct number of option in the collateral. Refresh cached images on trading platforms to ensure you have the latest data.",
    );
    expect(tokenInfo2.image).not.eq("");
  });

  it("info tokenInfosOfOwner tokenInfosOfOwnerByTid", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    let nftOwner1 = info.wallets[info.nextWalletIndex];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 1];
    let user1Wallet = info.wallets[info.nextWalletIndex + 2];
    let bigNumber = BigInt(10) ** BigInt(18) * BigInt(1000000);

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    await info.simpleToken.transfer(info.userWallet.address, bigNumber)
    await info.simpleToken.transfer(user1Wallet.address, bigNumber)
    await info.simpleToken.connect(info.userWallet).approve(await info.appOperator.getAddress(), MaxInt256)
    await info.simpleToken.connect(user1Wallet).approve(await info.appOperator.getAddress(), MaxInt256)
    // create token
    let params1 = {
      tid: "t1",
      tData: "0x11",
      cnftOwner: info.userWallet.address,
      onftOwner: nftOwner2.address,
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
      payTokenAmountMax: BigInt(10) ** BigInt(18) * BigInt(200),
    };
    await info.appOperator.connect(info.userWallet)
      .createToken(params1.tid, params1.tData, params1.cnftOwner, params1.onftOwner);
    await info.appOperator.connect(info.userWallet).multiply(params1.tid, params1.multiplyAmount, params1.payTokenAmountMax)


    // create token
    let params2 = {
      tid: "t2",
      tData: "0x22",
      cnftOwner: info.userWallet.address,
      onftOwner: nftOwner2.address,
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
      payTokenAmountMax: BigInt(10) ** BigInt(18) * BigInt(200),
    };
    await info.appOperator.connect(info.userWallet)
      .createToken(params2.tid, params2.tData, params2.cnftOwner, params2.onftOwner);
    await info.appOperator.connect(info.userWallet).multiply(params2.tid, params2.multiplyAmount, params2.payTokenAmountMax)


    // multiply user1 t1 11
    await info.appOperator.connect(user1Wallet)
      .multiply(params1.tid, BigInt(10) ** BigInt(18) * BigInt(11), BigInt(10) ** BigInt(18) * BigInt(30))

    // multiply user1 t2 22
    await info.appOperator.connect(user1Wallet)
      .multiply(params2.tid, BigInt(10) ** BigInt(18) * BigInt(22), BigInt(10) ** BigInt(18) * BigInt(30))

    let info1 = await info.mortgageNFT.info(1);
    let info2 = await info.mortgageNFT.info(2);
    let info3 = await info.mortgageNFT.info(3);
    let info4 = await info.mortgageNFT.info(4);
    expect(info1.tid).eq(params1.tid);
    expect(info1.amount).eq(params1.multiplyAmount);

    expect(info2.tid).eq(params2.tid);
    expect(info2.amount).eq(params2.multiplyAmount);

    expect(info3.tid).eq(params1.tid);
    expect(info3.amount).eq(BigInt(10) ** BigInt(18) * BigInt(11));

    expect(info4.tid).eq(params2.tid);
    expect(info4.amount).eq(BigInt(10) ** BigInt(18) * BigInt(22));

    let infos = await info.mortgageNFT.tokenInfosOfOwner(info.userWallet.address);
    expect(infos.length).eq(2);
    expect(infos[0].tid).eq(info1.tid);
    expect(infos[1].tid).eq(info2.tid);
    expect(infos[0].amount).eq(info1.amount);
    expect(infos[1].amount).eq(info2.amount);

    let infos1 = await info.mortgageNFT.tokenInfosOfOwner(user1Wallet.address);
    expect(infos1.length).eq(2);
    expect(infos1[0].tid).eq(info3.tid);
    expect(infos1[1].tid).eq(info4.tid);
    expect(infos1[0].amount).eq(info3.amount);
    expect(infos1[1].amount).eq(info4.amount);

    let infosBy1 = await info.mortgageNFT.tokenInfosOfOwnerByTid(info.userWallet.address, params1.tid);
    expect(infosBy1.length).eq(1);
    expect(infosBy1[0].tid).eq(info1.tid);
    expect(infosBy1[0].amount).eq(info1.amount);

    let infosBy2 = await info.mortgageNFT.tokenInfosOfOwnerByTid(info.userWallet.address, params2.tid);
    expect(infosBy2.length).eq(1);
    expect(infosBy2[0].tid).eq(info2.tid);
    expect(infosBy2[0].amount).eq(info2.amount);

    let infos1By1 = await info.mortgageNFT.tokenInfosOfOwnerByTid(user1Wallet.address, params1.tid);
    expect(infos1By1.length).eq(1);
    expect(infos1By1[0].tid).eq(info3.tid);
    expect(infos1By1[0].amount).eq(info3.amount);

    let infos1By2 = await info.mortgageNFT.tokenInfosOfOwnerByTid(user1Wallet.address, params2.tid);
    expect(infos1By2.length).eq(1);
    expect(infos1By2[0].tid).eq(info4.tid);
    expect(infos1By2[0].amount).eq(info4.amount);

    // redeem 1 10
    await info.simpleToken.connect(info.userWallet).approve(await info.market.getAddress(), bigNumber)
    await info.simpleToken.connect(user1Wallet).approve(await info.market.getAddress(), bigNumber)
    await info.market
      .connect(info.userWallet)
      .redeem(1, BigInt(10) ** BigInt(18) * BigInt(10));

    // redeem 2 20
    await info.market
      .connect(info.userWallet)
      .redeem(2, BigInt(10) ** BigInt(18) * BigInt(20));

    // multiplyAdd 3 10
    await info.market
      .connect(user1Wallet)
      .multiplyAdd(3, BigInt(10) ** BigInt(18) * BigInt(10));

    // multiplyAdd 4 20
    await info.market
      .connect(user1Wallet)
      .multiplyAdd(4, BigInt(10) ** BigInt(18) * BigInt(20));

    // multiply user 5 t1 20
    await info.market
      .connect(info.userWallet)
      .multiply(params1.tid, BigInt(10) ** BigInt(18) * BigInt(20));

    // multiply user1 6 t2 30
    await info.market
      .connect(user1Wallet)
      .multiply(params2.tid, BigInt(10) ** BigInt(18) * BigInt(30));

    // multiply user 7 t2 30
    await info.market
      .connect(info.userWallet)
      .multiply(params2.tid, BigInt(10) ** BigInt(18) * BigInt(30));

    // multiply user1 8 t1 20
    await info.market
      .connect(user1Wallet)
      .multiply(params1.tid, BigInt(10) ** BigInt(18) * BigInt(20));

    // multiply user 9 t1 40
    await info.market
      .connect(info.userWallet)
      .multiply(params1.tid, BigInt(10) ** BigInt(18) * BigInt(40));

    // multiply user1 10 t2 50
    await info.market
      .connect(user1Wallet)
      .multiply(params2.tid, BigInt(10) ** BigInt(18) * BigInt(50));

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
    info1 = await info.mortgageNFT.info(1);
    info2 = await info.mortgageNFT.info(2);
    info3 = await info.mortgageNFT.info(3);
    info4 = await info.mortgageNFT.info(4);
    let info5 = await info.mortgageNFT.info(5);
    let info6 = await info.mortgageNFT.info(6);
    let info7 = await info.mortgageNFT.info(7);
    let info8 = await info.mortgageNFT.info(8);
    let info9 = await info.mortgageNFT.info(9);
    let info10 = await info.mortgageNFT.info(10);

    expect(info1.tid).eq(params1.tid);
    expect(info1.amount).eq(params1.multiplyAmount - BigInt(10) ** BigInt(18) * BigInt(10));

    expect(info2.tid).eq(params2.tid);
    expect(info2.amount).eq(params2.multiplyAmount - BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info3.tid).eq(params1.tid);
    expect(info3.amount).eq(BigInt(10) ** BigInt(18) * BigInt(11) + BigInt(10) ** BigInt(18) * BigInt(10));

    expect(info4.tid).eq(params2.tid);
    expect(info4.amount).eq(BigInt(10) ** BigInt(18) * BigInt(22) + BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info5.tid).eq(params1.tid);
    expect(info5.amount).eq(BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info6.tid).eq(params2.tid);
    expect(info6.amount).eq(BigInt(10) ** BigInt(18) * BigInt(30));

    expect(info7.tid).eq(params2.tid);
    expect(info7.amount).eq(BigInt(10) ** BigInt(18) * BigInt(30));

    expect(info8.tid).eq(params1.tid);
    expect(info8.amount).eq(BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info9.tid).eq(params1.tid);
    expect(info9.amount).eq(BigInt(10) ** BigInt(18) * BigInt(40));

    expect(info10.tid).eq(params2.tid);
    expect(info10.amount).eq(BigInt(10) ** BigInt(18) * BigInt(50));

    infos = await info.mortgageNFT.tokenInfosOfOwner(info.userWallet.address);
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

    infos1 = await info.mortgageNFT.tokenInfosOfOwner(user1Wallet.address);
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

    infosBy1 = await info.mortgageNFT.tokenInfosOfOwnerByTid(info.userWallet.address, params1.tid);
    expect(infosBy1.length).eq(3);
    expect(infosBy1[0].tid).eq(info1.tid);
    expect(infosBy1[1].tid).eq(info5.tid);
    expect(infosBy1[2].tid).eq(info9.tid);

    expect(infosBy1[0].amount).eq(info1.amount);
    expect(infosBy1[1].amount).eq(info5.amount);
    expect(infosBy1[2].amount).eq(info9.amount);

    infosBy2 = await info.mortgageNFT.tokenInfosOfOwnerByTid(info.userWallet.address, params2.tid);
    expect(infosBy2.length).eq(2);
    expect(infosBy2[0].tid).eq(info2.tid);
    expect(infosBy2[1].tid).eq(info7.tid);

    expect(infosBy2[0].amount).eq(info2.amount);
    expect(infosBy2[1].amount).eq(info7.amount);

    infos1By1 = await info.mortgageNFT.tokenInfosOfOwnerByTid(user1Wallet.address, params1.tid);
    expect(infos1By1.length).eq(2);
    expect(infos1By1[0].tid).eq(info3.tid);
    expect(infos1By1[1].tid).eq(info8.tid);

    expect(infos1By1[0].amount).eq(info3.amount);
    expect(infos1By1[1].amount).eq(info8.amount);

    infos1By2 = await info.mortgageNFT.tokenInfosOfOwnerByTid(user1Wallet.address, params2.tid);
    expect(infos1By2.length).eq(3);
    expect(infos1By2[0].tid).eq(info4.tid);
    expect(infos1By2[1].tid).eq(info6.tid);
    expect(infos1By2[2].tid).eq(info10.tid);

    expect(infos1By2[0].amount).eq(info4.amount);
    expect(infos1By2[1].amount).eq(info6.amount);
    expect(infos1By2[2].amount).eq(info10.amount);

    // user redeem 2
    await info.market.connect(info.userWallet).redeem(2, info2.amount);

    // user1 redeem 3
    await info.market.connect(user1Wallet).redeem(3, info3.amount);

    // user  redeem 5
    await info.market.connect(info.userWallet).redeem(5, info5.amount);

    // user1 redeem 6
    await info.market.connect(user1Wallet).redeem(6, info6.amount);

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
    info1 = await info.mortgageNFT.info(1);
    info2 = await info.mortgageNFT.info(2);
    info3 = await info.mortgageNFT.info(3);
    info4 = await info.mortgageNFT.info(4);
    info5 = await info.mortgageNFT.info(5);
    info6 = await info.mortgageNFT.info(6);
    info7 = await info.mortgageNFT.info(7);
    info8 = await info.mortgageNFT.info(8);
    info9 = await info.mortgageNFT.info(9);
    info10 = await info.mortgageNFT.info(10);

    expect(info1.tid).eq(params1.tid);
    expect(info1.amount).eq(params1.multiplyAmount - BigInt(10) ** BigInt(18) * BigInt(10));

    expect(info2.tid).eq("");
    expect(info2.amount).eq(0);

    expect(info3.tid).eq("");
    expect(info3.amount).eq(0);

    expect(info4.tid).eq(params2.tid);
    expect(info4.amount).eq(BigInt(10) ** BigInt(18) * BigInt(22) + BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info5.tid).eq("");
    expect(info5.amount).eq(0);

    expect(info6.tid).eq("");
    expect(info6.amount).eq(0);

    expect(info7.tid).eq(params2.tid);
    expect(info7.amount).eq(BigInt(10) ** BigInt(18) * BigInt(30));

    expect(info8.tid).eq(params1.tid);
    expect(info8.amount).eq(BigInt(10) ** BigInt(18) * BigInt(20));

    expect(info9.tid).eq(params1.tid);
    expect(info9.amount).eq(BigInt(10) ** BigInt(18) * BigInt(40));

    expect(info10.tid).eq(params2.tid);
    expect(info10.amount).eq(BigInt(10) ** BigInt(18) * BigInt(50));

    infos = await info.mortgageNFT.tokenInfosOfOwner(info.userWallet.address);
    expect(infos.length).eq(3);
    expect(infos[0].tid).eq(info1.tid);
    expect(infos[1].tid).eq(info9.tid);
    expect(infos[2].tid).eq(info7.tid);

    expect(infos[0].amount).eq(info1.amount);
    expect(infos[1].amount).eq(info9.amount);
    expect(infos[2].amount).eq(info7.amount);

    infos1 = await info.mortgageNFT.tokenInfosOfOwner(user1Wallet.address);
    expect(infos1.length).eq(3);

    expect(infos1[0].tid).eq(info10.tid);
    expect(infos1[1].tid).eq(info4.tid);
    expect(infos1[2].tid).eq(info8.tid);

    expect(infos1[0].amount).eq(info10.amount);
    expect(infos1[1].amount).eq(info4.amount);
    expect(infos1[2].amount).eq(info8.amount);

    infosBy1 = await info.mortgageNFT.tokenInfosOfOwnerByTid(info.userWallet.address, params1.tid);
    expect(infosBy1.length).eq(2);
    expect(infosBy1[0].tid).eq(info1.tid);
    expect(infosBy1[1].tid).eq(info9.tid);

    expect(infosBy1[0].amount).eq(info1.amount);
    expect(infosBy1[1].amount).eq(info9.amount);

    infosBy2 = await info.mortgageNFT.tokenInfosOfOwnerByTid(info.userWallet.address, params2.tid);
    expect(infosBy2.length).eq(1);
    expect(infosBy2[0].tid).eq(info7.tid);
    expect(infosBy2[0].amount).eq(info7.amount);

    infos1By1 = await info.mortgageNFT.tokenInfosOfOwnerByTid(user1Wallet.address, params1.tid);
    expect(infos1By1.length).eq(1);

    expect(infos1By1[0].tid).eq(info8.tid);
    expect(infos1By1[0].amount).eq(info8.amount);

    infos1By2 = await info.mortgageNFT.tokenInfosOfOwnerByTid(user1Wallet.address, params2.tid);
    expect(infos1By2.length).eq(2);

    expect(infos1By2[0].tid).eq(info10.tid);
    expect(infos1By2[1].tid).eq(info4.tid);

    expect(infos1By2[0].amount).eq(info10.amount);
    expect(infos1By2[1].amount).eq(info4.amount);

    // empty
    expect((await info.mortgageNFT.info(20)).amount).eq(0);
    expect((await info.mortgageNFT.info(20)).tid).eq("");

    let infosEmpty = await info.mortgageNFT.tokenInfosOfOwner(nftOwner1.address);
    expect(infosEmpty.length).eq(0);

    let infosByTidEmtpy1 = await info.mortgageNFT.tokenInfosOfOwnerByTid(info.userWallet.address, "t3");
    expect(infosByTidEmtpy1.length).eq(0);

    let infos1ByTidEmtpy2 = await info.mortgageNFT.tokenInfosOfOwnerByTid(nftOwner1.address, params1.tid);
    expect(infos1ByTidEmtpy2.length).eq(0);
  });

  it("isApprovedOrOwner", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    let nftOwner1 = info.wallets[info.nextWalletIndex];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 1];
    let user1Wallet = info.wallets[info.nextWalletIndex + 2];

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    // create token
    let params = {
      info: {
        tid: "t1",
        tName: "a",
        cid: "b",
        cName: "b",
        followers: 123,
        omf: 2212,
      },
      wrap: {
        degenAmount: 0,
        specialPointAmount: 0
      },
      deadline: deadline,
      nftPrice: 0,
    };
    let signature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "tuple(uint256 degenAmount, uint256 specialPointAmount)",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.wrap, params.nftPrice, params.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    // createTokenWrap
    await info.degenGate.connect(info.userWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

    let paramsMultiply = {
      tid: params.info.tid,
      multiplyAmount: 100,
      wrap: {
        degenAmount: 0,
        specialPointAmount: 200
      },
      deadline: deadline,
    }

    let paramsMultiplySignature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "string",
              "uint256",
              "tuple(uint256 degenAmount, uint256 specialPointAmount)",
              "uint256",
              "address",
            ],
            [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    await info.degenGate.connect(info.userWallet).multiply(
      paramsMultiply.tid,
      paramsMultiply.multiplyAmount,
      paramsMultiply.wrap,
      paramsMultiply.deadline,
      paramsMultiplySignature
    )

    expect(await info.mortgageNFT.ownerOf(1)).eq(info.userWallet.address);

    expect(await info.mortgageNFT.getApproved(1)).eq(ZERO_ADDRESS);
    expect(await info.mortgageNFT.isApprovedForAll(info.userWallet.address, info.deployWallet.address)).eq(false);
    expect(await info.mortgageNFT.isApprovedForAll(user1Wallet.address, info.deployWallet.address)).eq(false);

    expect(await info.mortgageNFT.isApprovedOrOwner(info.userWallet.address, 1)).eq(true);
    expect(await info.mortgageNFT.isApprovedOrOwner(info.deployWallet.address, 1)).eq(false);
    expect(await info.mortgageNFT.isApprovedOrOwner(user1Wallet.address, 1)).eq(false);

    await info.mortgageNFT.connect(info.userWallet).approve(user1Wallet.address, 1);

    expect(await info.mortgageNFT.isApprovedOrOwner(info.userWallet.address, 1)).eq(true);
    expect(await info.mortgageNFT.isApprovedOrOwner(info.deployWallet.address, 1)).eq(false);
    expect(await info.mortgageNFT.isApprovedOrOwner(user1Wallet.address, 1)).eq(true);

    await info.mortgageNFT.connect(info.userWallet).setApprovalForAll(info.deployWallet.address, true);

    expect(await info.mortgageNFT.isApprovedOrOwner(info.userWallet.address, 1)).eq(true);
    expect(await info.mortgageNFT.isApprovedOrOwner(info.deployWallet.address, 1)).eq(true);
    expect(await info.mortgageNFT.isApprovedOrOwner(user1Wallet.address, 1)).eq(true);
  });

  it("initialize add burn mint remove", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    await expect(info.mortgageNFT.initialize(await info.market.getAddress())).revertedWith("onlyFoundry");

    await expect(info.mortgageNFT.add(1, 1)).revertedWith("onlyMarket");

    await expect(info.mortgageNFT.burn(1)).revertedWith("onlyMarket");

    await expect(info.mortgageNFT.mint(info.deployWallet.address, "t1", 1)).revertedWith("onlyMarket");

    await expect(info.mortgageNFT.remove(1, 1)).revertedWith("onlyMarket");
  });

  it("transferFrom zero_address", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    let nftOwner1 = info.wallets[info.nextWalletIndex];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 1];

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;


    // create token
    let params = {
      info: {
        tid: "t1",
        tName: "a",
        cid: "b",
        cName: "b",
        followers: 123,
        omf: 2212,
      },
      wrap: {
        degenAmount: 0,
        specialPointAmount: 0
      },
      deadline: deadline,
      nftPrice: 0,
    };
    let signature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "tuple(uint256 degenAmount, uint256 specialPointAmount)",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.wrap, params.nftPrice, params.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    // createTokenWrap
    await info.degenGate.connect(info.userWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

    let paramsMultiply = {
      tid: params.info.tid,
      multiplyAmount: 100,
      wrap: {
        degenAmount: 0,
        specialPointAmount: 200
      },
      deadline: deadline,
    }

    let paramsMultiplySignature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "string",
              "uint256",
              "tuple(uint256 degenAmount, uint256 specialPointAmount)",
              "uint256",
              "address",
            ],
            [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    await info.degenGate.connect(info.userWallet).multiply(
      paramsMultiply.tid,
      paramsMultiply.multiplyAmount,
      paramsMultiply.wrap,
      paramsMultiply.deadline,
      paramsMultiplySignature
    )

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
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    await expect(info.publicNFT.ownerOf(1)).revertedWithCustomError(info.publicNFT, "ERC721NonexistentToken")
    await expect(info.publicNFT.ownerOf(2)).revertedWithCustomError(info.publicNFT, "ERC721NonexistentToken")

    // create token
    let params = {
      tid: "t1",
      tData: "0x11",
      cnftOwner: info.userWallet.address,
      onftOwner: info.deployWallet.address,
    };
    await info.appOperator.connect(info.userWallet)
      .createToken(params.tid, params.tData, params.cnftOwner, params.onftOwner);

    expect(await info.publicNFT.ownerOf(1)).eq(info.userWallet.address);
    expect(await info.publicNFT.ownerOf(2)).eq(info.deployWallet.address);

    await info.simpleToken.transfer(info.userWallet, getTokenAmountWei(10000000));
    await info.simpleToken.connect(info.userWallet).approve(await info.market.getAddress(), MaxInt256)
    await info.market
      .connect(info.userWallet)
      .buy(params.tid, getTokenAmountWei(10000));

    for (let i = 1; i <= 100; i++) {
      expect(await info.mortgageNFT.totalSupply()).eq(i - 1);
      await expect(info.mortgageNFT.ownerOf(i)).revertedWithCustomError(info.mortgageNFT, "ERC721NonexistentToken")

      let tInfo = await info.mortgageNFT.info(i);
      expect(tInfo.tid).eq("");
      expect(tInfo.amount).eq(0);

      let n = i % 3;

      let count = getTokenAmountWei(101 - i);

      if (n == 1) {
        await info.market.connect(info.userWallet).mortgage(params.tid, count);
      } else if (n == 2) {
        await info.market
          .connect(info.userWallet)
          .multiply(params.tid, count);
      } else if (n == 0) {
        await info.market.connect(info.userWallet).split(i - 1, count);
      }

      expect(await info.mortgageNFT.totalSupply()).eq(i);
      expect(await info.mortgageNFT.ownerOf(i)).eq(info.userWallet.address);

      tInfo = await info.mortgageNFT.info(i);
      expect(tInfo.tid).eq(params.tid + "");
      expect(tInfo.amount).eq(count);
    }
  });
});
