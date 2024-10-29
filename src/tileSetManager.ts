// tileSetManager.ts
import { TileSet } from './types';

export class TileSetManager {
  private tileSets: Map<string, TileSet> = new Map();
  private combinedSvgDefs: string[] = []; // New property for centralized SVG defs
  private combinedDefaultAttributes: string = ''; // New property for default attributes

  registerTileSet(tileSet: TileSet) {
    if (this.tileSets.has(tileSet.name)) {
      console.warn(`Tile set ${tileSet.name} already registered. Overwriting.`);
    }
    this.tileSets.set(tileSet.name, tileSet);

    // Combine SVG definitions
    if (tileSet.tiles) {
      Object.values(tileSet.tiles).forEach(tile => {
        if (tile.svgDefs) {
          this.combinedSvgDefs.push(...tile.svgDefs); // Add SVG defs to central storage
        }
      });
    }

    // Combine default attributes
    if (tileSet.defaultAttributes) {
      this.combinedDefaultAttributes += ` ${tileSet.defaultAttributes}`;
    }
  }

  // Accessor to retrieve combined SVG definitions
  getCombinedSvgDefs(): string[] {
    return this.combinedSvgDefs;
  }

  // Accessor for combined default attributes
  getCombinedDefaultAttributes(): string {
    return this.combinedDefaultAttributes.trim();
  }

  // Convert tile set definitions to Text Mapper format
  convertToTextMapperFormat(): string[] {
    const lines: string[] = [];

    console.log("Converting all registered tilesets to text format");

    // Add combined default attributes if any
    const defaultAttributes = this.getCombinedDefaultAttributes();
    if (defaultAttributes) {
      lines.push(`default attributes ${defaultAttributes}`);
    }

    // Add SVG definitions from all tilesets at the start
    const svgDefs = this.getCombinedSvgDefs();
    if (svgDefs.length > 0) {
      lines.push(...svgDefs);
    }

    // Iterate through each tileset to add individual tile properties
    this.tileSets.forEach(tileSet => {
      if (tileSet.textAttributes) {
        lines.push(`text ${tileSet.textAttributes}`);
      }

      if (tileSet.labelAttributes) {
        lines.push(`label ${tileSet.labelAttributes}`);
      }

      Object.values(tileSet.tiles).forEach(tile => {
        if (tile.attributes) {
          lines.push(`${tile.id} attributes ${tile.attributes}`);
        }

        if (tile.paths) {
          tile.paths.forEach(path => {
            lines.push(`${tile.id} path ${path}`);
          });
        }
      });
    });

    console.log(`Converted all tilesets with ${lines.length} lines. Combined SVG defs included:`,
      lines.filter(l => l.includes('<g id=')));

    return lines;
  }

}
