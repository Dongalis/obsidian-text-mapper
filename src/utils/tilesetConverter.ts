// utils/tilesetConverter.ts

function handleSvgDefinitions(content: string): string[] {
    const svgDefs: string[] = [];
    const lines = content.split('\n');
    let currentDef = '';
    let inDefinition = false;

    lines.forEach(line => {
        if (line.trim().match(/^<g\s+id=["']/)) {
            inDefinition = true;
            currentDef = line;
            // console.log("Started capturing SVG:", line.trim()); // Log when a capture starts
        } else if (inDefinition) {
            currentDef += '\n' + line;
        }

        if (inDefinition && line.includes('</g>')) {
            currentDef += '\n' + line;  // Ensure we close out the `<g>` group
            inDefinition = false;
            svgDefs.push(currentDef.trim());
            console.log("Captured SVG Definition:", currentDef.trim()); // Log the full SVG definition
            currentDef = '';
        }
    });

    console.log("Total SVG Definitions:", svgDefs.length);  // Count of SVGs captured
    return svgDefs;
}


// utils/tilesetConverter.ts
export function convertTextToTileSet(
    text: string,
    metadata: {
        name: string;
        description: string;
        author?: string;
        license?: string;
    }
): TileSet {
    console.log("Starting SVG Extraction");  // To confirm function call
    let svgDefinitions = handleSvgDefinitions(text);  // Extract SVGs
    console.log("SVG Definitions to Add:", svgDefinitions.length, svgDefinitions);  // Log extracted SVGs

  const lines = text.trim().split('\n').map(line => line.trim());
  const tiles: Record<string, TileDefinition> = {};
  let defaultAttributes = '';
  let textAttributes = '';
  let labelAttributes = '';
  // let svgDefinitions: string[] = [];
  let currentSvgDef = '';
  let inSvgDefinition = false;

  // Process each line
  lines.forEach(line => {
    if (!line || line.startsWith('#')) return; // Skip empty lines and comments

    // Handle SVG definitions
    if (line.startsWith('<g id="')) {
      inSvgDefinition = true;
      currentSvgDef = line;
      return;
    }

    if (inSvgDefinition) {
      currentSvgDef += '\n' + line;
      if (line.includes('</g>')) {
        inSvgDefinition = false;
        svgDefinitions.push(currentSvgDef);
        currentSvgDef = '';
      }
      return;
    }

    const parts = line.split(/\s+/);
    if (parts.length < 2) return;

    // Handle other definitions
    if (parts[0] === 'default' && parts[1] === 'attributes') {
      defaultAttributes = parts.slice(2).join(' ');
      return;
    }

    if (parts[0] === 'text' && !parts[1].startsWith('x=')) {
      textAttributes = parts.slice(1).join(' ');
      return;
    }

    if (parts[0] === 'label') {
      labelAttributes = parts.slice(1).join(' ');
      return;
    }

    // Handle tile definitions
    const tileId = parts[0];
    if (!tiles[tileId]) {
      tiles[tileId] = {
        id: tileId,
        paths: [],
        svgDefs: [],
        text: [],
      };
    }

    // Handle different tile properties
    if (parts[1] === 'attributes') {
      tiles[tileId].attributes = parts.slice(2).join(' ');
    } else if (parts[1] === 'path') {
      tiles[tileId].paths!.push(parts.slice(2).join(' '));
    } else if (parts[1] === 'text') {
      tiles[tileId].text!.push(parts.slice(2).join(' '));
    }
  });

  // Add SVG definitions to tiles
  svgDefinitions.forEach(def => {
    const match = def.match(/id\s*=\s*"([^"]+)"/); // More lenient ID capture
    if (match) {
      const id = match[1];
      console.log("SVG Definitions to Add:", svgDefinitions.length, svgDefinitions);
      if (tiles[id]) {
        tiles[id].svgDefs = tiles[id].svgDefs || [];
        tiles[id].svgDefs.push(def);
      } else {
        tiles[id] = {
          id: id,
          svgDefs: [def]
        };
      }
    }
  });

  return {
    ...metadata,
    defaultAttributes,
    textAttributes,
    labelAttributes,
    tiles
  };
  console.log("Converted tileset:", {
    metadata,
    defaultAttributes,
    textAttributes,
    labelAttributes,
    svgDefinitions,
    tiles: Object.keys(tiles).map(k => ({
      id: k,
      hasSvgDefs: tiles[k].svgDefs?.length || 0,
      svgDefs: tiles[k].svgDefs
    }))
  });
}

