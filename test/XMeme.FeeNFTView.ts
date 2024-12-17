import { ethers } from "hardhat";
import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { parseTokenURI, saveSVG } from "./shared/utils";
import { XMemeFeeNFTView } from "../typechain-types";

const nft_name = "X-meme Tax"
const nft_symbol = "XMT"

function get_nft_json_name(tid: string) {
  return `X ID: ${tid}`;
}

function get_nft_json_desc(tid: string) {
  return `A tradable NFT that grants the holder 1% ownership of trade fees from X ID: ${tid} as a certificate. X ID holder can claim this NFT anytime. If claimed, it directly transfers to the X ID holder's wallet; else as protocol fees.`
}

describe("XMeme.FeeNFTView", function () {
  it("deploy", async function () {
    const info = (await loadFixture(deployAllContracts)).xMemeAllContractInfo;

    let xMemeFeeNFTView = (await (
      await ethers.getContractFactory("XMemeFeeNFTView")
    ).deploy(
      await info.feeNFT.getAddress(),
    )) as XMemeFeeNFTView;

    expect(await xMemeFeeNFTView.feeNFT()).eq(await info.feeNFT.getAddress());
    expect(await xMemeFeeNFTView.name()).eq(nft_name);
    expect(await xMemeFeeNFTView.symbol()).eq(nft_symbol);
  });

  it("test", async function () {
    const info = (await loadFixture(deployAllContracts)).xMemeAllContractInfo;
    await info.xMeme.setSystemReady(true)

    let xMemeFeeNFTView = (await (
      await ethers.getContractFactory("XMemeFeeNFTView")
    ).deploy(
      await info.feeNFT.getAddress(),
    )) as XMemeFeeNFTView;

    await info.feeNFT.connect(info.appOwnerWallet).setFeeNFTView(await xMemeFeeNFTView.getAddress());

    let tid = "87654321";

    await info.xMeme.connect(info.userWallet).createTokenAndBuy(tid, 1, { value: ethers.parseEther("0.011") });

    const tokenIDs = await info.feeNFT.tidToTokenIds(tid);

    const cnftUn = await info.feeNFT.tokenURI(tokenIDs[0]);
    const json1 = parseTokenURI(cnftUn);
    expect(json1.name).eq(get_nft_json_name(tid));
    expect(json1.description).eq(
      get_nft_json_desc(tid),
    );
    saveSVG("xmeme.onft", json1.image);
  });
});
