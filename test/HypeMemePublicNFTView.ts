import { ethers } from "hardhat";
import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { parseTokenURI, saveSVG } from "./shared/utils";
import { HypeMemePublicNFTView } from "../typechain-types";
import { HypeMemeAllContractInfo } from "./shared/deploy_hype_meme";

const nft_name = "HypeMeme Tax"
const nft_symbol = "HMT"

function get_cnft_json_name(ticker: string) {
    return ticker
}

function get_cnft_json_desc(ticker: string) {
    return `The coin creator will automatically receive this tradable NFT, which grants holders 1% ownership of trade fees from ${ticker} as a certificate.`
}

async function test(info: HypeMemeAllContractInfo, number: string, image: string) {
    // create token
    let params = {
        info: {
            name: "name_" + number,
            ticker: "ticker_" + number,
            description: "description_" + number,
            image: image,
            twitterLink: "twitter_link_" + number,
            telegramLink: "telegram_link_" + number,
            warpcastLink: "warpcast_link_" + number,
            website: "website_" + number
        }
    };

    await info.mockDegen.connect(info.deployWallet).approve(await info.hypeMeme.getAddress(), info.hypeMemeNftPrice);

    await info.hypeMeme
        .connect(info.deployWallet)
        .createToken(params.info);
    const tokenIDs = await info.hypeMemePublicNFT.tidToTokenIds(params.info.ticker);

    expect(await info.hypeMemePublicNFT.name()).eq(nft_name);
    expect(await info.hypeMemePublicNFT.symbol()).eq(nft_symbol);

    const cnftUn = await info.hypeMemePublicNFT.tokenURI(tokenIDs[0]);
    const json1 = parseTokenURI(cnftUn);
    expect(json1.name).eq(get_cnft_json_name(params.info.ticker));
    expect(json1.description).eq(
        get_cnft_json_desc(params.info.ticker),
    );
    saveSVG("test" + number, json1.image);

}

describe("PublicNFTView", function () {
    it("deploy", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;

        let publicNFTView = (await (
            await ethers.getContractFactory("HypeMemePublicNFTView")
        ).deploy(
            await info.foundry.getAddress(),
            info.hypeMemeAppId,
            await info.hypeMemePublicNFT.getAddress(),
        )) as HypeMemePublicNFTView;

        expect(await publicNFTView.appId()).eq(info.hypeMemeAppId);
        expect(await publicNFTView.foundry()).eq(await info.foundry.getAddress());
        expect(await publicNFTView.publicNFT()).eq(await info.hypeMemePublicNFT.getAddress());
        expect(await publicNFTView.name()).eq(nft_name);
        expect(await publicNFTView.symbol()).eq(nft_symbol);
    });

    it("test", async function () {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.hypeMeme.setSystemReady(true)
        await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, 1000)

        let publicNFTView = (await (
            await ethers.getContractFactory("HypeMemePublicNFTView")
        ).deploy(
            await info.foundry.getAddress(),
            info.hypeMemeAppId,
            await info.hypeMemePublicNFT.getAddress(),
        )) as HypeMemePublicNFTView;

        await info.hypeMemePublicNFT.connect(info.hypeMemeOwnerWallet).setPublicNFTView(await publicNFTView.getAddress());

        await expect(
            publicNFTView.connect(info.userWallet).setImageUrlPrefix("https://yellow-select-rat-115.mypinata.cloud/ipfs/")
        ).revertedWithCustomError(publicNFTView, "OwnableUnauthorizedAccount")

        await publicNFTView.connect(info.deployWallet).setImageUrlPrefix("https://yellow-select-rat-115.mypinata.cloud/ipfs/")

        await test(info, "1", "Qma4nMJSsBLYho764ynwS6HUGHUMkAJ28GAo4jYwpAGbM8")
        await test(info, "2", "QmbKutmm7yL2wXnmoAdzKzfgdj6yaCjujP3grEssoNvhDf")
        await test(info, "3", "QmdoKesTQZRyK5Zb9Nr2gTapHBqgudf5RcW7VS7M1nN8N9")
    });
});
