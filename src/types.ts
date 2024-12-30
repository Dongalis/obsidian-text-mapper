// types.ts
export interface TileDefinition {
    id: string;
    attributes?: string;
    paths?: string[];
    text?: string[];
    svgDefs?: string[];  // Add this line
    label?: string;
    coordinates?: string;
    glow?: string;
}

export interface TileSet {
    name: string;
    description: string;
    author?: string;
    license?: string;
    defaultAttributes?: string;
    tiles: Record<string, TileDefinition>;
}

// Support hexflower alternate numbering
export interface HexMapping {
    displayValue: string;  // What to show (e.g., "A1", "AG")
    coordinate: string;    // The actual hex coordinate (e.g., "1001")
}

export interface HexFlower {
    letter: string;       // Region letter (e.g., "A")
    center: string;       // Center coordinate (e.g., "1001")
    mappings: HexMapping[];
}

export interface HexFlowerOptions {
   counterclockwise: boolean;
   flowerStart: FlowerDirection;
}

// Example of how a tile set would be defined
export const EXAMPLE_TILESET: TileSet = {
    name: "Example Fantasy",
    description: "A basic fantasy tileset with common terrain types",
    author: "Jane Smith",
    license: "MIT",
    defaultAttributes: 'font-family="Helvetica" font-size="12pt"',
    tiles: {
        forest: {
            id: "forest",
            paths: [
                "M 0,0 L 10,10 L 20,0 Z",
                "M 5,5 L 15,15 L 25,5 Z"
            ],
            attributes: 'fill="green"'
        },
        mountain: {
            id: "mountain",
            paths: ["M 0,20 L 10,0 L 20,20 Z"],
            attributes: 'fill="gray"'
        }
    }
}
