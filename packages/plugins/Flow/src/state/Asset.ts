import type { Web3Plugin, Pagination } from '@masknet/plugin-infra/web3'
import type { ChainId } from '@masknet/web3-shared-flow'
import { FlowRPC } from '../messages'

export class Asset implements Web3Plugin.ObjectCapabilities.AssetState<ChainId> {
    async getFungibleAssets(chainId: ChainId, address: string, pagination?: Pagination) {
        return FlowRPC.getFungibleAssets(chainId, address)
    }
}
