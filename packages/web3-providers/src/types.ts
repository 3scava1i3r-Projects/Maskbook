import type { Result } from 'ts-results'
import type RSS3 from 'rss3-next'
import type { Transaction as Web3Transaction } from 'web3-core'
import type { api } from '@dimensiondev/mask-wallet-core/proto'
import type { NextIDAction, NextIDStoragePayload, NextIDPayload, NextIDPlatform } from '@masknet/shared-base'
import type {
    Transaction,
    FungibleAsset,
    NonFungibleToken,
    NonFungibleAsset,
    CurrencyType,
    Pageable,
    FungibleToken,
    OrderSide,
    NonFungibleTokenCollection,
    NonFungibleTokenContract,
    NonFungibleTokenOrder,
    NonFungibleTokenEvent,
    GasOptionType,
    HubOptions,
} from '@masknet/web3-shared-base'
import type { ChainId } from '@masknet/web3-shared-evm'

export namespace ExplorerAPI {
    export type Transaction = Web3Transaction & {
        status: '0' | '1'
        confirmations: number
    }

    export interface PageInfo {
        offset?: number
        apikey?: string
    }

    export interface Provider {
        getLatestTransactions(account: string, url: string, pageInfo?: PageInfo): Promise<Transaction[]>
    }
}
export namespace RSS3BaseAPI {
    export interface GeneralAsset {
        platform: string
        identity: string
        id: string // contractAddress-id or admin_address
        type: string
        info: {
            collection?: string
            collection_icon?: string
            image_preview_url?: string | null
            animation_url?: string | null
            animation_original_url?: string | null
            title?: string
            total_contribs?: number
            token_contribs?: Array<{
                token: string
                amount: string
            }>
            start_date?: string
            end_date?: string
            country?: string
            city?: string
        }
    }

    export interface GeneralAssetWithTags extends GeneralAsset {
        tags?: string[]
    }

    export interface GeneralAssetResponse {
        status: boolean
        assets: GeneralAsset[]
    }

    export interface ProfileInfo {
        avatar: string[]
        bio: string
        name: string
    }

    export enum AssetType {
        GitcoinDonation = 'Gitcoin-Donation',
        POAP = 'POAP',
        NFT = 'NFT',
    }

    export interface NameInfo {
        rnsName: string
        ensName: string | null
        address: string
    }

    export interface Provider {
        createRSS3(address: string): RSS3
        getFileData<T>(rss3: RSS3, address: string, key: string): Promise<T | undefined>
        setFileData<T>(rss3: RSS3, address: string, key: string, data: T): Promise<T>
        getDonations(address: string): Promise<GeneralAssetResponse | undefined>
        getFootprints(address: string): Promise<GeneralAssetResponse | undefined>
        getNameInfo(id: string): Promise<NameInfo | undefined>
        getProfileInfo(address: string): Promise<ProfileInfo | undefined>
    }
}

export namespace PriceAPI {
    export interface Provider {
        getTokenPrice(
            address: string,
            currency: CurrencyType,
            chainId?: ChainId,
            nativeToken?: boolean,
        ): Promise<number>
        getTokensPrice(listOfAddress: string[], currency: CurrencyType): Promise<Record<string, number>>
    }
}

export namespace HistoryAPI {
    export interface Provider<ChainId, SchemaType> {
        getTransactions(
            address: string,
            options?: HubOptions<ChainId>,
        ): Promise<Pageable<Transaction<ChainId, SchemaType>>>
    }
}

export namespace GasOptionAPI {
    export interface Provider<ChainId, GasOption> {
        getGasOptions(chainId: ChainId): Promise<Record<GasOptionType, GasOption>>
    }
}

export namespace FungibleTokenAPI {
    export interface Provider<ChainId, SchemaType> {
        getAssets(address: string, options?: HubOptions<ChainId>): Promise<Pageable<FungibleAsset<ChainId, SchemaType>>>
    }
}

export namespace NonFungibleTokenAPI {
    export interface Provider<ChainId, SchemaType> {
        getAsset?: (
            address: string,
            tokenId: string,
            options?: HubOptions<ChainId>,
        ) => Promise<NonFungibleAsset<ChainId, SchemaType> | undefined>
        getAssets?: (address: string) => Promise<Array<NonFungibleAsset<ChainId, SchemaType>>>
        getHistory?: (
            address: string,
            tokenId: string,
            options?: HubOptions<ChainId>,
        ) => Promise<Array<NonFungibleTokenEvent<ChainId, SchemaType>>>
        getListings?: (
            address: string,
            tokenId: string,
            options?: HubOptions<ChainId>,
        ) => Promise<Array<NonFungibleTokenOrder<ChainId, SchemaType>>>
        getOffers?: (
            address: string,
            tokenId: string,
            opts?: HubOptions<ChainId>,
        ) => Promise<Array<NonFungibleTokenOrder<ChainId, SchemaType>>>
        getOrders?: (
            address: string,
            tokenId: string,
            side: OrderSide,
            options?: HubOptions<ChainId>,
        ) => Promise<Array<NonFungibleTokenOrder<ChainId, SchemaType>>>
        getToken?: (
            address: string,
            tokenId: string,
            options?: HubOptions<ChainId>,
        ) => Promise<NonFungibleToken<ChainId, SchemaType> | undefined>
        getTokens?: (
            from: string,
            opts?: HubOptions<ChainId>,
        ) => Promise<Pageable<NonFungibleToken<ChainId, SchemaType>>>
        getContract?: (
            address: string,
            opts?: HubOptions<ChainId>,
        ) => Promise<NonFungibleTokenContract<ChainId, SchemaType> | undefined>
        getContractBalance?: (address: string) => Promise<number>
        getCollections?: (
            address: string,
            options?: HubOptions<ChainId>,
        ) => Promise<Pageable<NonFungibleTokenCollection<ChainId> | undefined>>
    }
}

export namespace RiskWarningBaseAPI {
    export interface Provider {
        approve(address: string, pluginID?: string): Promise<void>
    }
}

export namespace StorageAPI {
    export interface Storage {
        set(key: string, value: any): Promise<void>
        get<T>(key: string): Promise<T | undefined>
        delete?(key: string): Promise<void>
    }

    export interface Provider {
        createJSON_Storage?(key: string): Storage
        createBinaryStorage?(key: string): Storage
    }
}

export namespace NextIDBaseAPI {
    export interface Storage {
        set<T>(
            uuid: string,
            personaPublicKey: string,
            signature: string,
            platform: NextIDPlatform,
            identity: string,
            createdAt: string,
            patchData: unknown,
            pluginId: string,
        ): Promise<Result<T, string>>
        getByIdentity<T>(
            key: string,
            platform: NextIDPlatform,
            identity: string,
            pluginId: string,
        ): Promise<Result<T, string>>
        get<T>(key: string): Promise<Result<T, string>>
        getPayload(
            personaPublicKey: string,
            platform: NextIDPlatform,
            identity: string,
            patchData: unknown,
            pluginId: string,
        ): Promise<Result<NextIDStoragePayload, string>>
    }
    export interface Proof {
        bindProof(
            uuid: string,
            personaPublicKey: string,
            action: NextIDAction,
            platform: string,
            identity: string,
            createdAt: string,
            options?: {
                walletSignature?: string
                signature?: string
                proofLocation?: string
            },
        ): Promise<Result<unknown, string>>

        queryExistedBindingByPersona(personaPublicKey: string, enableCache?: boolean): Promise<any>

        queryExistedBindingByPlatform(platform: NextIDPlatform, identity: string, page?: number): Promise<any>

        queryIsBound(
            personaPublicKey: string,
            platform: NextIDPlatform,
            identity: string,
            enableCache?: boolean,
        ): Promise<boolean>

        createPersonaPayload(
            personaPublicKey: string,
            action: NextIDAction,
            identity: string,
            platform: NextIDPlatform,
            language?: string,
        ): Promise<NextIDPayload | null>
    }
}

export namespace SecurityAPI {
    export interface Holder {
        address?: string
        locked?: '0' | '1'
        tag?: string
        is_contract?: '0' | '1'
        balance?: number
        percent?: number
    }

    export interface TradingSecurity {
        buy_tax?: string
        sell_tax?: string
        slippage_modifiable?: '0' | '1'
        is_honeypot?: '0' | '1'
        transfer_pausable?: '0' | '1'
        is_blacklisted?: '0' | '1'
        is_whitelisted?: '0' | '1'
        is_in_dex?: '0' | '1'
        is_anti_whale?: '0' | '1'
    }

    export interface ContractSecurity {
        is_open_source?: '0' | '1'
        is_proxy?: '0' | '1'
        is_mintable?: '0' | '1'
        owner_change_balance?: '0' | '1'
        can_take_back_ownership?: '0' | '1'
        owner_address?: string
        creator_address?: string
    }

    export interface TokenSecurity {
        token_name?: string
        token_symbol?: string

        holder_count?: number
        total_supply?: number
        holders?: Holder[]

        lp_holder_count?: number
        lp_total_supply?: number
        lp_holders?: Holder[]

        is_true_token?: '0' | '1'
        is_verifiable_team?: '0' | '1'
        is_airdrop_scam?: '0' | '1'
    }

    export interface SupportedChain<ChainId> {
        chainId: ChainId
        name: string
    }

    export interface Provider<ChainId> {
        getTokenSecurity(
            chainId: ChainId,
            listOfAddress: string[],
        ): Promise<Record<string, ContractSecurity & TokenSecurity & TradingSecurity> | void>
        getSupportedChain(): Promise<Array<SupportedChain<ChainId>>>
    }
}

export namespace TwitterBaseAPI {
    export interface NFTContainer {
        has_nft_avatar: boolean
        nft_avatar_metadata: AvatarMetadata
    }

    export interface AvatarMetadata {
        token_id: string
        smart_contract: {
            __typename: 'ERC721' | 'ERC1155'
            __isSmartContract: 'ERC721'
            network: 'Ethereum'
            address: string
        }
        metadata: {
            creator_username: string
            creator_address: string
            name: string
            description?: string
            collection: {
                name: string
                metadata: {
                    image_url: string
                    verified: boolean
                    description: string
                    name: string
                }
            }
            traits: Array<{
                trait_type: string
                value: string
            }>
        }
    }
    export interface AvatarInfo {
        nickname: string
        userId: string
        imageUrl: string
        mediaId: string
    }

    export interface Settings {
        screen_name: string
    }

    export interface TwitterResult {
        media_id: number
        media_id_string: string
        size: number
        image: {
            image_type: string
            w: number
            h: number
        }
    }

    export interface Provider {
        getSettings: () => Promise<Settings | undefined>
        getUserNftContainer: (screenName: string) => Promise<
            | {
                  address: string
                  token_id: string
                  type_name: string
              }
            | undefined
        >
        uploadUserAvatar: (screenName: string, image: Blob | File) => Promise<TwitterResult>
        updateProfileImage: (screenName: string, media_id_str: string) => Promise<AvatarInfo | undefined>
    }
}

export namespace InstagramBaseAPI {
    export interface Provider {
        uploadUserAvatar: (
            image: File | Blob,
            userId: string,
        ) => Promise<
            | {
                  changed_profile: boolean
                  profile_pic_url_hd: string
              }
            | undefined
        >
    }
}

export namespace TokenListBaseAPI {
    export interface Token<ChainId> {
        chainId: ChainId
        address: string
        name: string
        symbol: string
        decimals: number
        logoURI?: string
    }

    export interface TokenList<ChainId> {
        keywords: string[]
        logoURI: string
        name: string
        timestamp: string
        tokens: Array<Token<ChainId>>
        version: {
            major: number
            minor: number
            patch: number
        }
    }

    export interface TokenObject<ChainId> {
        tokens: Record<string, Token<ChainId>>
    }

    export interface Provider<ChainId, SchemaType> {
        fetchFungibleTokensFromTokenLists: (
            chainId: ChainId,
            urls: string[],
        ) => Promise<Array<FungibleToken<ChainId, SchemaType>>>
    }
}

export namespace MaskBaseAPI {
    export type Input = { id: number; data: api.IMWRequest }
    export type Output = { id: number; response: api.MWResponse }

    export type Request = InstanceType<typeof api.MWRequest>
    export type Response = InstanceType<typeof api.MWResponse>

    export type StoredKeyInfo = api.IStoredKeyInfo

    export interface Provider {}
}
