import { useAccount, useChainId } from '@masknet/plugin-infra/web3'
import { FungibleToken, NetworkPluginID, toFixed } from '@masknet/web3-shared-base'
import { ChainId, SchemaType, TransactionEventType } from '@masknet/web3-shared-evm'
import { useAsyncFn } from 'react-use'
import { useDHedgePoolV1Contract, useDHedgePoolV2Contract } from '../contracts/useDHedgePool'
import { Pool, PoolType } from '../types'

/**
 * A callback for invest dhedge pool
 * @param pool the pool
 * @param amount
 * @param token
 */
export function useInvestCallback(pool: Pool | undefined, amount: string, token?: FungibleToken<ChainId, SchemaType>) {
    const account = useAccount(NetworkPluginID.PLUGIN_EVM)
    const chainId = useChainId(NetworkPluginID.PLUGIN_EVM)
    const poolV1Contract = useDHedgePoolV1Contract(chainId, pool?.address ?? '')
    const poolV2Contract = useDHedgePoolV2Contract(chainId, pool?.address ?? '')

    return useAsyncFn(async () => {
        if (!token || !poolV1Contract || !poolV2Contract) return

        // step 1: estimate gas
        const config = {
            from: account,
            value: toFixed(token.schema === SchemaType.Native ? amount : 0),
        }

        const deposit = () => {
            return pool?.poolType === PoolType.v1
                ? poolV1Contract.methods.deposit(amount)
                : poolV2Contract.methods.deposit(token.address, amount)
        }

        const estimatedGas = await deposit()
            .estimateGas(config)
            .catch((error) => {
                throw error
            })

        // step 2: blocking
        return new Promise<string>((resolve, reject) => {
            deposit()
                .send({
                    ...config,
                    gas: estimatedGas,
                })
                .once(TransactionEventType.CONFIRMATION, (_, receipt) => {
                    resolve(receipt.transactionHash)
                })
                .on(TransactionEventType.ERROR, reject)
        })
    }, [pool, account, amount, token])
}
