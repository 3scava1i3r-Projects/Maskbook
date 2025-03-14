import type { Plugin } from '@masknet/plugin-infra'
import { ITO_MetaKey_1, ITO_MetaKey_2, ITO_PluginID } from './constants'

export const base: Plugin.Shared.Definition = {
    ID: ITO_PluginID,
    name: { fallback: 'ITO' },
    description: {
        fallback: 'Participate in Public Offering on Twitter.',
    },
    publisher: { name: { fallback: 'Mask Network' }, link: 'https://mask.io/' },
    enableRequirement: {
        architecture: { app: true, web: true },
        networks: {
            type: 'opt-out',
            networks: {},
        },
        target: 'stable',
    },
    contribution: { metadataKeys: new Set([ITO_MetaKey_1, ITO_MetaKey_2]) },
}
