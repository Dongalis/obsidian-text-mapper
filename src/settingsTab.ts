// settingsTab.ts
import { App, PluginSettingTab, Setting } from 'obsidian';
import TextMapperPlugin from './main';
import { TileSetConfig, TextMapperSettings } from './settings';

export class TextMapperSettingTab extends PluginSettingTab {
    plugin: TextMapperPlugin;

    constructor(app: App, plugin: TextMapperPlugin) {
        super(app, plugin);
        this.plugin = plugin;

        // Register event handler through the plugin instance
        this.plugin.registerEvent(
            app.workspace.on('text-mapper:tilesets-changed', () => {
                this.display();
            })
        );
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Text Mapper Settings' });

        // Default tileset setting
        new Setting(containerEl)
            .setName('Default Tileset')
            .setDesc('Choose the default tileset for new maps')
            .addDropdown(dropdown => {
                const configs = this.plugin.settings.tileSetConfigs.filter(c => c.enabled);
                configs.forEach(config => {
                    dropdown.addOption(config.id, config.name);
                });
                dropdown.setValue(this.plugin.settings.defaultTileSet || configs[0].id);
                dropdown.onChange(async (value) => {
                    this.plugin.settings.defaultTileSet = value;
                    await this.plugin.saveSettings();
                });
            });

        // External tileset folder setting
        new Setting(containerEl)
            .setName('External Tilesets Folder')
            .setDesc('Folder path for external tilesets (relative to vault root)')
            .addText(text => text
                .setPlaceholder('tilesets')
                .setValue(this.plugin.settings.externalTileSetFolder || '')
                .onChange(async (value) => {
                    this.plugin.settings.externalTileSetFolder = value;
                    await this.plugin.saveSettings();
                    await this.plugin.loadTileSets();
                }));

        // Builtin tilesets section
        containerEl.createEl('h3', { text: 'Built-in Tilesets' });

        const builtinTilesets = this.plugin.settings.tileSetConfigs.filter(c => c.builtin);
        builtinTilesets.forEach(config => {
            this.createTileSetToggle(containerEl, config);
        });

        // External tilesets section
        containerEl.createEl('h3', { text: 'External Tilesets' });

        const externalTilesets = this.plugin.settings.tileSetConfigs.filter(c => !c.builtin);
        if (externalTilesets.length === 0) {
            containerEl.createEl('p', {
                text: 'No external tilesets found. Add .ts files to your tilesets folder.'
            });
        } else {
            externalTilesets.forEach(config => {
                this.createTileSetToggle(containerEl, config);
            });
        }
    }

    private createTileSetToggle(containerEl: HTMLElement, config: TileSetConfig) {
        new Setting(containerEl)
            .setName(config.name)
            .setDesc(config.path || 'Built-in tileset')
            .addToggle(toggle => toggle
                .setValue(config.enabled)
                .onChange(async (value) => {
                    config.enabled = value;
                    await this.plugin.saveSettings();
                    await this.plugin.loadTileSets();
                }));
    }
}
