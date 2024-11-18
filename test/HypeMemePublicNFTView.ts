import { ethers } from "hardhat";
import { deployAllContracts } from "./shared/deploy";
import { expect } from "chai";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { parseHypeMemePublicTokenURI } from "./shared/utils";
import { HypeMemePublicNFTView } from "../typechain-types";
import { HypeMemeAllContractInfo } from "./shared/deploy_hype_meme";

const nft_name = "HypeMeme Tax"
const nft_symbol = "HMT"

function get_nft_json_name(ticker: string) {
    return ticker
}

function get_cnft_json_desc(ticker: string) {
    return `The coin creator will automatically receive this tradable NFT, which grants holders 1% ownership of trade fees from ${ticker} as a certificate.`
}

function get_tnft_json_desc(ticker: string) {
    return `The HypeMeme team will automatically receive this tradable NFT, which grants holders 0.6% ownership of trade fees from ${ticker} as a certificate.`
}

async function test(info: HypeMemeAllContractInfo, number: number) {
    // create token
    let params = {
        info: {
            name: "name_" + number,
            ticker: "ticker_" + number,
            description: "description_" + number,
            image: "image_" + number,
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
    console.log(cnftUn)
    const json1 = parseHypeMemePublicTokenURI(cnftUn);
    expect(json1.name).eq(get_nft_json_name(params.info.ticker));
    expect(json1.description).eq(
        get_cnft_json_desc(params.info.ticker),
    );
    expect(json1.image).eq(`https://x.x/og/nft/${number * 2 - 1}`)
    expect(json1.metadata.name).eq(params.info.name)
    expect(json1.metadata.ticker).eq(params.info.ticker)
    expect(json1.metadata.image).eq(params.info.image)
    expect(json1.metadata.percent).eq(62500)

    const tnftUn = await info.hypeMemePublicNFT.tokenURI(tokenIDs[1]);
    const jsont = parseHypeMemePublicTokenURI(tnftUn);
    expect(jsont.name).eq(get_nft_json_name(params.info.ticker));
    expect(jsont.description).eq(
        get_tnft_json_desc(params.info.ticker),
    );
    expect(jsont.image).eq(`https://x.x/og/nft/${number * 2}`)
    expect(jsont.metadata.name).eq(params.info.name)
    expect(jsont.metadata.ticker).eq(params.info.ticker)
    expect(jsont.metadata.image).eq(params.info.image)
    expect(jsont.metadata.percent).eq(37500)
}

describe("HypeMemePublicNFTView", function () {
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
        await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

        let publicNFTView = (await (
            await ethers.getContractFactory("HypeMemePublicNFTView")
        ).deploy(
            await info.foundry.getAddress(),
            info.hypeMemeAppId,
            await info.hypeMemePublicNFT.getAddress(),
        )) as HypeMemePublicNFTView;

        await info.hypeMemePublicNFT.connect(info.hypeMemeOwnerWallet).setPublicNFTView(await publicNFTView.getAddress());

        await expect(
            publicNFTView.connect(info.userWallet).setImageUrlPrefix("https://x.x/og/nft/")
        ).revertedWithCustomError(publicNFTView, "OwnableUnauthorizedAccount")

        await publicNFTView.connect(info.deployWallet).setImageUrlPrefix("https://x.x/og/nft/")

        await test(info, 1)
        await test(info, 2)
        await test(info, 3)
    });
});
