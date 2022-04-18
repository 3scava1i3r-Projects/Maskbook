import type { Plugin } from '@masknet/plugin-infra'
import { Provider } from './Provider'
import { AddressBook } from './AddressBook'
import { Asset } from './Asset'
import { Protocol } from './Protocol'
import { Settings } from './Settings'
import { TokenList } from './TokenList'
import { Transaction } from './Transaction'
import { Wallet } from './Wallet'
import { Utils } from './Utils'

export function createWeb3State(context: Plugin.SNSAdaptor.SNSAdaptorContext) {
    const Provider_ = new Provider(context)

    return {
        AddressBook: new AddressBook(context, {
            chainId: Provider_.chainId,
        }),
        Asset: new Asset(),
        Settings: new Settings(context),
        TokenList: new TokenList(context, {
            chainId: Provider_.chainId,
        }),
        Transaction: new Transaction(context, {
            chainId: Provider_.chainId,
            account: Provider_.account,
        }),
        Provider: Provider_,
        Protocol: new Protocol(context),
        Wallet: new Wallet(context),
        Utils: new Utils(),
    }
}
