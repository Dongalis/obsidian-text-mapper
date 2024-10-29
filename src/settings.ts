// settings.ts
import { TileSet } from './types';

export interface TileSetConfig {
    id: string;
    name: string;
    enabled: boolean;
    path?: string;  // For external tilesets
    builtin: boolean;
}

export interface TextMapperSettings {
    tileSetConfigs: TileSetConfig[];
    externalTileSetFolder?: string;
    defaultTileSet?: string;
}

export const DEFAULT_SETTINGS: TextMapperSettings = {
    tileSetConfigs: [
        { id: 'gnomeyland', name: 'Gnomeyland', enabled: true, builtin: true },
        { id: 'apocalypse', name: 'Apocalypse', enabled: false, builtin: true },
        { id: 'space', name: 'Space', enabled: false, builtin: true }
    ]
};
