import { clone, first } from 'lodash-unified'
import type { Subscription } from 'use-subscription'
import { delay, getEnumAsArray } from '@dimensiondev/kit'
import {
    EnhanceableSite,
    ExtensionSite,
    getSiteType,
    mapSubscription,
    mergeSubscription,
    StorageObject,
} from '@masknet/shared-base'
import type { Account, WalletProvider, ProviderState as Web3ProviderState } from '@masknet/web3-shared-base'
import type { Plugin } from '../types'

export interface ProviderStorage<Account, ProviderType extends string> {
    /** Providers map to account settings. */
    accounts: Record<ProviderType, Account>
    /** Sites map to provider type. */
    providers: Record<EnhanceableSite | ExtensionSite, ProviderType>
}

export class ProviderState<
    ChainId extends number,
    ProviderType extends string,
    NetworkType extends string,
    Web3Provider,
    Web3,
> implements Web3ProviderState<ChainId, ProviderType, NetworkType>
{
    protected site = getSiteType()
    protected storage: StorageObject<ProviderStorage<Account<ChainId>, ProviderType>> = null!

    public account?: Subscription<string>
    public chainId?: Subscription<ChainId>
    public networkType?: Subscription<NetworkType>
    public providerType?: Subscription<ProviderType>

    constructor(
        protected context: Plugin.Shared.SharedContext,
        protected providers: Record<ProviderType, WalletProvider<ChainId, ProviderType, Web3Provider, Web3>>,
        protected options: {
            isValidAddress(a?: string): boolean
            isValidChainId(a?: number): boolean
            isSameAddress(a?: string, b?: string): boolean
            getDefaultChainId(): ChainId
            getDefaultNetworkType(): NetworkType
            getDefaultProviderType(): ProviderType
            getNetworkTypeFromChainId(chainId: ChainId): NetworkType
        },
    ) {
        const defaultValue: ProviderStorage<Account<ChainId>, ProviderType> = {
            accounts: Object.fromEntries(
                Object.keys(providers).map((x) => [
                    x,
                    {
                        account: '',
                        chainId: options.getDefaultChainId(),
                    },
                ]),
            ) as Record<ProviderType, Account<ChainId>>,
            providers: Object.fromEntries(
                [...getEnumAsArray(EnhanceableSite), ...getEnumAsArray(ExtensionSite)].map((x) => [
                    x.value,
                    options.getDefaultProviderType(),
                ]),
            ) as Record<EnhanceableSite | ExtensionSite, ProviderType>,
        }
        const { storage } = this.context.createKVStorage('memory', {}).createSubScope('Provider', defaultValue)
        this.storage = storage

        this.setupSubscriptions()
        this.setupProviders()
    }

    private setupSubscriptions() {
        const site = this.site
        if (!site) return

        this.providerType = mapSubscription(this.storage.providers.subscription, (providers) => providers[site])

        this.chainId = mapSubscription(
            mergeSubscription(this.providerType, this.storage.accounts.subscription),
            ([providerType, accounts]) => accounts[providerType].chainId,
        )
        this.account = mapSubscription(
            mergeSubscription(this.providerType, this.storage.accounts.subscription),
            ([providerType, accounts]) => accounts[providerType].account,
        )
        this.networkType = mapSubscription(
            mergeSubscription(this.providerType, this.storage.accounts.subscription),
            ([providerType, accounts]) => this.options.getNetworkTypeFromChainId(accounts[providerType].chainId),
        )
    }

    private setupProviders() {
        Object.entries(this.providers).forEach((entry) => {
            const [providerType, provider] = entry as [
                ProviderType,
                WalletProvider<ChainId, ProviderType, Web3Provider, Web3>,
            ]

            provider.emitter.on('chainId', async (chainId) => {
                await this.setAccount(providerType, {
                    chainId: Number.parseInt(chainId, 16) as ChainId,
                })
            })
            provider.emitter.on('accounts', async (accounts) => {
                const account = first(accounts)
                if (account && this.options.isValidAddress(account))
                    await this.setAccount(providerType, {
                        account,
                    })
            })
            provider.emitter.on('disconnect', async () => {
                await this.setAccount(providerType, {
                    account: '',
                    chainId: this.options.getDefaultChainId(),
                })
            })
        })
    }

    private async setAccount(providerType: ProviderType, account: Partial<Account<ChainId>>) {
        const siteType = getSiteType()
        if (!siteType) return

        const account_ = this.storage.accounts.value[providerType]
        const accountCopied = clone(account)

        if (accountCopied.account !== '' && !this.options.isValidAddress(accountCopied.account))
            delete accountCopied.account
        if (!this.options.isValidChainId(accountCopied.chainId ?? 0)) delete accountCopied.chainId

        const needToUpdateAccount =
            accountCopied.account === '' || !this.options.isSameAddress(account_.account, account.account)
        const needToUpdateChainId = accountCopied.chainId && account_.chainId !== accountCopied.chainId

        if (needToUpdateAccount || needToUpdateChainId) {
            await this.storage.accounts.setValue({
                ...this.storage.accounts.value,
                [providerType]: {
                    ...account_,
                    ...accountCopied,
                },
            })
        }
    }

    private async setProvider(providerType: ProviderType) {
        const siteType = getSiteType()
        if (!siteType) return

        const needToUpdateProviderType = this.storage.providers.value[siteType] !== providerType

        if (needToUpdateProviderType) {
            await this.storage.providers.setValue({
                ...this.storage.providers.value,
                [siteType]: providerType,
            })
        }
    }

    isReady(providerType: ProviderType) {
        return this.providers[providerType].ready
    }

    untilReady(providerType: ProviderType) {
        return this.providers[providerType].readyPromise
    }

    async connect(chainId: ChainId, providerType: ProviderType) {
        const provider = this.providers[providerType]

        // compose the connection result
        const account = await provider.connect(chainId)

        // failed to connect provider
        if (!account.account) throw new Error('Failed to connect provider.')

        // switch the sub-network to the expected one
        if (chainId !== account.chainId) {
            await Promise.race([
                (async () => {
                    await delay(30 /* seconds */ * 1000 /* milliseconds */)
                    throw new Error('Timeout!')
                })(),
                provider.switchChain(chainId),
            ])
            account.chainId = chainId
        }

        // update local storage
        await this.setAccount(providerType, account)
        await this.setProvider(providerType)

        provider.emitter.emit('connect', account)
        return account
    }

    async disconnect(providerType: ProviderType) {
        const provider = this.providers[providerType]
        await provider.disconnect()

        // update local storage
        await this.setAccount(providerType, {
            account: '',
        })

        provider.emitter.emit('disconnect', providerType)
    }
}
