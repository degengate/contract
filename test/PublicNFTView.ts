import { ethers } from "hardhat";
import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { parseTokenURI, saveSVG } from "./shared/utils";
import { PublicNFTView } from "../typechain-types";

const nft_name = "Gate of Degen"
const nft_symbol = "GOD"

function get_cnft_json_name(username: string) {
  return `@${username} - Key`
}

function get_onft_json_name(username: string) {
  return `@${username} - Lord`
}

function get_cnft_json_desc(username: string) {
  return `The Keyholder to receive 100% of the total castle tax from @${username}'s trades. Once @${username} takes over the castle, the Keyholder will then receive 5%.`
}

function get_onft_json_desc(username: string) {
  return `This lord holder to receive 95% of the total castle tax from @${username}'s trades once @${username} takes over the castle.`
}

describe("PublicNFTView", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    let publicNFTView = (await (
      await ethers.getContractFactory("PublicNFTView")
    ).deploy(
      await info.foundry.getAddress(),
      info.appId,
      await info.publicNFT.getAddress(),
      await info.degenGateNFTClaim.getAddress(),
    )) as PublicNFTView;

    expect(await publicNFTView.appId()).eq(info.appId);
    expect(await publicNFTView.foundry()).eq(await info.foundry.getAddress());
    expect(await publicNFTView.nftClaim()).eq(await info.degenGateNFTClaim.getAddress());
    expect(await publicNFTView.publicNFT()).eq(await info.publicNFT.getAddress());
    expect(await publicNFTView.name()).eq(nft_name);
    expect(await publicNFTView.symbol()).eq(nft_symbol);
  });

  it("test c and o not eq", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    let publicNFTView = (await (
      await ethers.getContractFactory("PublicNFTView")
    ).deploy(
      await info.foundry.getAddress(),
      info.appId,
      await info.publicNFT.getAddress(),
      await info.degenGateNFTClaim.getAddress(),
    )) as PublicNFTView;

    await info.publicNFT.connect(info.degenGateOwnerWallet).setPublicNFTView(await publicNFTView.getAddress());

    let nftOwnerA2 = info.wallets[info.nextWalletIndex + 1];

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    // create token a price 0
    let paramsA = {
      info: {
        tid: "12345678",
        tName: "degengate",
        cid: "87654321",
        cName: "tom",
        followers: 2567967,
        omf: "6123400000000000000",
      },
      nftPrice: 0,
      deadline: deadline,
    };

    let signatureA = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [paramsA.info, paramsA.nftPrice, paramsA.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    await info.degenGate.connect(info.userWallet).createToken(paramsA.info, paramsA.nftPrice, paramsA.deadline, signatureA);

    const tokenIDs = await info.publicNFT.tidToTokenIds(paramsA.info.tid);

    expect(await info.publicNFT.name()).eq(nft_name);
    expect(await info.publicNFT.symbol()).eq(nft_symbol);

    const cnftUn = await info.publicNFT.tokenURI(tokenIDs[0]);
    const json1 = parseTokenURI(cnftUn);
    expect(json1.name).eq(get_cnft_json_name("degengate"));
    expect(json1.description).eq(
      get_cnft_json_desc("degengate"),
    );
    saveSVG("key.noteq.no", json1.image);

    const onftUn = await info.publicNFT.tokenURI(tokenIDs[1]);
    const json2 = parseTokenURI(onftUn);
    expect(json2.name).eq(get_onft_json_name("degengate"));
    expect(json2.description).eq(
      get_onft_json_desc("degengate"),
    );

    saveSVG("lord.noteq.no", json2.image);

    // b claim onft
    let signatureAClaim = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(["string", "address"], [paramsA.info.tid, nftOwnerA2.address]),
        ),
      ),
    );
    await info.degenGateNFTClaim.claimNFT(paramsA.info.tid, nftOwnerA2.address, signatureAClaim);

    const cnftYes = await info.publicNFT.tokenURI(tokenIDs[0]);
    const json3 = parseTokenURI(cnftYes);
    expect(json3.name).eq(get_cnft_json_name("degengate"));
    expect(json3.description).eq(
      get_cnft_json_desc("degengate"),
    );
    saveSVG("key.noteq.yes", json3.image);

    const onftYes = await info.publicNFT.tokenURI(tokenIDs[1]);
    const json4 = parseTokenURI(onftYes);
    expect(json4.name).eq(get_onft_json_name("degengate"));
    expect(json4.description).eq(
      get_onft_json_desc("degengate"),
    );
    saveSVG("lord.noteq.yes", json4.image);
  });

  it("test c and o eq", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    let publicNFTView = (await (
      await ethers.getContractFactory("PublicNFTView")
    ).deploy(
      await info.foundry.getAddress(),
      info.appId,
      await info.publicNFT.getAddress(),
      await info.degenGateNFTClaim.getAddress(),
    )) as PublicNFTView;

    await info.publicNFT.connect(info.degenGateOwnerWallet).setPublicNFTView(await publicNFTView.getAddress());

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    // create token a price 0
    let paramsA = {
      info: {
        tid: "87654321",
        tName: "tom",
        cid: "87654321",
        cName: "tom",
        followers: 1435,
        omf: "237500000000000000",
      },
      nftPrice: 0,
      deadline: deadline,
    };

    let signatureA = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [paramsA.info, paramsA.nftPrice, paramsA.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    await info.degenGate.connect(info.userWallet).createToken(paramsA.info, paramsA.nftPrice, paramsA.deadline, signatureA);

    const tokenIDs = await info.publicNFT.tidToTokenIds(paramsA.info.tid);

    const cnftUn = await info.publicNFT.tokenURI(tokenIDs[0]);
    const json1 = parseTokenURI(cnftUn);
    expect(json1.name).eq(get_cnft_json_name("tom"));
    expect(json1.description).eq(
      get_cnft_json_desc("tom"),
    );
    saveSVG("key.eq", json1.image);

    const onftUn = await info.publicNFT.tokenURI(tokenIDs[1]);
    const json2 = parseTokenURI(onftUn);
    expect(json2.name).eq(get_onft_json_name("tom"));
    expect(json2.description).eq(
      get_onft_json_desc("tom"),
    );
    saveSVG("lord.eq", json2.image);
  });
});
