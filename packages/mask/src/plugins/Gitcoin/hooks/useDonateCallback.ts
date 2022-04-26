import BigNumber from 'bignumber.js'
import { useCallback, useMemo } from 'react'
import type { PayableTx } from '@masknet/web3-contracts/types/types'
import { FungibleToken, NetworkPluginID, toFixed } from '@masknet/web3-shared-base'
import {
    ChainId,
    SchemaType,
    TransactionEventType,
    TransactionStateType,
    useGitcoinConstants,
} from '@masknet/web3-shared-evm'
import { useTransactionState } from '@masknet/plugin-infra/web3-evm'
import { useAccount, useChainId } from '@masknet/plugin-infra/web3'
import { useBulkCheckoutContract } from '../contracts/useBulkCheckoutWallet'

/**
 * A callback for donate gitcoin grant
 * @param address the donor address
 * @param amount
 * @param token
 */
export function useDonateCallback(address: string, amount: string, token?: FungibleToken<ChainId, SchemaType>) {
    const { GITCOIN_ETH_ADDRESS, GITCOIN_TIP_PERCENTAGE } = useGitcoinConstants()

    const account = useAccount(NetworkPluginID.PLUGIN_EVM)
    const chainId = useChainId(NetworkPluginID.PLUGIN_EVM)
    const bulkCheckoutContract = useBulkCheckoutContract(chainId)
    const [donateState, setDonateState] = useTransactionState()

    const donations = useMemo((): [string, string, string][] => {
        if (!address || !token) return []
        if (!GITCOIN_ETH_ADDRESS || !GITCOIN_TIP_PERCENTAGE) return []
        const tipAmount = new BigNumber(GITCOIN_TIP_PERCENTAGE / 100).multipliedBy(amount)
        const grantAmount = new BigNumber(amount).minus(tipAmount)
        return [
            [
                token.schema === SchemaType.Native ? GITCOIN_ETH_ADDRESS : token.address, // token
                tipAmount.toFixed(), // amount
                address, // dest
            ],
            [
                token.schema === SchemaType.Native ? GITCOIN_ETH_ADDRESS : token.address, // token
                grantAmount.toFixed(), // amount
                address, // dest
            ],
        ]
    }, [address, amount, token])

    const donateCallback = useCallback(async () => {
        if (!token || !bulkCheckoutContract || !donations.length) {
            setDonateState({
                type: TransactionStateType.UNKNOWN,
            })
            return
        }

        // start waiting for provider to confirm tx
        setDonateState({
            type: TransactionStateType.WAIT_FOR_CONFIRMING,
        })

        // estimate gas and compose transaction
        const value = toFixed(token.schema === SchemaType.Native ? amount : 0)
        const config = {
            from: account,
            gas: await bulkCheckoutContract.methods
                .donate(donations)
                .estimateGas({
                    from: account,
                    value,
                })
                .catch((error) => {
                    setDonateState({
                        type: TransactionStateType.FAILED,
                        error,
                    })
                    throw error
                }),
            value,
        }

        // send transaction and wait for hash
        return new Promise<string>((resolve, reject) => {
            bulkCheckoutContract.methods
                .donate(donations)
                .send(config as PayableTx)
                .on(TransactionEventType.TRANSACTION_HASH, (hash) => {
                    setDonateState({
                        type: TransactionStateType.HASH,
                        hash,
                    })
                    resolve(hash)
                })
                .on(TransactionEventType.ERROR, (error) => {
                    setDonateState({
                        type: TransactionStateType.FAILED,
                        error,
                    })
                    reject(error)
                })
        })
    }, [account, amount, token, donations])

    const resetCallback = useCallback(() => {
        setDonateState({
            type: TransactionStateType.UNKNOWN,
        })
    }, [])

    return [donateState, donateCallback, resetCallback] as const
}
