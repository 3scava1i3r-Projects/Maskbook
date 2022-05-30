import { useCompositionContext } from '@masknet/plugin-infra/content-script'
import { InjectedDialog } from '@masknet/shared'
import { useRemoteControlledDialog } from '@masknet/shared-base-ui'
import { makeStyles, MaskTabList, useTabs } from '@masknet/theme'
import { useAccount, useChainId } from '@masknet/web3-shared-evm'
import { TabContext, TabPanel } from '@mui/lab'
import { DialogContent, Tab } from '@mui/material'
import { useCallback, useState } from 'react'
import Web3Utils from 'web3-utils'
import {
    useCurrentIdentity,
    useCurrentLinkedPersona,
    useLastRecognizedIdentity,
} from '../../../components/DataSource/useActivatedUI'
import Services from '../../../extension/service'
import { useI18N } from '../locales'
import { WalletMessages } from '../../Wallet/messages'
import { RedPacketMetaKey } from '../constants'
import { DialogTabs, RedPacketJSONPayload, RpTypeTabs } from '../types'
import type { RedPacketSettings } from './hooks/useCreateCallback'
import { IconURLs } from './IconURL'
import { RedPacketConfirmDialog } from './RedPacketConfirmDialog'
import { RedPacketERC20Form } from './RedPacketERC20Form'
import { RedPacketERC721Form } from './RedPacketERC721Form'
import { HistoryIcon } from '@masknet/icons'
import { RedPacketPast } from './RedPacketPast'

const useStyles = makeStyles()((theme) => ({
    content: {
        position: 'relative',
        paddingTop: 50,
    },
    tabs: {
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    dialogContent: {
        padding: 0,
        minHeight: 326,
    },
    tabPaper: {
        position: 'sticky',
        top: 0,
        zIndex: 5000,
    },
    indicator: {
        display: 'none',
    },
    tab: {
        maxWidth: 120,
    },
    focusTab: {
        borderBottom: `2px solid ${theme.palette.primary.main}`,
    },
    flexContainer: {
        justifyContent: 'space-around',
    },
    test: {
        backgroundColor: 'blue',
    },
    tabWrapper: {
        padding: 0,
    },
    img: {
        width: 20,
        marginRight: 4,
    },
    labelWrapper: {
        display: 'flex',
    },
}))

enum CreateRedPacketPageStep {
    NewRedPacketPage = 'new',
    ConfirmPage = 'confirm',
}

interface RedPacketDialogProps extends withClasses<never> {
    open: boolean
    onClose: () => void
}

export default function RedPacketDialog(props: RedPacketDialogProps) {
    const t = useI18N()
    const chainId = useChainId()
    const account = useAccount()
    const { classes } = useStyles()
    const { attachMetadata, dropMetadata } = useCompositionContext()
    const state = useState(DialogTabs.create)
    const [showHistory, setShowHistory] = useState(false)
    const onShowHistory = () => {
        setShowHistory((history) => !history)
    }
    const [settings, setSettings] = useState<RedPacketSettings>()

    const onClose = useCallback(() => {
        if (showHistory) {
            setShowHistory(false)
            return
        }
        if (step === CreateRedPacketPageStep.ConfirmPage) {
            setStep(CreateRedPacketPageStep.NewRedPacketPage)
            return
        }
        setStep(CreateRedPacketPageStep.NewRedPacketPage)
        setSettings(undefined)
        const [, setValue] = state
        setValue(DialogTabs.create)
        props.onClose()
    }, [props, state, showHistory])

    const currentIdentity = useCurrentIdentity()

    const { value: linkedPersona } = useCurrentLinkedPersona()
    const lastRecognized = useLastRecognizedIdentity()
    const senderName =
        lastRecognized.identifier?.userId ?? currentIdentity?.identifier.userId ?? linkedPersona?.nickname
    const { closeDialog: closeApplicationBoardDialog } = useRemoteControlledDialog(
        WalletMessages.events.ApplicationDialogUpdated,
    )
    const onCreateOrSelect = useCallback(
        async (payload: RedPacketJSONPayload) => {
            if (payload.password === '') {
                if (payload.contract_version === 1) {
                    alert('Unable to share a lucky drop without a password. But you can still withdraw the lucky drop.')
                    payload.password = prompt('Please enter the password of the lucky drop:', '') ?? ''
                } else if (payload.contract_version > 1 && payload.contract_version < 4) {
                    // just sign out the password if it is lost.
                    payload.password = await Services.Ethereum.personalSign(
                        Web3Utils.sha3(payload.sender.message) ?? '',
                        account,
                    )
                    payload.password = payload.password!.slice(2)
                }
            }

            if (payload) {
                senderName && (payload.sender.name = senderName)
                attachMetadata(RedPacketMetaKey, payload)
            } else dropMetadata(RedPacketMetaKey)
            onClose()
            closeApplicationBoardDialog()
        },
        [onClose, chainId, senderName],
    )

    const [step, setStep] = useState(CreateRedPacketPageStep.NewRedPacketPage)
    const onBack = useCallback(() => {
        if (showHistory) {
            setShowHistory(false)
            return
        }
        if (step === CreateRedPacketPageStep.ConfirmPage) setStep(CreateRedPacketPageStep.NewRedPacketPage)
        setShowHistory(false)
    }, [step, showHistory])
    const onNext = useCallback(() => {
        if (step === CreateRedPacketPageStep.NewRedPacketPage) setStep(CreateRedPacketPageStep.ConfirmPage)
        setShowHistory(false)
    }, [step])

    const _onChange = useCallback((val: Omit<RedPacketSettings, 'password'>) => {
        setSettings(val)
    }, [])

    const tokenState = useState(RpTypeTabs.ERC20)

    const handleCreated = useCallback(
        (payload: RedPacketJSONPayload) => {
            onCreateOrSelect(payload)
            setSettings(undefined)
        },
        [onCreateOrSelect],
    )

    const isCreateStep = step === CreateRedPacketPageStep.NewRedPacketPage
    const title = isCreateStep ? t.display_name() : t.details()

    const [currentTab, onChange, tabs] = useTabs('tokens', 'collectibles')

    return (
        <TabContext value={currentTab}>
            <InjectedDialog
                open={props.open}
                title={title}
                titleTail={
                    step === CreateRedPacketPageStep.NewRedPacketPage ? <HistoryIcon onClick={onShowHistory} /> : null
                }
                titleTabs={
                    step === CreateRedPacketPageStep.NewRedPacketPage ? (
                        <MaskTabList variant="base" onChange={onChange} aria-label="Redpacket">
                            <Tab
                                label={
                                    <div className={classes.labelWrapper}>
                                        <img className={classes.img} src={IconURLs.erc20Token} />
                                        <span>{t.erc20_tab_title()}</span>
                                    </div>
                                }
                                value={tabs.tokens}
                            />
                            <Tab
                                label={
                                    <div className={classes.labelWrapper}>
                                        <img className={classes.img} src={IconURLs.erc721Token} />
                                        <span>{t.erc721_tab_title()}</span>
                                    </div>
                                }
                                value={tabs.collectibles}
                            />
                        </MaskTabList>
                    ) : null
                }
                onClose={onClose}
                disableTitleBorder>
                <DialogContent className={classes.dialogContent}>
                    {step === CreateRedPacketPageStep.NewRedPacketPage ? (
                        !showHistory ? (
                            <>
                                <TabPanel value={tabs.tokens} style={{ padding: 0 }}>
                                    <RedPacketERC20Form
                                        origin={settings}
                                        onClose={onClose}
                                        onNext={onNext}
                                        onChange={_onChange}
                                    />
                                </TabPanel>
                                <TabPanel value={tabs.collectibles} style={{ padding: 0 }}>
                                    <RedPacketERC721Form onClose={onClose} />
                                </TabPanel>
                            </>
                        ) : (
                            <RedPacketPast tabs={tabs} onSelect={onCreateOrSelect} onClose={onClose} />
                        )
                    ) : null}
                    {step === CreateRedPacketPageStep.ConfirmPage ? (
                        <RedPacketConfirmDialog
                            onClose={onClose}
                            onBack={onBack}
                            onCreated={handleCreated}
                            settings={settings}
                        />
                    ) : null}
                </DialogContent>
            </InjectedDialog>
        </TabContext>
    )
}
