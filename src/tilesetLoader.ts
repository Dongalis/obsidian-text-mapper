// tilesetLoader.ts
import { TileSet } from './types';
import { TFile } from 'obsidian';

export class TilesetLoader {
    // Method to validate tileset content
    static validateTilesetContent(content: string): boolean {
        try {
            // More flexible validation pattern
            const tilesetPattern = /export\s+const\s+\w+(_TILESET)?\s*=\s*{[\s\S]*}/;
            const hasTilesetStructure = tilesetPattern.test(content);

            // Log validation details for debugging
            console.log('Validating tileset content:', {
                content: content.substring(0, 100) + '...', // First 100 chars
                hasTilesetStructure,
            });

            return hasTilesetStructure;
        } catch (error) {
            console.error('Error in tileset validation:', error);
            return false;
        }
    }

    // Method to safely evaluate tileset content
    static async loadTilesetFromContent(content: string): Promise<TileSet | null> {
        try {
            // Remove the export statement and create a standard object
            const processedContent = content
                .replace(/export\s+const\s+\w+(_TILESET)?\s*=\s*/, 'return ');

            // Create a safe evaluation context
            const contextFunction = new Function(`
                "use strict";
                ${processedContent}
            `);

            // Execute in safe context
            const tilesetData = contextFunction();

            // Validate the structure
            if (this.validateTilesetStructure(tilesetData)) {
                return tilesetData;
            }

            console.error('Invalid tileset structure:', tilesetData);
            return null;
        } catch (error) {
            console.error('Error evaluating tileset:', error);
            return null;
        }
    }

    // Validate the loaded tileset data structure
    static validateTilesetStructure(data: any): data is TileSet {
        const isValid = Boolean(
            data &&
            typeof data === 'object' &&
            typeof data.name === 'string' &&
            typeof data.description === 'string' &&
            typeof data.tiles === 'object' &&
            Object.keys(data.tiles).length > 0
        );

        // Log validation details for debugging
        console.log('Tileset structure validation:', {
            hasData: Boolean(data),
            isObject: typeof data === 'object',
            hasName: data && typeof data.name === 'string',
            hasDescription: data && typeof data.description === 'string',
            hasTiles: data && typeof data.tiles === 'object',
            tilesNotEmpty: data && data.tiles && Object.keys(data.tiles).length > 0,
            isValid
        });

        return isValid;
    }

    // Main method to load a tileset file
    static async loadTilesetFile(file: TFile, vault: any): Promise<TileSet | null> {
        try {
            // Read the file content
            const content = await vault.read(file);
            console.log(`Loading tileset file ${file.path}`);

            // Validate basic structure
            if (!this.validateTilesetContent(content)) {
                console.warn(`File ${file.path} doesn't appear to be a valid tileset`);
                return null;
            }

            // Load and return the tileset
            const tileset = await this.loadTilesetFromContent(content);
            if (tileset) {
                console.log(`Successfully loaded tileset: ${tileset.name}`);
            }
            return tileset;
        } catch (error) {
            console.error(`Error loading tileset file ${file.path}:`, error);
            return null;
        }
    }
}
