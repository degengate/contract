import {
    degenAddress,
    degenGateAddress,
    degenGateVaultAddress,
    degenGateNFTClaimAddress,
    degenGateMortgageNFTAddress,
    degenGateMarketAddress
} from "./params.json";

async function main() {
    console.log(`
TX_DEGEN_ADDRESS=${degenAddress}
TX_DEGENGATE_ADDRESS=${degenGateAddress}
TX_DEGENGATEVAULT_ADDRESS=${degenGateVaultAddress}
TX_DEGENGATENFTCLAIM_ADDRESS=${degenGateNFTClaimAddress}
TX_MORTGAGENFT_ADDRESS=${degenGateMortgageNFTAddress}
TX_MARKET_ADDRESS=${degenGateMarketAddress}
    `)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
