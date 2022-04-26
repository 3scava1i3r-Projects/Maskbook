import { WalletHeader } from '../components/WalletHeader'
import { WalletInfo } from '../components/WalletInfo'
import { Link, List, ListItem, ListItemText } from '@mui/material'
import { makeStyles } from '@masknet/theme'
import { EnterDashboard } from '../../../components/EnterDashboard'
import { BackUpIcon, CloudLinkIcon, TrashIcon } from '@masknet/icons'
import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PopupRoutes } from '@masknet/shared-base'
import { useI18N } from '../../../../../utils'
import { explorerResolver } from '@masknet/web3-shared-evm'
import { useChainId, useWallet } from '@masknet/plugin-infra/web3'
import { NetworkPluginID } from '@masknet/web3-shared-base'

const useStyles = makeStyles()({
    content: {
        flex: 1,
        backgroundColor: '#F7F9FA',
        display: 'flex',
        flexDirection: 'column',
    },
    list: {
        backgroundColor: '#ffffff',
        padding: 0,
    },
    item: {
        padding: 8,
        borderBottom: '1px solid #F7F9FA',
        cursor: 'pointer',
    },
    text: {
        margin: '0 0 0 15px',
        color: '#1C68F3',
        lineHeight: 1.5,
        fontWeight: 600,
        fontSize: 16,
    },
    icon: {
        fontSize: 20,
    },
})

const WalletSettings = memo(() => {
    const { t } = useI18N()
    const navigate = useNavigate()
    const chainId = useChainId(NetworkPluginID.PLUGIN_EVM)
    const wallet = useWallet(NetworkPluginID.PLUGIN_EVM)
    const { classes } = useStyles()
    return (
        <>
            <WalletHeader />
            <WalletInfo />
            <div className={classes.content}>
                <List dense className={classes.list}>
                    <ListItem className={classes.item} onClick={() => navigate(PopupRoutes.BackupWallet)}>
                        <BackUpIcon className={classes.icon} />
                        <ListItemText className={classes.text}>{t('popups_wallet_backup_wallet')}</ListItemText>
                    </ListItem>
                    {wallet?.configurable ? (
                        <ListItem className={classes.item} onClick={() => navigate(PopupRoutes.DeleteWallet)}>
                            <TrashIcon className={classes.icon} />
                            <ListItemText className={classes.text}>{t('delete_wallet')}</ListItemText>
                        </ListItem>
                    ) : null}
                    <Link
                        href={explorerResolver.addressLink(chainId, wallet?.address ?? '')}
                        target="_blank"
                        rel="noopener noreferrer">
                        <ListItem className={classes.item}>
                            <CloudLinkIcon className={classes.icon} />
                            <ListItemText className={classes.text}>{t('popups_wallet_view_on_explorer')}</ListItemText>
                        </ListItem>
                    </Link>
                </List>
            </div>
            <EnterDashboard />
        </>
    )
})

export default WalletSettings
