import { useAsyncRetry } from 'react-use'
import { NetworkPluginID } from '@masknet/web3-shared-base'
import { ChainId, getRedPacketConstants } from '@masknet/web3-shared-evm'
import { useBlockNumber, useWeb3Connection, Web3Helper } from '@masknet/plugin-infra/web3'
import * as chain from '../utils/chain'
import { RedPacketRPC } from '../../messages'

export function useRedPacketHistory(address: string, chainId: ChainId) {
    const { value: blockNumber = 0 } = useBlockNumber(NetworkPluginID.PLUGIN_EVM)
    const connection = useWeb3Connection(NetworkPluginID.PLUGIN_EVM, { chainId })

    return useAsyncRetry(async () => {
        if (!blockNumber || !connection) return []

        return getRedPacketHistory(address, chainId, blockNumber, connection)
    }, [address, chainId, blockNumber, connection])
}

async function getRedPacketHistory(
    address: string,
    chainId: ChainId,
    endBlock: number,
    connection: Web3Helper.Web3Connection<NetworkPluginID.PLUGIN_EVM>,
) {
    const { HAPPY_RED_PACKET_ADDRESS_V4_BLOCK_HEIGHT } = getRedPacketConstants(chainId)
    const redpacketsFromChain = await chain.getRedPacketHistory(
        chainId,
        HAPPY_RED_PACKET_ADDRESS_V4_BLOCK_HEIGHT,
        endBlock,
        address,
        connection,
    )
    // #region Inject password from database
    return RedPacketRPC.getRedPacketHistoryFromDatabase(redpacketsFromChain)
    // #endregion
}
