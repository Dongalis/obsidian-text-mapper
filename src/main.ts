// main.ts
import { Plugin, TFile, MarkdownRenderChild } from 'obsidian';
import { ParseError } from './error';
import { TextMapperParser } from './parser';
import { TextMapperSettings, DEFAULT_SETTINGS } from './settings';
import { TextMapperSettingTab } from './settingsTab';
import { TileSetManager } from './tileSetManager';
import { GNOMEYLAND_TILESET } from './tilesets/gnomeyland';
import { APOCALYPSE_TILESET } from './tilesets/apocalypse';
import { SPACE_TILESET } from './tilesets/space';

// TextMapper class definition
export class TextMapper extends MarkdownRenderChild {
  textMapperEl: HTMLDivElement;
    
  constructor(containerEl: HTMLElement, docId: string, source: string) {
    super(containerEl);
    this.textMapperEl = this.containerEl.createDiv({ cls: "textmapper" });

    const parser = new TextMapperParser(docId);
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
        
    // Load built-in tilesets
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
        }
      });

    // Load external tilesets
    await this.loadExternalTileSets();

    // Add settings tab
    this.addSettingTab(new TextMapperSettingTab(this.app, this));

    // Register markdown processor
    this.registerMarkdownCodeBlockProcessor(
      "text-mapper",
      this.processMarkdown.bind(this)
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async loadExternalTileSets() {
    if (!this.settings.externalTileSetFolder) return;

    const folder = this.app.vault.getAbstractFileByPath(this.settings.externalTileSetFolder);
    if (!folder) return;

    // Get all .ts files in the folder
    const files = this.app.vault.getFiles()
      .filter(file =>
        file.path.startsWith(this.settings.externalTileSetFolder!) &&
          file.extension === 'ts'
      );

    for (const file of files) {
      try {
        const content = await this.app.vault.read(file);
                
        // Simple validation to check if it's a tileset file
        if (content.includes('export const') && content.includes('TileSet')) {
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
          }
        }
      } catch (e) {
        console.error(`Error loading tileset from ${file.path}:`, e);
      }
    }
  }

  async loadTileSets() {
    // Clear existing tilesets
    this.tileSetManager = new TileSetManager();

    // Load built-in tilesets
    const builtinTileSets = {
      'gnomeyland': GNOMEYLAND_TILESET,
      'apocalypse': APOCALYPSE_TILESET,
      'space': SPACE_TILESET
    };

    // Load enabled built-in tilesets
    for (const config of this.settings.tileSetConfigs) {
      if (config.builtin && config.enabled) {
        const tileSet = builtinTileSets[config.id];
        if (tileSet) {
          this.tileSetManager.registerTileSet(tileSet);
        }
      }
    }

    // Load external tilesets
    if (this.settings.externalTileSetFolder) {
      const tilesetFiles = this.app.vault.getFiles()
        .filter(file =>
          file.path.startsWith(this.settings.externalTileSetFolder!) &&
            file.extension === 'ts'
        );

      for (const file of tilesetFiles) {
        const tileSetId = file.basename.toLowerCase();
        const config = this.settings.tileSetConfigs.find(c => c.id === tileSetId);

        if (config?.enabled) {
          const tileset = await TilesetLoader.loadTilesetFile(file, this.app.vault);
          if (tileset) {
            this.tileSetManager.registerTileSet(tileset);
            console.log(`Loaded external tileset: ${tileset.name}`);
          }
        }
      }
    }
  }

  async processMarkdown(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ): Promise<any> {
    try {
      // Parse the source to check for tile set selection
      const lines = source.split('\n');
      const tileSetLines = lines.filter(line => line.startsWith('use tileset'));

      console.log("Available tilesets:", this.tileSetManager.getAllTileSets());
      console.log("Enabled tilesets:", this.tileSetManager.getAllTileSets().map(ts => ts.name));


      // Convert all registered tile sets to Text Mapper format
      const tileSetDefinitions: string[] = [];
      for (const tileSet of this.tileSetManager.getAllTileSets()) {
        const converted = this.tileSetManager.convertToTextMapperFormat(tileSet);
        console.log(`Converted tileset ${tileSet.name}:`, converted);
        tileSetDefinitions.push(...converted);
      }

      // Combine source with tile set definitions
      const fullSource = [...lines, ...tileSetDefinitions].join('\n');

      // Log the combined source
      console.log("Loading markdown:", source);
      console.log("Source lines:", lines.length);
      console.log("Tileset definitions:", tileSetDefinitions);
      console.log("Full source after combining:", fullSource);

      // // In processMarkdown:
      // for (const tileSet of this.tileSetManager.getAllTileSets()) {
      //   console.log(`Tileset ${tileSet.name} contents:`, {
      //     defaultAttributes: tileSet.defaultAttributes,
      //     tileCount: Object.keys(tileSet.tiles).length,
      //     tileIds: Object.keys(tileSet.tiles),
      //     svgDefs: Object.values(tileSet.tiles)
      //       .filter(t => t.svgDefs)
      //       .map(t => t.id)
      //   });
      //   const converted = this.tileSetManager.convertToTextMapperFormat(tileSet);
      //   console.log(`Converting tileset ${tileSet.name}, got ${converted.length} definitions:`, converted);
      // }

      console.log("SVG IDs in final source:", fullSource.match(/id="([^"]+)"/g));

      ctx.addChild(new TextMapper(el, ctx.docId, fullSource));
    } catch (e) {
      console.error("Text mapper error", e);
      ctx.addChild(new ParseError(el));
    }
  }
}
