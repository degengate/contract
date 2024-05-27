import { ZERO_ADDRESS, deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { parseTokenURI } from "./shared/utils";
import { ethers } from "hardhat";
import { PublicNFT, PublicNFTView, PublicNFTViewBG } from "../typechain-types";
import { MaxInt256 } from "ethers";

describe("PublicNFT", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    expect(await info.publicNFT.appId()).eq(info.appId);
    expect(await info.publicNFT.foundry()).eq(await info.foundry.getAddress());
    expect(await info.publicNFT.publicNFTView()).eq(ZERO_ADDRESS);
  });

  it("default owner", async function () {
    const info = (await loadFixture(deployAllContracts)).appOperatorAllContractInfo;

    let defaultOwmer = (await info.foundry.apps(info.appId)).owner
    expect(info.appOperatorOwnerWallet.address).eq(defaultOwmer)

    expect(await info.publicNFT.owner()).eq(defaultOwmer);

    await info.publicNFT.connect(info.appOperatorOwnerWallet).transferOwnership(info.userWallet.address)
    expect(await info.publicNFT.owner()).eq(info.userWallet.address);
    expect(await info.publicNFT.owner()).not.eq(defaultOwmer);
    await info.publicNFT.connect(info.userWallet).transferOwnership(info.appOperatorOwnerWallet.address)
  });

  it("name symbol tokenURI setPublicNFTView", async function () {
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
        specialBegenAmount: 0
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
              "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
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
        specialBegenAmount: 200
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
              "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
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

    expect(await info.publicNFT.name()).eq("degenGate Tax");
    expect(await info.publicNFT.symbol()).eq("degenGate Tax");

    const tokenInfo = parseTokenURI(await info.publicNFT.tokenURI(1));

    expect(tokenInfo.name).eq("degenGate Tax 1");
    expect(tokenInfo.description).eq(
      "If you need to customize the display content, please use the setPublicNFTView function in the contract to set a custom display contract.",
    );
    expect(tokenInfo.image).eq("");

    let publicNFTViewBG = (await (
      await ethers.getContractFactory("PublicNFTViewBG")
    ).deploy()) as PublicNFTViewBG;

    let publicNFTView = (await (
      await ethers.getContractFactory("PublicNFTView")
    ).deploy(
      await info.foundry.getAddress(),
      info.appId,
      await info.publicNFT.getAddress(),
      await info.degenGateNFTClaim.getAddress(),
      await publicNFTViewBG.getAddress()
    )) as PublicNFTView;

    await expect(info.publicNFT.setPublicNFTView(await publicNFTView.getAddress())).revertedWithCustomError(info.publicNFT, "OwnableUnauthorizedAccount")
    await info.publicNFT.connect(info.degenGateOwnerWallet).setPublicNFTView(await publicNFTView.getAddress());

    expect(await info.publicNFT.name()).eq("Gate of Degen");
    expect(await info.publicNFT.symbol()).eq("GOD");
    expect(await info.publicNFT.publicNFTView()).eq(await publicNFTView.getAddress());

    const tokenInfo2 = parseTokenURI(await info.publicNFT.tokenURI(1));
    expect(tokenInfo2.name).eq("@a - Key");
    expect(tokenInfo2.description).eq(
      "The Keyholder to receive 100% of the total castle tax from @a's trades. Once @a takes over the castle, the Keyholder will then receive 5%.",
    );
    expect(tokenInfo2.image).not.eq("");

    const tokenInfo3 = parseTokenURI(await info.publicNFT.tokenURI(2));
    expect(tokenInfo3.name).eq("@a - Lord");
    expect(tokenInfo3.description).eq(
      "This lord holder to receive 95% of the total castle tax from @a's trades once @a takes over the castle.",
    );
    expect(tokenInfo3.image).not.eq("");
  });

  it("tidToInfos tidToTokenIds tokenIdToInfo", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    let nftOwner1 = info.wallets[info.nextWalletIndex];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 1];
    let nftOwner3 = info.wallets[info.nextWalletIndex + 2];
    let nftOwner4 = info.wallets[info.nextWalletIndex + 3];
    let newAppOperatorWallet = info.wallets[info.nextWalletIndex + 4];
    let nftOwner11 = info.wallets[info.nextWalletIndex + 5];
    let nftOwner44 = info.wallets[info.nextWalletIndex + 6];

    // create app
    let app2OwnerWallet = info.wallets[info.nextWalletIndex + 7];
    let app2OperatorWallet = info.wallets[info.nextWalletIndex + 8];

    await info.foundry.createApp(
      "app2",
      app2OwnerWallet.address,
      app2OperatorWallet.address,
      await info.curve.getAddress(),
      ZERO_ADDRESS,
      info.buyFee,
      info.sellFee,
    );

    let appId_2 = info.appId + 1;
    let publicNFT_2 = (await ethers.getContractAt("PublicNFT", (await info.foundry.apps(appId_2)).publicNFT)) as PublicNFT;


    let params = {
      tid: "t1",
      tData: "0x11",
      nftPercents: [5000, 95000],
      nftOwers: [nftOwner1.address, nftOwner2.address],
      nftData: ["0x22", "0x33"],
    };
    await info.foundry
      .connect(app2OperatorWallet)
      .createToken(appId_2, params.tid, params.tData, params.nftPercents, params.nftOwers, params.nftData);

    let params2 = {
      tid: "t2",
      tData: "0x44",
      nftPercents: [4000, 96000],
      nftOwers: [nftOwner3.address, nftOwner4.address],
      nftData: ["0x55", "0x66"],
    };
    await info.foundry
      .connect(app2OperatorWallet)
      .createToken(appId_2, params2.tid, params2.tData, params2.nftPercents, params2.nftOwers, params2.nftData);

    // tokenIdToInfo
    let info1 = await publicNFT_2.tokenIdToInfo(1);
    let info2 = await publicNFT_2.tokenIdToInfo(2);
    let info3 = await publicNFT_2.tokenIdToInfo(3);
    let info4 = await publicNFT_2.tokenIdToInfo(4);

    expect(info1.tid).eq(params.tid);
    expect(info1.percent).eq(params.nftPercents[0]);
    expect(info1.data).eq(params.nftData[0]);
    expect(info1._owner).eq(nftOwner1.address);

    expect(info2.tid).eq(params.tid);
    expect(info2.percent).eq(params.nftPercents[1]);
    expect(info2.data).eq(params.nftData[1]);
    expect(info2._owner).eq(nftOwner2.address);

    expect(info3.tid).eq(params2.tid);
    expect(info3.percent).eq(params2.nftPercents[0]);
    expect(info3.data).eq(params2.nftData[0]);
    expect(info3._owner).eq(nftOwner3.address);

    expect(info4.tid).eq(params2.tid);
    expect(info4.percent).eq(params2.nftPercents[1]);
    expect(info4.data).eq(params2.nftData[1]);
    expect(info4._owner).eq(nftOwner4.address);

    // tidToTokenIds
    let tidToTokenIds1 = await publicNFT_2.tidToTokenIds(params.tid);
    let tidToTokenIds2 = await publicNFT_2.tidToTokenIds(params2.tid);

    expect(tidToTokenIds1.length).eq(2);
    expect(tidToTokenIds1[0]).eq(1);
    expect(tidToTokenIds1[1]).eq(2);

    expect(tidToTokenIds2.length).eq(2);
    expect(tidToTokenIds2[0]).eq(3);
    expect(tidToTokenIds2[1]).eq(4);

    // tidToInfos
    let tidToInfos1 = await publicNFT_2.tidToInfos(params.tid);
    let tidToInfos2 = await publicNFT_2.tidToInfos(params2.tid);

    expect(tidToInfos1.tokenIds.length).eq(2);
    expect(tidToInfos1.tokenIds[0]).eq(1);
    expect(tidToInfos1.tokenIds[1]).eq(2);

    expect(tidToInfos1.percents.length).eq(2);
    expect(tidToInfos1.percents[0]).eq(params.nftPercents[0]);
    expect(tidToInfos1.percents[1]).eq(params.nftPercents[1]);

    expect(tidToInfos1.data.length).eq(2);
    expect(tidToInfos1.data[0]).eq(params.nftData[0]);
    expect(tidToInfos1.data[1]).eq(params.nftData[1]);

    expect(tidToInfos1.owners.length).eq(2);
    expect(tidToInfos1.owners[0]).eq(nftOwner1.address);
    expect(tidToInfos1.owners[1]).eq(nftOwner2.address);

    expect(tidToInfos2.tokenIds.length).eq(2);
    expect(tidToInfos2.tokenIds[0]).eq(3);
    expect(tidToInfos2.tokenIds[1]).eq(4);

    expect(tidToInfos2.percents.length).eq(2);
    expect(tidToInfos2.percents[0]).eq(params2.nftPercents[0]);
    expect(tidToInfos2.percents[1]).eq(params2.nftPercents[1]);

    expect(tidToInfos2.data.length).eq(2);
    expect(tidToInfos2.data[0]).eq(params2.nftData[0]);
    expect(tidToInfos2.data[1]).eq(params2.nftData[1]);

    expect(tidToInfos2.owners.length).eq(2);
    expect(tidToInfos2.owners[0]).eq(nftOwner3.address);
    expect(tidToInfos2.owners[1]).eq(nftOwner4.address);

    await publicNFT_2.connect(nftOwner1).transferFrom(nftOwner1.address, nftOwner11.address, 1);
    await publicNFT_2.connect(nftOwner4).transferFrom(nftOwner4.address, nftOwner44.address, 4);

    expect(await publicNFT_2.ownerOf(1)).eq(nftOwner11.address);
    expect(await publicNFT_2.ownerOf(4)).eq(nftOwner44.address);

    // tokenIdToInfo
    info1 = await publicNFT_2.tokenIdToInfo(1);
    info2 = await publicNFT_2.tokenIdToInfo(2);
    info3 = await publicNFT_2.tokenIdToInfo(3);
    info4 = await publicNFT_2.tokenIdToInfo(4);

    expect(info1.tid).eq(params.tid);
    expect(info1.percent).eq(params.nftPercents[0]);
    expect(info1.data).eq(params.nftData[0]);
    expect(info1._owner).eq(nftOwner11.address);

    expect(info2.tid).eq(params.tid);
    expect(info2.percent).eq(params.nftPercents[1]);
    expect(info2.data).eq(params.nftData[1]);
    expect(info2._owner).eq(nftOwner2.address);

    expect(info3.tid).eq(params2.tid);
    expect(info3.percent).eq(params2.nftPercents[0]);
    expect(info3.data).eq(params2.nftData[0]);
    expect(info3._owner).eq(nftOwner3.address);

    expect(info4.tid).eq(params2.tid);
    expect(info4.percent).eq(params2.nftPercents[1]);
    expect(info4.data).eq(params2.nftData[1]);
    expect(info4._owner).eq(nftOwner44.address);

    // tidToTokenIds
    tidToTokenIds1 = await publicNFT_2.tidToTokenIds(params.tid);
    tidToTokenIds2 = await publicNFT_2.tidToTokenIds(params2.tid);

    expect(tidToTokenIds1.length).eq(2);
    expect(tidToTokenIds1[0]).eq(1);
    expect(tidToTokenIds1[1]).eq(2);

    expect(tidToTokenIds2.length).eq(2);
    expect(tidToTokenIds2[0]).eq(3);
    expect(tidToTokenIds2[1]).eq(4);

    // tidToInfos
    tidToInfos1 = await publicNFT_2.tidToInfos(params.tid);
    tidToInfos2 = await publicNFT_2.tidToInfos(params2.tid);

    expect(tidToInfos1.tokenIds.length).eq(2);
    expect(tidToInfos1.tokenIds[0]).eq(1);
    expect(tidToInfos1.tokenIds[1]).eq(2);

    expect(tidToInfos1.percents.length).eq(2);
    expect(tidToInfos1.percents[0]).eq(params.nftPercents[0]);
    expect(tidToInfos1.percents[1]).eq(params.nftPercents[1]);

    expect(tidToInfos1.data.length).eq(2);
    expect(tidToInfos1.data[0]).eq(params.nftData[0]);
    expect(tidToInfos1.data[1]).eq(params.nftData[1]);

    expect(tidToInfos1.owners.length).eq(2);
    expect(tidToInfos1.owners[0]).eq(nftOwner11.address);
    expect(tidToInfos1.owners[1]).eq(nftOwner2.address);

    expect(tidToInfos2.tokenIds.length).eq(2);
    expect(tidToInfos2.tokenIds[0]).eq(3);
    expect(tidToInfos2.tokenIds[1]).eq(4);

    expect(tidToInfos2.percents.length).eq(2);
    expect(tidToInfos2.percents[0]).eq(params2.nftPercents[0]);
    expect(tidToInfos2.percents[1]).eq(params2.nftPercents[1]);

    expect(tidToInfos2.data.length).eq(2);
    expect(tidToInfos2.data[0]).eq(params2.nftData[0]);
    expect(tidToInfos2.data[1]).eq(params2.nftData[1]);

    expect(tidToInfos2.owners.length).eq(2);
    expect(tidToInfos2.owners[0]).eq(nftOwner3.address);
    expect(tidToInfos2.owners[1]).eq(nftOwner44.address);

    // tokenIdToInfo empty
    await expect(publicNFT_2.tokenIdToInfo(5)).revertedWithCustomError(publicNFT_2, "ERC721NonexistentToken")

    // tidToTokenIds empty
    let tidToTokenIds3 = await publicNFT_2.tidToTokenIds("t3");
    expect(tidToTokenIds3.length).eq(0);

    // tidToInfos empty
    let tidToInfos3 = await publicNFT_2.tidToInfos("t3");

    expect(tidToInfos3.tokenIds.length).eq(0);
    expect(tidToInfos3.percents.length).eq(0);
    expect(tidToInfos3.data.length).eq(0);
    expect(tidToInfos3.owners.length).eq(0);
  });

  it("mint", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    let nftOwner1 = info.wallets[info.nextWalletIndex];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 1];

    await expect(info.publicNFT.mint("t1", [5000, 95000], [nftOwner1, nftOwner2], ["0x", "0x"])).revertedWith(
      "onlyFoundry",
    );
  });

  it("transferFrom zero_address", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    let nftOwner1 = info.wallets[info.nextWalletIndex];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 1];
    let nftOwner11 = info.wallets[info.nextWalletIndex + 2];
    let nftOwner22 = info.wallets[info.nextWalletIndex + 3];

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
        specialBegenAmount: 0
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
              "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
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
        specialBegenAmount: 200
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
              "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
              "uint256",
              "address",
            ],
            [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    await info.degenGate.connect(info.userWallet).multiply.staticCall(
      paramsMultiply.tid,
      paramsMultiply.multiplyAmount,
      paramsMultiply.wrap,
      paramsMultiply.deadline,
      paramsMultiplySignature
    )
    expect(await info.publicNFT.ownerOf(1)).eq(info.userWallet.address);

    await expect(
      info.publicNFT.connect(info.userWallet).transferFrom(info.userWallet.address, ZERO_ADDRESS, 1),
    ).revertedWithCustomError(info.publicNFT, "ERC721InvalidReceiver");

    await expect(
      info.publicNFT
        .connect(info.userWallet)
      ["safeTransferFrom(address,address,uint256)"](info.userWallet.address, ZERO_ADDRESS, 1),
    ).revertedWithCustomError(info.publicNFT, "ERC721InvalidReceiver");

    await expect(
      info.publicNFT
        .connect(info.userWallet)
      ["safeTransferFrom(address,address,uint256,bytes)"](info.userWallet.address, ZERO_ADDRESS, 1, "0x"),
    ).revertedWithCustomError(info.publicNFT, "ERC721InvalidReceiver");

    await info.publicNFT.connect(info.userWallet).transferFrom(info.userWallet.address, nftOwner11.address, 1);
    expect(await info.publicNFT.ownerOf(1)).eq(nftOwner11.address);

    await info.publicNFT
      .connect(nftOwner11)
    ["safeTransferFrom(address,address,uint256)"](nftOwner11.address, nftOwner22.address, 1);
    expect(await info.publicNFT.ownerOf(1)).eq(nftOwner22.address);

    await info.publicNFT
      .connect(nftOwner22)
    ["safeTransferFrom(address,address,uint256,bytes)"](nftOwner22.address, info.userWallet.address, 1, "0x");
    expect(await info.publicNFT.ownerOf(1)).eq(info.userWallet.address);
  });
});
