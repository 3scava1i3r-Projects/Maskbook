import Fortmatic from 'fortmatic'
import type { RequestArguments } from 'web3-core'
import { first } from 'lodash-unified'
import type { FmProvider } from 'fortmatic/dist/cjs/src/core/fm-provider'
import { ChainId, getRPCConstants } from '@masknet/web3-shared-evm'
import { createLookupTableResolver } from '@masknet/web3-shared-base'
import type { EVM_Provider } from '../types'
import { BaseProvider } from './Base'

// #region create in-page fortmatic provider

/* spell-checker: disable-next-line */
const TEST_KEY = 'pk_test_D9EAF9A8ACEC9627'

/* spell-checker: disable-next-line */
const LIVE_KEY = 'pk_live_331BE8AA24445030'

const resolveAPI_Key = createLookupTableResolver<ChainIdFortmatic, string>(
    {
        [ChainId.Mainnet]: LIVE_KEY,
        [ChainId.BSC]: LIVE_KEY,
        [ChainId.Matic]: LIVE_KEY,
        [ChainId.Rinkeby]: TEST_KEY,
        [ChainId.Ropsten]: TEST_KEY,
        [ChainId.Kovan]: TEST_KEY,
    },
    '',
)

const isFortmaticSupported = (chainId: ChainId): chainId is ChainIdFortmatic => {
    return [ChainId.Mainnet, ChainId.BSC].includes(chainId)
}

export type ChainIdFortmatic =
    | ChainId.Mainnet
    | ChainId.BSC
    | ChainId.Matic
    | ChainId.Rinkeby
    | ChainId.Ropsten
    | ChainId.Kovan

export default class FortmaticProvider extends BaseProvider implements EVM_Provider {
    /**
     * If the internal chain id exists, it means the connection was created.
     * Otherwise, no connection was created before.
     */
    private chainId_: ChainIdFortmatic | null = null
    private providerPool = new Map<ChainId, FmProvider>()

    private get chainId(): ChainIdFortmatic {
        const chainId = this.chainId_
        if (!chainId) throw new Error('No connection.')
        if (!isFortmaticSupported(chainId)) throw new Error(`Chain id ${chainId} is not supported.`)
        return chainId
    }

    private set chainId(newChainId: ChainId) {
        const chainId = newChainId
        if (!isFortmaticSupported(chainId)) throw new Error(`Chain id ${chainId} is not supported.`)
        this.chainId_ = chainId
    }

    private createFortmatic(chainId: ChainIdFortmatic) {
        const rpcUrl = first(getRPCConstants(chainId).RPC_URLS)
        if (!rpcUrl) throw new Error('Failed to create provider.')
        return new Fortmatic(resolveAPI_Key(chainId), { chainId, rpcUrl })
    }

    private createProvider() {
        if (this.providerPool.has(this.chainId)) return this.providerPool.get(this.chainId)!

        const fm = this.createFortmatic(this.chainId)
        const provider = fm.getProvider()
        this.providerPool.set(this.chainId, provider)
        return provider
    }

    private login() {
        const fm = this.createFortmatic(this.chainId)
        return fm.user.login()
    }

    private logout() {
        const fm = this.createFortmatic(this.chainId)
        return fm.user.logout()
    }

    override async connect(chainId: ChainId) {
        try {
            this.chainId = chainId
            const accounts = await this.login()
            if (!accounts.length) throw new Error(`Failed to connect to ${this.chainId}.`)
            return {
                account: first(accounts)!,
                chainId,
            }
        } catch (error) {
            this.chainId_ = null
            throw error
        }
    }

    override async disconnect() {
        await this.logout()
        this.chainId_ = null
    }

    override request<T extends unknown>(requestArguments: RequestArguments) {
        return this.createProvider().send<T>(requestArguments.method, requestArguments.params)
    }
}
