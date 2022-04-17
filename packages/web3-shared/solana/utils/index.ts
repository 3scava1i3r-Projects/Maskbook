import Web3 from '@solana/web3.js'
import bs58 from 'bs58'
import { Buffer } from 'buffer'
import urlcat from 'urlcat'
import { CurrencyType, TokenType, Web3Plugin } from '@masknet/plugin-infra/web3'
import { leftShift, multipliedBy, createLookupTableResolver } from '@masknet/web3-shared-base'
import { ChainId, ProviderType, NetworkType } from '../types'
import { getChainConstants } from '../constants'

// #region formatter
export function formatAddress(address: string, size = 0) {
    if (!isValidAddress(address)) return address
    const address_ = bs58.encode(Buffer.from(address, 'hex'))
    if (size === 0 || size > 21) return address_
    return `${address_.substring(0, size)}...${address_.substring(-size)}`
}
// #endregion

// #region validator
export function isChainIdValid(chainId: ChainId, allowTestnet = false) {
    return resolveChainName(chainId) === 'mainnet' || allowTestnet
}

export function isSameAddress(a?: string, b?: string) {
    if (!a || !b) return false
    return a.toLowerCase() === b.toLowerCase()
}

export function isValidDomain(domain: string) {
    return /.+\.sol/i.test(domain)
}

export function isValidAddress(address?: string) {
    return !!(address && Web3.PublicKey.isOnCurve(bs58.decode(address)))
}
// #endregion

// #region token
export function createFungibleToken(
    chainId: ChainId,
    address: string,
    name: string,
    symbol: string,
    decimals: number,
    logoURI?: string,
): Web3Plugin.FungibleToken {
    return {
        id: address,
        chainId,
        type: TokenType.Fungible,
        subType: TokenType.Fungible,
        address,
        name,
        symbol,
        decimals,
        logoURI,
    }
}

export function createFungibleAsset(
    token: Web3Plugin.FungibleToken,
    balance: string,
    price?: { [key in CurrencyType]?: string },
): Web3Plugin.FungibleAsset {
    return {
        ...token,
        balance: leftShift(balance, 8).toFixed(),
        price,
        value: {
            [CurrencyType.USD]: multipliedBy(price?.usd ?? 0, leftShift(balance, 8)).toFixed(),
        },
    }
}
// #endregion

// #region pipes
const EXPLORER_URL = 'https://explorer.solana.com/'

const getCluster = createLookupTableResolver<ChainId, string>(
    {
        [ChainId.Mainnet]: '',
        [ChainId.Testnet]: 'devenet',
        [ChainId.Devnet]: 'testnet',
    },
    '',
)

export function resolveTransactionLinkOnExplorer(chainId: ChainId, id: string) {
    return urlcat(EXPLORER_URL, '/tx/:id', {
        id,
        cluster: getCluster(chainId),
    })
}

export function resolveAddressLinkOnExplorer(chainId: ChainId, address: string) {
    return urlcat(EXPLORER_URL, '/address/:address', {
        address,
        cluster: getCluster(chainId),
    })
}

export function resolveBlockLinkOnExplorer(chainId: ChainId, block: string) {
    return urlcat(EXPLORER_URL, '/block/:block', {
        block,
        cluster: getCluster(chainId),
    })
}

export function resolveNonFungibleTokenLink(chainId: ChainId, address: string, tokenId: string) {
    return ''
}

export function resolveFungileTokenLink(chainId: ChainId, address: string) {
    return ''
}

export function resolveDomainLink(domain: string) {
    return ''
}

export function resolveChainColor(chainId: ChainId) {
    return getChainConstants(chainId).COLOR ?? '#34d399'
}

export function resolveChainFullName(chainId: ChainId) {
    const { NAME, FULL_NAME } = getChainConstants(chainId)
    return NAME ?? FULL_NAME ?? 'Flow'
}

export const resolveChainName = createLookupTableResolver<ChainId, string>(
    {
        [ChainId.Mainnet]: 'mainnet',
        [ChainId.Devnet]: 'devnet',
        [ChainId.Testnet]: 'testnet',
    },
    () => 'unknown',
)

export const resolveProviderName = createLookupTableResolver<ProviderType, string>(
    {
        [ProviderType.Phantom]: 'Phantom',
        [ProviderType.Sollet]: 'Sollet',
    },
    () => 'Unknown',
)

// #endregion

// #region chain detailed
export function getChainDetailed(chainId: ChainId): Web3Plugin.ChainDetailed {
    const { NAME, FULL_NAME, SHORT_NAME } = getChainConstants(chainId)

    return {
        name: NAME ?? 'Solana',
        chainId,
        fullName: FULL_NAME ?? 'Solana',
        shortName: SHORT_NAME ?? 'SOL',
        chainName: 'Solana',
        network: chainId === ChainId.Mainnet ? 'mainnet' : 'testnet',
    }
}

export function getNetworkTypeFromChainId(chainId: ChainId) {
    return NetworkType.Solana
}
// #endregion
