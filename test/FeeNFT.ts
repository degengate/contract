import { ZERO_ADDRESS, deployAllContracts } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { parseTokenURI } from "./shared/utils";
import { ethers } from "hardhat";
import { FeeNFT, XMemeFeeNFTView } from "../typechain-types";

const nft_name = "X-meme Tax"
const nft_symbol = "XMT"

function get_nft_json_name(tid: string) {
  return `X ID: ${tid}`;
}

function get_nft_json_desc(tid: string) {
  return `A tradable NFT that grants the holder 1% ownership of trade fees from X ID: ${tid} as a certificate. X ID holder can claim this NFT anytime. If claimed, it directly transfers to the X ID holder's wallet; else as protocol fees.`
}

describe("FeeNFT", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts));

    expect(await info.xMemeAllContractInfo.feeNFT.appId()).eq(info.xMemeAllContractInfo.appId);
    expect(await info.xMemeAllContractInfo.feeNFT.foundry()).eq(await info.coreContractInfo.foundry.getAddress());
    expect(await info.xMemeAllContractInfo.feeNFT.feeNFTView()).eq(ZERO_ADDRESS);
  });

  it("default owner", async function () {
    const info = (await loadFixture(deployAllContracts));

    let defaultOwmer = (await info.coreContractInfo.foundry.apps(info.xMemeAllContractInfo.appId)).owner
    expect(info.xMemeAllContractInfo.appOwnerWallet.address).eq(defaultOwmer)

    expect(await info.xMemeAllContractInfo.feeNFT.owner()).eq(defaultOwmer);

    let user = info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex]

    await info.xMemeAllContractInfo.feeNFT.connect(info.xMemeAllContractInfo.appOwnerWallet).transferOwnership(user.address)
    expect(await info.xMemeAllContractInfo.feeNFT.owner()).eq(user.address);
    expect(await info.xMemeAllContractInfo.feeNFT.owner()).not.eq(defaultOwmer);
  });

  it("name symbol tokenURI setFeeNFTView", async function () {
    const info = (await loadFixture(deployAllContracts)).xMemeAllContractInfo;

    await info.xMeme.setSystemReady(true)

    let tid = "t1";
    let multiplyAmount = 100;

    await info.xMeme.connect(info.userWallet).createTokenAndMultiply(tid, multiplyAmount, { value: BigInt(10) ** BigInt(20) });

    expect(await info.feeNFT.name()).eq("XMeme Tax");
    expect(await info.feeNFT.symbol()).eq("XMeme Tax");

    const tokenInfo = parseTokenURI(await info.feeNFT.tokenURI(1));

    expect(tokenInfo.name).eq("XMeme Tax 1");
    expect(tokenInfo.description).eq(
      "If you need to customize the display content, please use the setFeeNFTView function in the contract to set a custom display contract.",
    );
    expect(tokenInfo.image).eq("");

    let nftView = (await (
      await ethers.getContractFactory("XMemeFeeNFTView")
    ).deploy(
      await info.feeNFT.getAddress()
    )) as XMemeFeeNFTView;

    await expect(info.feeNFT.setFeeNFTView(await nftView.getAddress())).revertedWithCustomError(info.feeNFT, "OwnableUnauthorizedAccount")
    await info.feeNFT.connect(info.appOwnerWallet).setFeeNFTView(await nftView.getAddress());

    expect(await info.feeNFT.name()).eq(nft_name);
    expect(await info.feeNFT.symbol()).eq(nft_symbol);
    expect(await info.feeNFT.feeNFTView()).eq(await nftView.getAddress());

    const tokenInfo2 = parseTokenURI(await info.feeNFT.tokenURI(1));
    expect(tokenInfo2.name).eq(get_nft_json_name(tid));
    expect(tokenInfo2.description).eq(get_nft_json_desc(tid));
    expect(tokenInfo2.image).not.eq("");
  });

  it("tidToInfos tidToTokenIds tokenIdToInfo", async function () {
    const info = (await loadFixture(deployAllContracts))
    const coreInfo = info.coreContractInfo;
    const xMemeinfo = info.xMemeAllContractInfo;

    let nftOwner1 = xMemeinfo.wallets[xMemeinfo.nextWalletIndex];
    let nftOwner2 = xMemeinfo.wallets[xMemeinfo.nextWalletIndex + 1];
    let nftOwner3 = xMemeinfo.wallets[xMemeinfo.nextWalletIndex + 2];
    let nftOwner4 = xMemeinfo.wallets[xMemeinfo.nextWalletIndex + 3];
    let newAppOperatorWallet = xMemeinfo.wallets[xMemeinfo.nextWalletIndex + 4];
    let nftOwner11 = xMemeinfo.wallets[xMemeinfo.nextWalletIndex + 5];
    let nftOwner44 = xMemeinfo.wallets[xMemeinfo.nextWalletIndex + 6];

    // create app
    let app2OwnerWallet = xMemeinfo.wallets[xMemeinfo.nextWalletIndex + 7];
    let app2OperatorWallet = xMemeinfo.wallets[xMemeinfo.nextWalletIndex + 8];

    let curveParams = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256"],
      [BigInt(10) ** BigInt(20), BigInt(10) ** BigInt(24)]
    )

    let app2_fees = {
      appOwnerBuyFee: 200,
      appOwnerSellFee: 300,
      appOwnerMortgageFee: 400,
      appOwnerFeeRecipient: info.xMemeAllContractInfo.wallets[info.xMemeAllContractInfo.nextWalletIndex + 9],
      nftOwnerBuyFee: 500,
      nftOwnerSellFee: 600,
    }

    let app2_id = await coreInfo.foundry.nextAppId();

    await coreInfo.foundry.createApp(
      "app2",
      app2OwnerWallet.address,
      coreInfo.cpfCurveFactory.getAddress(),
      curveParams,
      ZERO_ADDRESS,
      app2_fees
    );
    await coreInfo.foundry.connect(app2OwnerWallet).setAppOperator(app2_id, app2OperatorWallet.address);

    let feeNFT_2 = (await ethers.getContractAt("FeeNFT", (await coreInfo.foundry.apps(app2_id)).feeNFT)) as FeeNFT;


    let params = {
      tid: "t1",
      tData: "0x11",
      nftPercents: [5000, 95000],
      nftOwers: [nftOwner1.address, nftOwner2.address],
      nftData: ["0x22", "0x33"],
    };
    await coreInfo.foundry
      .connect(app2OperatorWallet)
      .createToken(app2_id, params.tid, params.tData, params.nftPercents, params.nftOwers, params.nftData);

    let params2 = {
      tid: "t2",
      tData: "0x44",
      nftPercents: [4000, 96000],
      nftOwers: [nftOwner3.address, nftOwner4.address],
      nftData: ["0x55", "0x66"],
    };
    await coreInfo.foundry
      .connect(app2OperatorWallet)
      .createToken(app2_id, params2.tid, params2.tData, params2.nftPercents, params2.nftOwers, params2.nftData);

    // tokenIdToInfo
    let info1 = await feeNFT_2.tokenIdToInfo(1);
    let info2 = await feeNFT_2.tokenIdToInfo(2);
    let info3 = await feeNFT_2.tokenIdToInfo(3);
    let info4 = await feeNFT_2.tokenIdToInfo(4);

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
    let tidToTokenIds1 = await feeNFT_2.tidToTokenIds(params.tid);
    let tidToTokenIds2 = await feeNFT_2.tidToTokenIds(params2.tid);

    expect(tidToTokenIds1.length).eq(2);
    expect(tidToTokenIds1[0]).eq(1);
    expect(tidToTokenIds1[1]).eq(2);

    expect(tidToTokenIds2.length).eq(2);
    expect(tidToTokenIds2[0]).eq(3);
    expect(tidToTokenIds2[1]).eq(4);

    // tidToInfos
    let tidToInfos1 = await feeNFT_2.tidToInfos(params.tid);
    let tidToInfos2 = await feeNFT_2.tidToInfos(params2.tid);

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

    await feeNFT_2.connect(nftOwner1).transferFrom(nftOwner1.address, nftOwner11.address, 1);
    await feeNFT_2.connect(nftOwner4).transferFrom(nftOwner4.address, nftOwner44.address, 4);

    expect(await feeNFT_2.ownerOf(1)).eq(nftOwner11.address);
    expect(await feeNFT_2.ownerOf(4)).eq(nftOwner44.address);

    // tokenIdToInfo
    info1 = await feeNFT_2.tokenIdToInfo(1);
    info2 = await feeNFT_2.tokenIdToInfo(2);
    info3 = await feeNFT_2.tokenIdToInfo(3);
    info4 = await feeNFT_2.tokenIdToInfo(4);

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
    tidToTokenIds1 = await feeNFT_2.tidToTokenIds(params.tid);
    tidToTokenIds2 = await feeNFT_2.tidToTokenIds(params2.tid);

    expect(tidToTokenIds1.length).eq(2);
    expect(tidToTokenIds1[0]).eq(1);
    expect(tidToTokenIds1[1]).eq(2);

    expect(tidToTokenIds2.length).eq(2);
    expect(tidToTokenIds2[0]).eq(3);
    expect(tidToTokenIds2[1]).eq(4);

    // tidToInfos
    tidToInfos1 = await feeNFT_2.tidToInfos(params.tid);
    tidToInfos2 = await feeNFT_2.tidToInfos(params2.tid);

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
    await expect(feeNFT_2.tokenIdToInfo(5)).revertedWithCustomError(feeNFT_2, "ERC721NonexistentToken")

    // tidToTokenIds empty
    let tidToTokenIds3 = await feeNFT_2.tidToTokenIds("t3");
    expect(tidToTokenIds3.length).eq(0);

    // tidToInfos empty
    let tidToInfos3 = await feeNFT_2.tidToInfos("t3");

    expect(tidToInfos3.tokenIds.length).eq(0);
    expect(tidToInfos3.percents.length).eq(0);
    expect(tidToInfos3.data.length).eq(0);
    expect(tidToInfos3.owners.length).eq(0);
  });

  it("mint", async function () {
    const info = (await loadFixture(deployAllContracts))
    const coreInfo = info.coreContractInfo;
    const xMemeinfo = info.xMemeAllContractInfo;

    let nftOwner1 = xMemeinfo.wallets[xMemeinfo.nextWalletIndex];
    let nftOwner2 = xMemeinfo.wallets[xMemeinfo.nextWalletIndex + 1];

    await expect(xMemeinfo.feeNFT.mint("t1", [5000, 95000], [nftOwner1, nftOwner2], ["0x", "0x"])).revertedWith(
      "onlyFoundry",
    );
  });

  it("transferFrom zero_address", async function () {
    const info = (await loadFixture(deployAllContracts))

    const coreInfo = info.coreContractInfo;
    const xMemeInfo = info.xMemeAllContractInfo;

    let nftOwner1 = xMemeInfo.wallets[xMemeInfo.nextWalletIndex];
    let nftOwner2 = xMemeInfo.wallets[xMemeInfo.nextWalletIndex + 1];
    let nftOwner11 = xMemeInfo.wallets[xMemeInfo.nextWalletIndex + 2];
    let nftOwner22 = xMemeInfo.wallets[xMemeInfo.nextWalletIndex + 3];

    await xMemeInfo.xMeme.setSystemReady(true)

    const tid = "1"

    let signature = await xMemeInfo.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "string",
              "address",
            ],
            [tid, await xMemeInfo.userWallet.getAddress()],
          ),
        ),
      ),
    );

    await xMemeInfo.xMeme.connect(xMemeInfo.userWallet).claim(tid, signature);

    expect(await xMemeInfo.feeNFT.ownerOf(1)).eq(xMemeInfo.userWallet.address);

    await expect(
      xMemeInfo.feeNFT.connect(xMemeInfo.userWallet).transferFrom(xMemeInfo.userWallet.address, ZERO_ADDRESS, 1),
    ).revertedWithCustomError(xMemeInfo.feeNFT, "ERC721InvalidReceiver");

    await expect(
      xMemeInfo.feeNFT
        .connect(xMemeInfo.userWallet)
      ["safeTransferFrom(address,address,uint256)"](xMemeInfo.userWallet.address, ZERO_ADDRESS, 1),
    ).revertedWithCustomError(xMemeInfo.feeNFT, "ERC721InvalidReceiver");

    await expect(
      xMemeInfo.feeNFT
        .connect(xMemeInfo.userWallet)
      ["safeTransferFrom(address,address,uint256,bytes)"](xMemeInfo.userWallet.address, ZERO_ADDRESS, 1, "0x"),
    ).revertedWithCustomError(xMemeInfo.feeNFT, "ERC721InvalidReceiver");

    await xMemeInfo.feeNFT.connect(xMemeInfo.userWallet).transferFrom(xMemeInfo.userWallet.address, nftOwner11.address, 1);
    expect(await xMemeInfo.feeNFT.ownerOf(1)).eq(nftOwner11.address);

    await xMemeInfo.feeNFT
      .connect(nftOwner11)
    ["safeTransferFrom(address,address,uint256)"](nftOwner11.address, nftOwner22.address, 1);
    expect(await xMemeInfo.feeNFT.ownerOf(1)).eq(nftOwner22.address);

    await xMemeInfo.feeNFT
      .connect(nftOwner22)
    ["safeTransferFrom(address,address,uint256,bytes)"](nftOwner22.address, xMemeInfo.userWallet.address, 1, "0x");
    expect(await xMemeInfo.feeNFT.ownerOf(1)).eq(xMemeInfo.userWallet.address);
  });
});
