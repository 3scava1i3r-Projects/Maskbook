import urlcat from 'urlcat'
import type { ChainDescriptor, NetworkDescriptor, ProviderDescriptor } from '../specs'

export function createLookupTableResolver<K extends keyof any, T>(map: Record<K, T>, fallback: T | ((key: K) => T)) {
    function resolveFallback(key: K) {
        if (typeof fallback === 'function') return (fallback as (key: K) => T)(key)
        return fallback
    }
    return (key: K) => map[key] ?? resolveFallback(key)
}

export function createChainResolver<ChainId, SchemaType, NetworkType>(
    descriptors: ChainDescriptor<ChainId, SchemaType, NetworkType>[],
) {
    const getChainDescriptor = (chainId?: ChainId) => descriptors.find((x) => x.chainId === chainId)

    return {
        chainId: (name?: string) =>
            name
                ? descriptors.find((x) =>
                      [x.name, x.fullName, x.shortName]
                          .map((x) => x?.toLowerCase())
                          .filter(Boolean)
                          .includes(name),
                  )?.chainId
                : undefined,
        coinMarketCapChainId: (chainId?: ChainId) => getChainDescriptor(chainId)?.coinMarketCapChainId,
        coinGeckoChainId: (chainId?: ChainId) => getChainDescriptor(chainId)?.coinGeckoChainId,
        coinGeckoPlatformId: (chainId?: ChainId) => getChainDescriptor(chainId)?.coinGeckoPlatformId,
        chainName: (chainId?: ChainId) => getChainDescriptor(chainId)?.name,
        chainFullName: (chainId?: ChainId) => getChainDescriptor(chainId)?.fullName,
        chainShortName: (chainId?: ChainId) => getChainDescriptor(chainId)?.shortName,
        chainColor: (chainId?: ChainId) => getChainDescriptor(chainId)?.color,
        chainNetworkType: (chainId?: ChainId) => getChainDescriptor(chainId)?.type,
        infoURL: (chainId?: ChainId) => getChainDescriptor(chainId)?.infoURL,
        nativeCurrency: (chainId?: ChainId) => getChainDescriptor(chainId)?.nativeCurrency,
        isValid: (chainId?: ChainId, testnet = false) => getChainDescriptor(chainId)?.network === 'mainnet' || testnet,
        isMainnet: (chainId?: ChainId) => getChainDescriptor(chainId)?.network === 'mainnet',
        isSupport: (chainId?: ChainId, feature?: string) =>
            !!(feature && getChainDescriptor(chainId)?.features?.includes(feature)),
    }
}

export function createExplorerResolver<ChainId, SchemaType, NetworkType>(
    descriptors: ChainDescriptor<ChainId, SchemaType, NetworkType>[],
    {
        addressPathname = '/address/:address',
        blockPathname = '/block/:blockNumber',
        transactionPathname = '/tx/:id',
        domainPathname = '/address/:domain',
        fungibleTokenPathname = '/address/:address',
        nonFungibleTokenPathname = '/address/:address',
    }: {
        addressPathname?: string
        blockPathname?: string
        transactionPathname?: string
        domainPathname?: string
        fungibleTokenPathname?: string
        nonFungibleTokenPathname?: string
    } = {},
) {
    const getInfoURL = (chainId: ChainId) => {
        const chainDescriptor = descriptors.find((x) => x.chainId === chainId)
        return chainDescriptor?.infoURL ?? { url: '' }
    }

    return {
        infoURL: getInfoURL,
        addressLink: (chainId: ChainId, address: string) =>
            urlcat(getInfoURL(chainId).url, addressPathname, {
                address,
                ...getInfoURL(chainId)?.parameters,
            }),
        blockLink: (chainId: ChainId, blockNumber: number) =>
            urlcat(getInfoURL(chainId).url, blockPathname, {
                blockNumber,
                ...getInfoURL(chainId)?.parameters,
            }),
        transactionLink: (chainId: ChainId, id: string) =>
            urlcat(getInfoURL(chainId).url, transactionPathname, {
                id,
                ...getInfoURL(chainId)?.parameters,
            }),
        domainLink: (chainId: ChainId, domain: string) =>
            urlcat(getInfoURL(chainId).url, domainPathname, {
                domain,
                ...getInfoURL(chainId)?.parameters,
            }),
        fungibleTokenLink: (chainId: ChainId, address: string) =>
            urlcat(getInfoURL(chainId).url, fungibleTokenPathname, {
                address,
                ...getInfoURL(chainId)?.parameters,
            }),
        nonFungibleTokenLink: (chainId: ChainId, address: string) =>
            urlcat(getInfoURL(chainId).url, nonFungibleTokenPathname, {
                address,
                ...getInfoURL(chainId)?.parameters,
            }),
    }
}

export function createNetworkResolver<ChainId, NetworkType>(descriptors: NetworkDescriptor<ChainId, NetworkType>[]) {
    const getNetworkDescriptor = (networkType: NetworkType) => descriptors.find((x) => x.type === networkType)
    return {
        networkName: (networkType: NetworkType) => getNetworkDescriptor(networkType)?.name,
        networkChainId: (networkType: NetworkType) => getNetworkDescriptor(networkType)?.chainId,
    }
}

export function createProviderResolver<ChainId, ProviderType>(
    descriptors: ProviderDescriptor<ChainId, ProviderType>[],
) {
    const getProviderDescriptor = (providerType: ProviderType) => descriptors.find((x) => x.type === providerType)
    return {
        providerName: (providerType: ProviderType) => getProviderDescriptor(providerType)?.name,
        providerHomeLink: (providerType: ProviderType) => getProviderDescriptor(providerType)?.homeLink,
        providerShortenLink: (providerType: ProviderType) => getProviderDescriptor(providerType)?.shortenLink,
        providerDownloadLink: (providerType: ProviderType) => getProviderDescriptor(providerType)?.downloadLink,
    }
}
