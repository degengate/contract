

import { deployCoreContract, CoreContractInfo } from "./deploy_foundry";
import { deployXMemeAllContract, XMemeAllContractInfo } from "./deploy_xmeme";
import { ethers } from "hardhat";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const MAX_UINT256 = BigInt(2) ** BigInt(256) - BigInt(1);

export type AllContractInfo = {
    coreContractInfo: CoreContractInfo
    xMemeAllContractInfo: XMemeAllContractInfo
}

export async function deployAllContracts(): Promise<AllContractInfo> {
    let coreContractInfo = await deployCoreContract();
    let xMemeAllContractInfo = await deployXMemeAllContract(coreContractInfo);
    coreContractInfo.nextWalletIndex = xMemeAllContractInfo.nextWalletIndex

    return {
        coreContractInfo: coreContractInfo,
        xMemeAllContractInfo: xMemeAllContractInfo,
    }
}

async function getContractAddress(sender: string, nonce: number) {
    console.log("sender ", sender);
    console.log("nonce ", nonce);
    return ethers.getCreateAddress({
        from: sender,
        nonce: nonce,
    });
}

export async function getAllContractAddress(deployWallet: string): Promise<void> {
    let wallets = await ethers.getSigners();
    const nextNoice = await wallets[0].provider.getTransactionCount(deployWallet);
    // deploy foundryData 0
    // deploy foundry 1
    // deploy feeNFTFactory 2
    // deploy mortgageNFTFactory 3
    // deploy marketFactory 4
    // deploy tokenFactory 5
    // deploy cpfCurveFactory 6
    // updateFoundryWhitelist   7
    // foundry.initialize 8
    // updateCurveFactoryWhitelist 9
    // create X-meme app 10
    // deploy xMeme 12
    const foundryData = await getContractAddress(deployWallet, nextNoice);
    const foundry = await getContractAddress(deployWallet, nextNoice + 1);
    const feeNFTFactory = await getContractAddress(deployWallet, nextNoice + 2);
    const mortgageNFTFactory = await getContractAddress(deployWallet, nextNoice + 3);
    const marketFactory = await getContractAddress(deployWallet, nextNoice + 4);
    const tokenFactory = await getContractAddress(deployWallet, nextNoice + 5);
    const cpfCurveFactory = await getContractAddress(deployWallet, nextNoice + 6);
    const xMeme = await getContractAddress(deployWallet, nextNoice + 12);

    let feeNFT = ethers.getCreateAddress({
        from: feeNFTFactory,
        nonce: 1,
    });
    let mortgageNFT = ethers.getCreateAddress({
        from: mortgageNFTFactory,
        nonce: 1,
    });
    let market = ethers.getCreateAddress({
        from: marketFactory,
        nonce: 1,
    });
    let curve = ethers.getCreateAddress({
        from: cpfCurveFactory,
        nonce: 1,
    });

    let info = {
        foundryData: foundryData,
        foundry: foundry,
        feeNFTFactory: feeNFTFactory,
        mortgageNFTFactory: mortgageNFTFactory,
        marketFactory: marketFactory,
        tokenFactory: tokenFactory,
        cpfCurveFactory: cpfCurveFactory,
        xMeme: xMeme,
        feeNFT: feeNFT,
        mortgageNFT: mortgageNFT,
        market: market,
        curve: curve
    };
    console.log("getAllContractAddress ", info)
}