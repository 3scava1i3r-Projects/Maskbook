import { useAsyncRetry } from 'react-use'
import { EMPTY_LIST } from '@masknet/shared-base'
import type { NonFungibleToken, NetworkPluginID } from '@masknet/web3-shared-base'
import type { Web3Helper } from '../web3-helpers'
import { useWeb3Connection } from './useWeb3Connection'

export function useNonFungibleTokens<T extends NetworkPluginID>(
    pluginID?: T,
    // pair: [address, tokenId]
    listOfPairs?: [string, string],
    options?: Web3Helper.Web3ConnectionOptions<T>,
) {
    const connection = useWeb3Connection(pluginID, options)

    return useAsyncRetry<
        Array<NonFungibleToken<Web3Helper.Definition[T]['ChainId'], Web3Helper.Definition[T]['SchemaType']>>
    >(async () => {
        if (!connection) return EMPTY_LIST
        return Promise.all(listOfPairs?.map((x) => connection.getNonFungibleToken(x[0], x[1])) ?? [])
    }, [connection, listOfPairs?.join()])
}
