
import { DegenGateAllContractInfo, deployDegenGateAllContract } from "./deploy_degen_gate";
import { AppOperatorAllContractInfo, deployAppOperatorAllContract } from "./deploy_app_operator";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const MAX_UINT256 = BigInt(2) ** BigInt(256) - BigInt(1);

export type AllContractInfo = {
    degenGateInfo: DegenGateAllContractInfo,
    appOperatorAllContractInfo: AppOperatorAllContractInfo
}

export async function deployAllContracts(): Promise<AllContractInfo> {
    let degenGateInfo = await deployDegenGateAllContract();
    let appOperatorAllContractInfo = await deployAppOperatorAllContract();

    return {
        degenGateInfo: degenGateInfo,
        appOperatorAllContractInfo: appOperatorAllContractInfo,
    }
}
