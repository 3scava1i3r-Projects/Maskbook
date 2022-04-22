import { useCallback, useEffect, useState } from 'react'
import { makeStyles } from '@masknet/theme'
import { DialogContent } from '@mui/material'
import { openWindow, useRemoteControlledDialog, useValueRef } from '@masknet/shared-base-ui'
import { InjectedDialog } from '@masknet/shared'
import {
    getRegisteredWeb3Networks,
    getRegisteredWeb3Providers,
    NetworkPluginID,
    useNetworkDescriptor,
    useWeb3State,
    useWeb3UI,
    Web3Plugin,
} from '@masknet/plugin-infra/web3'
import { useI18N } from '../../../../utils/i18n-next-ui'
import { WalletMessages } from '../../messages'
import { hasNativeAPI, nativeAPI } from '../../../../../shared/native-rpc'
import { PluginProviderRender } from './PluginProviderRender'
import { pluginIDSettings } from '../../../../settings/settings'

const useStyles = makeStyles()((theme) => ({
    content: {
        padding: theme.spacing(0, 0, 1, 0),
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
            display: 'none',
        },
    },
}))

export interface SelectProviderDialogProps {}

export function SelectProviderDialog(props: SelectProviderDialogProps) {
    const { t } = useI18N()
    const { classes } = useStyles()

    // #region remote controlled dialog logic
    const { open, closeDialog } = useRemoteControlledDialog(WalletMessages.events.selectProviderDialogUpdated)
    const { setDialog: setConnectWalletDialog } = useRemoteControlledDialog(
        WalletMessages.events.connectWalletDialogUpdated,
    )
    // #endregion

    // #region native app
    useEffect(() => {
        if (!open) return
        if (hasNativeAPI) nativeAPI?.api.misc_openCreateWalletView()
    }, [open])
    // #endregion

    const networks = getRegisteredWeb3Networks()
    const providers = getRegisteredWeb3Providers()
    const pluginID = useValueRef(pluginIDSettings) as NetworkPluginID
    const network = useNetworkDescriptor()
    const [undeterminedPluginID, setUndeterminedPluginID] = useState(pluginID)
    const [undeterminedNetworkID, setUndeterminedNetworkID] = useState(network?.ID)

    const { Utils, Provider } = useWeb3State(undeterminedPluginID)
    const { NetworkIconClickBait, ProviderIconClickBait } = useWeb3UI(undeterminedPluginID).SelectProviderDialog ?? {}

    const onNetworkIconClicked = useCallback((network: Web3Plugin.NetworkDescriptor<number, string>) => {
        setUndeterminedPluginID(network.networkSupporterPluginID)
        setUndeterminedNetworkID(network.ID)
    }, [])

    const onProviderIconClicked = useCallback(
        async (
            network: Web3Plugin.NetworkDescriptor<number, string>,
            provider: Web3Plugin.ProviderDescriptor<number, string>,
        ) => {
            closeDialog()

            if (!(await Provider?.isReady(provider.type))) {
                const downloadLink = Utils?.resolveProviderHomeLink(provider.type)
                if (downloadLink) openWindow(downloadLink)
                return
            }

            // TODO:
            // refactor to use react-router-dom
            setConnectWalletDialog({
                open: true,
                network,
                provider,
            })
        },
        [Utils, Provider, closeDialog],
    )

    // not available for the native app
    if (hasNativeAPI) return null

    return (
        <InjectedDialog title={t('plugin_wallet_select_provider_dialog_title')} open={open} onClose={closeDialog}>
            <DialogContent className={classes.content}>
                <PluginProviderRender
                    networks={networks}
                    providers={providers}
                    undeterminedPluginID={undeterminedPluginID}
                    undeterminedNetworkID={undeterminedNetworkID}
                    onNetworkIconClicked={onNetworkIconClicked}
                    onProviderIconClicked={onProviderIconClicked}
                    NetworkIconClickBait={NetworkIconClickBait}
                    ProviderIconClickBait={ProviderIconClickBait}
                />
            </DialogContent>
        </InjectedDialog>
    )
}
