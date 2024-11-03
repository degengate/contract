import { ethers } from "hardhat";
import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";
import { expect } from "chai";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { getTokenAmountWei, parseTokenURI, saveSVG } from "./shared/utils";
import { HypeMemeMortgageNFTView } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { HypeMemeAllContractInfo } from "./shared/deploy_hype_meme";

const nft_name = "HM Option"
const nft_symbol = "HMO"

const nft_json_desc = "This NFT represents a collateral option within the HypeMeme.\n⚠️ DISCLAIMER: Always perform due diligence before purchasing this NFT. Verify that the image reflects the correct number of option in the collateral. Refresh cached images on trading platforms to ensure you have the latest data."

async function multiply(tid: string, info: HypeMemeAllContractInfo, multiplyAmount: bigint, userWallet: HardhatEthersSigner): Promise<{
    mortgageNFTtokenId: bigint;
    payTokenAmount: bigint;
}> {
    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    let paramsMultiply = {
        tid: tid,
        multiplyAmount: multiplyAmount,
        degenAmountMax: multiplyAmount * BigInt(10)
    }

    await info.mockDegen.transfer(await userWallet.getAddress(), paramsMultiply.degenAmountMax)
    await info.mockDegen.connect(userWallet).approve(await info.hypeMeme.getAddress(), paramsMultiply.degenAmountMax)
    console.log(await info.mockDegen.allowance(userWallet.address, await info.hypeMeme.getAddress()))
    let result = await info.hypeMeme.connect(userWallet).multiply.staticCall(
        paramsMultiply.tid,
        paramsMultiply.multiplyAmount,
        paramsMultiply.degenAmountMax
    )

    await info.hypeMeme.connect(userWallet).multiply(
        paramsMultiply.tid,
        paramsMultiply.multiplyAmount,
        paramsMultiply.degenAmountMax
    )
    return result
}

async function test(name: string, image: string) {
    const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
    await info.degenGateInfo.degenGateVault.addApproveDegen()
    await info.hypeMeme.setSystemReady(true)

    let mortgageNFTView = (await (
        await ethers.getContractFactory("HypeMemeMortgageNFTView")
    ).deploy(
        await info.foundry.getAddress(),
        info.hypeMemeAppId,
        await info.hypeMemeMortgageNFT.getAddress(),
    )) as HypeMemeMortgageNFTView;

    await info.hypeMemeMortgageNFT.connect(info.hypeMemeOwnerWallet).setMortgageNFTView(await mortgageNFTView.getAddress());

    let user1 = info.wallets[info.nextWalletIndex + 1];
    let user2 = info.wallets[info.nextWalletIndex + 2];
    let user3 = info.wallets[info.nextWalletIndex + 3];

    await expect(
        mortgageNFTView.connect(info.userWallet).setImageUrlPrefix("https://yellow-select-rat-115.mypinata.cloud/ipfs/")
    ).revertedWithCustomError(mortgageNFTView, "OwnableUnauthorizedAccount")

    await mortgageNFTView.connect(info.deployWallet).setImageUrlPrefix("https://yellow-select-rat-115.mypinata.cloud/ipfs/")

    // create token
    let params = {
        info: {
            name: "name_" + name,
            ticker: "ticker_" + name,
            description: "description_" + name,
            image: image,
            twitterLink: "twitter_link_" + name,
            telegramLink: "telegram_link_" + name,
            warpcastLink: "warpcast_link_" + name,
            website: "website_" + name
        }
    };

    await info.mockDegen.connect(info.deployWallet).approve(await info.hypeMeme.getAddress(), info.hypeMemeNftPrice);

    await info.hypeMeme
        .connect(info.deployWallet)
        .createToken(params.info);
    let multiplyResult1 = await multiply(params.info.ticker, info, getTokenAmountWei(12345), user1)

    expect(await info.hypeMemeMortgageNFT.name()).eq(nft_name);
    expect(await info.hypeMemeMortgageNFT.symbol()).eq(nft_symbol);

    const mnft1 = await info.hypeMemeMortgageNFT.tokenURI(multiplyResult1.mortgageNFTtokenId);
    const json1 = parseTokenURI(mnft1);
    expect(json1.name).eq(params.info.ticker + " - #1 - 12345");
    expect(json1.description).eq(nft_json_desc);
    saveSVG(name + "_mnft1", json1.image);

    let multiplyResult2 = await multiply(params.info.ticker, info, BigInt(10) ** BigInt(16) * BigInt(216789), user2)

    const mnft2 = await info.hypeMemeMortgageNFT.tokenURI(multiplyResult2.mortgageNFTtokenId);
    const json2 = parseTokenURI(mnft2);
    expect(json2.name).eq(params.info.ticker + " - #2 - 2167");
    expect(json2.description).eq(nft_json_desc);
    saveSVG(name + "_mnft2", json2.image);

    let multiplyResult3 = await multiply(params.info.ticker, info, BigInt(10) ** BigInt(17) * BigInt(123), user3)

    const mnft3 = await info.hypeMemeMortgageNFT.tokenURI(multiplyResult3.mortgageNFTtokenId);
    const json3 = parseTokenURI(mnft3);
    expect(json3.name).eq(params.info.ticker + " - #3 - 12");
    expect(json3.description).eq(nft_json_desc);
    saveSVG(name + "_mnft3", json3.image);
}

describe("MortgageNFTView", function () {
    it("deploy", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;

        let mortgageNFTView = (await (
            await ethers.getContractFactory("HypeMemeMortgageNFTView")
        ).deploy(
            await info.foundry.getAddress(),
            info.hypeMemeAppId,
            await info.hypeMemeMortgageNFT.getAddress(),
        )) as HypeMemeMortgageNFTView;

        expect(await mortgageNFTView.appId()).eq(info.hypeMemeAppId);
        expect(await mortgageNFTView.foundry()).eq(await info.foundry.getAddress());
        expect(await mortgageNFTView.mortgageNFT()).eq(await info.hypeMemeMortgageNFT.getAddress());
        expect(await mortgageNFTView.name()).eq(nft_name);
        expect(await mortgageNFTView.symbol()).eq(nft_symbol);
    });

    it("test1", async function () {
        await test("test1", "Qma4nMJSsBLYho764ynwS6HUGHUMkAJ28GAo4jYwpAGbM8")
    });

    it("test2", async function () {
        await test("test2", "QmbKutmm7yL2wXnmoAdzKzfgdj6yaCjujP3grEssoNvhDf")
    });

    it("test3", async function () {
        await test("test3", "QmdoKesTQZRyK5Zb9Nr2gTapHBqgudf5RcW7VS7M1nN8N9")
    });
});
