

import { deployCoreContract, CoreContractInfo } from "./deploy_foundry";
import { deployXMemeAllContract, XMemeAllContractInfo } from "./deploy_xmeme";

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
