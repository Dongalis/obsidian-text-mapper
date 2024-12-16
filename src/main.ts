// main.ts
import { Plugin, TFile, MarkdownRenderChild } from 'obsidian';
import { ParseError } from './error';
import { TextMapperParser } from './parser';
import { TextMapperSettings, DEFAULT_SETTINGS } from './settings';
import { TextMapperSettingTab } from './settingsTab';
import { TileSetManager } from './tileSetManager';
import { TilesetLoader} from './tilesetLoader';
import { HexFlowerCalculator } from './HexFlowerCalculator';

import { GNOMEYLAND_TILESET } from './tilesets/gnomeyland';
import { APOCALYPSE_TILESET } from './tilesets/apocalypse';
import { SPACE_TILESET } from './tilesets/space';

// TextMapper class definition
export class TextMapper extends MarkdownRenderChild {
    textMapperEl: HTMLDivElement;
    private plugin: TextMapperPlugin;  // Add plugin property

  constructor(containerEl: HTMLElement, docId: string, source: string, plugin: TextMapperPlugin) {
    super(containerEl);
    this.plugin = plugin;  // Store plugin reference

    // Create button container first
    const buttonContainer = containerEl.createDiv({
      cls: "textmapper-export-buttons"
    });

    // Create export button
    buttonContainer.createEl('button', {
      text: '📥 Download Map',
      cls: 'textmapper-download',
      onclick: async () => {
        const button = buttonContainer.querySelector('button');
        if (button) {
          const originalText = button.textContent;
          button.textContent = '⏳ Exporting...';
          button.disabled = true;

          try {
            const svg = this.textMapperEl.querySelector('svg');
            if (!svg) return;

            // Get current file name using stored plugin reference
            const activeFile = this.plugin.app.workspace.getActiveFile();
            const baseName = activeFile ? activeFile.basename : 'map';

            const width = svg.clientWidth || parseInt(svg.getAttribute('width') || '800');
            const height = svg.clientHeight || parseInt(svg.getAttribute('height') || '600');

            const canvas = document.createElement('canvas');
            const scale = 4;
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.scale(scale, scale);
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const URL = window.URL || window.webkitURL || window;
            const svgUrl = URL.createObjectURL(svgBlob);

            const img = new Image();
            img.src = svgUrl;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, width, height);

            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `${baseName}.png`;
            a.click();

            URL.revokeObjectURL(svgUrl);
          } finally {
            if (button) {
              button.textContent = originalText;
              button.disabled = false;
            }
          }
        }
      }
    });

    this.textMapperEl = this.containerEl.createDiv({ cls: "textmapper" });
    const parser = new TextMapperParser(docId, this.app);
    parser.process(source.split('\n'));
    parser.svg(this.textMapperEl);
  }
}

export default class TextMapperPlugin extends Plugin {
  settings: TextMapperSettings;
  tileSetManager: TileSetManager;

  async onload() {
    await this.loadSettings();
    this.tileSetManager = new TileSetManager();

    // Initial load of all tilesets
    await this.loadTileSets();

    // Add settings tab
    this.addSettingTab(new TextMapperSettingTab(this.app, this));

    // Register markdown processor
    this.registerMarkdownCodeBlockProcessor(
      "text-mapper",
      this.processMarkdown.bind(this)
    );

    // Add event listener for settings changes
    this.registerEvent(
      this.app.workspace.on('text-mapper:settings-changed', async () => {
        await this.loadTileSets();
      })
    );

    // Monitor vault changes for external tilesets
    this.registerEvent(
      this.app.vault.on('create', async (file) => {
        if (this.isExternalTilesetFile(file)) {
          console.log('New tileset file detected:', file.path);
          await this.loadTileSets();
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('modify', async (file) => {
        if (this.isExternalTilesetFile(file)) {
          console.log('Tileset file modified:', file.path);
          await this.loadTileSets();
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('delete', async (file) => {
        if (this.isExternalTilesetFile(file)) {
          console.log('Tileset file deleted:', file.path);
          // Remove from settings if it exists
          const tileSetId = file.basename.toLowerCase();
          this.settings.tileSetConfigs = this.settings.tileSetConfigs
            .filter(config => config.id !== tileSetId);
          await this.saveSettings();
          await this.loadTileSets();
        }
      })
    );
  }

  private isExternalTilesetFile(file: TFile): boolean {
    return (
      this.settings.externalTileSetFolder &&
        file.path.startsWith(this.settings.externalTileSetFolder) &&
        file.extension === 'ts'
    );
  }


  // In main.ts
  async loadTileSets() {
    // Clear existing tilesets
    this.tileSetManager = new TileSetManager();

    // Load built-in tilesets first
    const builtinTileSets = {
      'gnomeyland': GNOMEYLAND_TILESET,
      'apocalypse': APOCALYPSE_TILESET,
      'space': SPACE_TILESET
    };

    // Register enabled built-in tilesets
    this.settings.tileSetConfigs
      .filter(config => config.builtin && config.enabled)
      .forEach(config => {
        const tileSet = builtinTileSets[config.id];
        if (tileSet) {
          this.tileSetManager.registerTileSet(tileSet);
          console.log(`Registered built-in tileset: ${config.id}`);
        }
      });

    // Handle external tilesets
    if (this.settings.externalTileSetFolder) {
      // Get all current tileset files
      const tilesetFiles = this.app.vault.getFiles()
        .filter(file => this.isExternalTilesetFile(file));

      // Create a set of current tileset IDs
      const currentTilesetIds = new Set(tilesetFiles.map(file => file.basename.toLowerCase()));

      // Remove configurations for files that no longer exist
      this.settings.tileSetConfigs = this.settings.tileSetConfigs.filter(config => {
        if (!config.builtin && !currentTilesetIds.has(config.id)) {
          console.log(`Removing stale tileset config: ${config.id}`);
          return false;
        }
        return true;
      });

      // Save settings after cleanup
      await this.saveSettings();

      // Load existing external tilesets
      for (const file of tilesetFiles) {
        const tileSetId = file.basename.toLowerCase();

        // Add to settings if not already present
        if (!this.settings.tileSetConfigs.some(c => c.id === tileSetId)) {
          this.settings.tileSetConfigs.push({
            id: tileSetId,
            name: file.basename,
            enabled: false,
            path: file.path,
            builtin: false
          });
          await this.saveSettings();
          console.log(`Added new tileset to settings: ${tileSetId}`);
        }

        // Load enabled tilesets
        const config = this.settings.tileSetConfigs.find(c => c.id === tileSetId);
        if (config?.enabled) {
          try {
            const tileset = await TilesetLoader.loadTilesetFile(file, this.app.vault);
            if (tileset) {
              this.tileSetManager.registerTileSet(tileset);
              console.log(`Loaded external tileset: ${tileset.name}`);
            }
          } catch (error) {
            console.error(`Error loading external tileset ${tileSetId}:`, error);
          }
        }
      }
    }

    // Trigger UI refresh
    this.app.workspace.trigger('text-mapper:tilesets-changed');
  }

   async processMarkdown(
        source: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
    ): Promise<any> {
        try {
            const lines = source.split('\n');
            // Convert all registered tile sets to Text Mapper format
            const tileSetDefinitions = this.tileSetManager.convertToTextMapperFormat();
            // Combine source with tile set definitions
            const fullSource = [...tileSetDefinitions, ...lines].join('\n');
            // Log for debugging
            console.log("Processing markdown with", tileSetDefinitions.length, "tileset definitions");
            // Create the TextMapper instance - now with plugin reference
            ctx.addChild(new TextMapper(el, ctx.docId, fullSource, this));
        } catch (e) {
            console.error("Text mapper error", e);
            ctx.addChild(new ParseError(el));
        }
    }


  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

}
