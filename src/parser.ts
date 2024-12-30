import { App } from "obsidian";
import {
  ATTRIBUTES_REGEX,
  PATH_ATTRIBUTES_REGEX,
  OPTION_REGEX,
  PATH_OPTIONS_REGEX,
  PATH_REGEX,
  XML_REGEX,
  TEXT_REGEX,
  GLOW_REGEX,
  LABEL_REGEX,
  HEX_REGEX,
  HEX_LABEL_REGEX,
  SPLINE_REGEX,
  SPLINE_ELEMENT_SPLIT_REGEX,
  SPLINE_POINT_REGEX,
  ATTRIBUTE_MAP_REGEX,
  SVGElement,
  SVG_CHOMP_WHITESPACE_REGEX,
  SVG_ID_REGEX,
  SVG_HREF_REGEX,
} from "./constants";
import { Point, Orientation } from "./orientation";
import { Region } from "./region";
import { Spline } from "./spline";
import { FlowerDirection, HexFlowerCalculator } from './HexFlowerCalculator';



// Add new regex for sequence format
const HEX_SEQUENCE_REGEX = /^(\d\d)(\d\d)-(\d\d)(\d\d)\s+(?!\b(?:trail|river)\b)(.*)/;

// https://alexschroeder.ch/cgit/text-mapper/tree/lib/Game/TextMapper/Mapper.pm
export class TextMapperParser {
  id: string;
  pathId: number;
  options: any;
  regions: Region[]; // ' => sub { [] };
  attributes: any; // ' => sub { {} };
  defs: string[]; // ' => sub { [] };
  path: any; // ' => sub { {} };
  splines: Spline[]; // ' => sub { [] };
  pathAttributes: any; // ' => sub { {} };
  textAttributes: any;
  glowAttributes: any;
  labelAttributes: any;
  private app: App;
  orientation: Orientation;
  // messages: string[]; // ' => sub { [] };

  constructor(id: string, app: App) {
    this.id = id;
    this.app = app;
    this.options = {
      horizontal: false,
      "coordinates-format": "{X}{Y}",
      "swap-even-odd": false,
      global: false,
      "counterclockwise": false,
      "flower-start": FlowerDirection.North,
      pathFrequency: 1,
      pathDepth: 0.1,
      pathRate: 0.1
    };
    this.regions = [];
    this.attributes = {};
    this.defs = [];
    this.path = {};
    this.splines = [];
    this.pathAttributes = {};
    this.textAttributes = "";
    this.glowAttributes = "";
    this.labelAttributes = "";
  }

  /**
   * Append the parser ID to a string. In practice, the parser ID is the
   * Obsidian document ID. This function is used when setting the `id`
   * attribute of SVG elements, so that the attribute is unique to a given
   * map, which prevents path definitions from carrying over in
   * documents with more than one map.
   */
  private namespace(what: string) {
    if (this.options.global) {
      return `${what}`;
    }
    return `${what}-${this.id}`;
  }

  /**
   * Process the source code of a map, line by line.
   */
  process(lines: string[]) {
    Region.initialize();
    this.pathId = 0;
    const hexflowers: {letter: string, center: string}[] = [];

    // First, set all options.
    for (const line of lines) {
      if (line.startsWith("#")) {
        continue;
      }
      if (OPTION_REGEX.test(line)) {
        const match = line.match(OPTION_REGEX);
        const option = this.parseOption(match[1]);
        if (option.key === "hexflower") {
          hexflowers.push({
            letter: option.letter,
            center: option.center
          });
        }
      }
    }

    // Now process hexflowers with final options
    hexflowers.forEach(({letter, center}) => {
      Region.addHexFlower(letter, center, this.options);
    });

    if (this.options.horizontal) {
      this.orientation = new Orientation(
        false,
        this.options["swap-even-odd"]
      );
    } else {
      this.orientation = new Orientation(
        true,
        this.options["swap-even-odd"]
      );
    }

    // Then process all other lines
    for (const line of lines) {
      if (line.startsWith("#")) {
        continue;
      }

      // Try sequence format first
      if (HEX_SEQUENCE_REGEX.test(line)) {
        const regions = this.parseSequence(line);
        this.regions.push(...regions);
      }
        // Fall back to standard hex format
      else if (HEX_REGEX.test(line)) {
        const region = this.parseRegion(line);
        this.regions.push(region);
      }
      else if (HEX_REGEX.test(line)) {
        const region = this.parseRegion(line);
        this.regions.push(region);
      } else if (SPLINE_REGEX.test(line)) {
        const spline = this.parsePath(line);
        this.splines.push(spline);
      } else if (ATTRIBUTES_REGEX.test(line)) {
        const match = line.match(ATTRIBUTES_REGEX);
        this.attributes[match[1]] = this.parseAttributes(match[2]);
      } else if (XML_REGEX.test(line)) {
        const match = line.match(XML_REGEX);
        this.def(match[1]);
      } else if (PATH_ATTRIBUTES_REGEX.test(line)) {
        const match = line.match(PATH_ATTRIBUTES_REGEX);
        this.pathAttributes[match[1]] = this.parseAttributes(match[2]);
      } else if (PATH_REGEX.test(line)) {
        const match = line.match(PATH_REGEX);
        this.path[match[1]] = match[2];
      } else if (TEXT_REGEX.test(line)) {
        const match = line.match(TEXT_REGEX);
        this.textAttributes = this.parseAttributes(match[1]);
      } else if (GLOW_REGEX.test(line)) {
        const match = line.match(GLOW_REGEX);
        this.glowAttributes = this.parseAttributes(match[1]);
      } else if (LABEL_REGEX.test(line)) {
        const match = line.match(LABEL_REGEX);
        this.labelAttributes = this.parseAttributes(match[1]);
      }
    }
  }


  parseSequence(line: string): Region[] {
    const match = line.match(HEX_SEQUENCE_REGEX);
    if (!match) return [];

    const [_, startX, startY, endX, endY, rest] = match;
    const regions: Region[] = [];

    const x1 = parseInt(startX);
    const y1 = parseInt(startY);
    const x2 = parseInt(endX);
    const y2 = parseInt(endY);

    // Handle both horizontal and vertical sequences
    if (y1 === y2) {
      // Horizontal sequence
      const step = x1 <= x2 ? 1 : -1;
      for (let x = x1; step > 0 ? x <= x2 : x >= x2; x += step) {
        const region = this.makeRegion(
          x.toString().padStart(2, '0'),
          y1.toString().padStart(2, '0'),
          "00"
        );
        this.applyAttributes(region, rest);
        regions.push(region);
      }
    } else if (x1 === x2) {
      // Vertical sequence
      const step = y1 <= y2 ? 1 : -1;
      for (let y = y1; step > 0 ? y <= y2 : y >= y2; y += step) {
        const region = this.makeRegion(
          x1.toString().padStart(2, '0'),
          y.toString().padStart(2, '0'),
          "00"
        );
        this.applyAttributes(region, rest);
        regions.push(region);
      }
    }

    return regions;
  }

  private applyAttributes(region: Region, rest: string): void {
    // Handle labels if present
    while (HEX_LABEL_REGEX.test(rest)) {
      const labelMatch = rest.match(HEX_LABEL_REGEX);
      region.label = labelMatch[1];
      region.size = labelMatch[2];
      rest = rest.replace(HEX_LABEL_REGEX, "");
    }

    // Apply types
    const types = rest.split(/\s+/).filter((t) => t.length > 0);
    region.types = types;
  }

  parseRegion(line: string) {
    // hex
    const match = line.match(HEX_REGEX);
    const region = this.makeRegion(match[1], match[2], match[3] || "00");
    let rest = match[4];
    while (HEX_LABEL_REGEX.test(rest)) {
      const labelMatch = rest.match(HEX_LABEL_REGEX);
      region.label = labelMatch[1];
      region.size = labelMatch[2];
      rest = rest.replace(HEX_LABEL_REGEX, "");
    }
    const types = rest.split(/\s+/).filter((t) => t.length > 0);
    region.types = types;
    return region;
  }

  parsePath(line: string) {
    const match = line.match(SPLINE_REGEX);
    const spline = this.makeSpline();
    spline.types = match[2];
    spline.label = match[3];
    spline.side = match[4];
    spline.start = match[5];

    
    // Parse curve options
    const pathOptions = {};
    const optionsMatch = line.matchAll(PATH_OPTIONS_REGEX);
    for (const match of optionsMatch) {
      const [_, key, value] = match;
      pathOptions[key] = parseFloat(value);
    }
    spline.pathOptions = pathOptions;
    console.log("Spline path options:", spline.pathOptions);

    let rest = line;
    while (true) {
      let segment: string;
      [segment, rest] = this.splitPathSegments(rest);
      if (segment === null) {
        break;
      }
      const pointMatch = segment.match(SPLINE_POINT_REGEX);
      spline.addPoint(pointMatch[1], pointMatch[2]);
    }
    return spline;
}

  private splitPathSegments(splinePath: string): [string, string] {
    let match = splinePath.match(SPLINE_ELEMENT_SPLIT_REGEX);
    if (match === null) {
      return [null, splinePath];
    }
    return [match[1], match[2]];
  }

  def(what: string) {
    let svg = what.replace(SVG_CHOMP_WHITESPACE_REGEX, "$1$3");
    let match;
    while ((match = SVG_ID_REGEX.exec(svg))) {
      svg = svg.replace(
        match[0],
        `${match[1]}${this.namespace(match[2])}${match[3]}`
      );
    }
    while ((match = SVG_HREF_REGEX.exec(svg))) {
      svg = svg.replace(
        match[0],
        `${match[1]}${this.namespace(match[2])}${match[3]}`
      );
    }
    this.defs.push(svg);
  }

    makeRegion(x: string, y: string, z: string): Region {
      const region = new Region(this.namespace.bind(this), this.app, this.options);
    region.x = parseInt(x);
    region.y = parseInt(y);
    region.id = `hex.${region.x}.${region.y}`;
    return region;
  }

  makeSpline(): Spline {
    const spline = new Spline(this.options);
    spline.curvatureAmount = this.options.pathCurvature || 0.1;
    this.pathId++;
    spline.id = this.namespace(`path-${this.pathId}`);
    return spline;
  }

  parseAttributes(attrs: string): any {
    const output: any = {};
    let matches;
    while ((matches = ATTRIBUTE_MAP_REGEX.exec(attrs))) {
      output[matches[1]] = matches[2];
    }
    return output;
  }

  /**
   * This parses custom options which allow for turning on and off different
   * rendering options. For an option set in a map like this:
   *
   * option NAME X Y Z
   *
   * The parameters will be parsed into a string[]: ["NAME", "X", "Y", "Z"]
   * The key would be "NAME".
   */
  parseOption(optionStr: string): any {
    const tokens = optionStr.split(" ");
    if (tokens.length < 1) {
        return { valid: false };
    }

    console.log("Parsing option:", {
    optionStr,
    tokens
    });

    const option: any = {
        valid: false,
        key: tokens[0],
        value: ""
    };

    switch (option.key) {
      case "flower-start": {
        const dirMap: {[key: string]: FlowerDirection} = {
          "north": FlowerDirection.North,
          "northeast": FlowerDirection.Northeast,
          "southeast": FlowerDirection.Southeast,
          "south": FlowerDirection.South,
          "southwest": FlowerDirection.Southwest,
          "northwest": FlowerDirection.Northwest,
          "1": FlowerDirection.North,
          "2": FlowerDirection.Northeast,
          "3": FlowerDirection.Southeast,
          "4": FlowerDirection.South,
          "5": FlowerDirection.Southwest,
          "6": FlowerDirection.Northwest
        };
        const direction = tokens[1].toLowerCase();
        console.log("Processing flower-start:", {
          direction,
          mappedValue: dirMap[direction]
        });
        option.valid = true;
        option.value = dirMap[direction];
        this.options["flower-start"] = option.value;
        break;
      }
      case "counterclockwise": {
        option.valid = true;
        option.value = true;
        this.options["counterclockwise"] = option.value; // Changed to use option.value
        break;
      }
      case "hexflower": {
        option.valid = true;
        option.letter = tokens[1];
        const centerPart = tokens[2]?.split(":");
        if (!centerPart || centerPart.length < 2) {
          console.error("Invalid hexflower center format:", tokens[2]);
          return option;
        }
        option.center = centerPart[1];
        console.log("Hexflower parsed:", {
          letter: option.letter,
          center: option.center
        });
        break;
      }

      case "map": {
        option.valid = true;
        const mappingString = tokens.slice(1).join(" ");
        const mappings = mappingString.split(",");
        for (const mapping of mappings) {
          const [display, coord] = mapping.trim().split("=");
          Region.addMapping(display.trim(), coord.trim());
        }
        break;
      }
      case "horizontal":
      case "swap-even-odd":
      case "no-underline": {
        option.valid = true;
        option.value = true;
        break;
      }
      case "coordinates-format": {
        option.valid = true;
        option.value = tokens.slice(1).join(" ");
        break;
      }
      case "global": {
        option.valid = true;
        option.value = true;
        break;
      }
      case "pathFrequency":
      case "pathDepth":
      case "pathRate": {
        option.valid = true;
        option.value = parseFloat(tokens[1]);
        break;
      }
    }

    if (option.valid) {
      this.options[option.key] = option.value;
      console.log("Updated options:", this.options);
    }
    return option;
  }

  shape(svgEl: SVGElement, attributes: any) {
    const points = this.orientation
      .hexCorners()
      .map((corner: Point) => corner.toString())
      .join(" ");
    svgEl.createSvg("polygon", {
      attr: {
        ...attributes,
        points,
      },
    });
    // return `<polygon ${attributes} points="${points}" />`;
  }

  svgHeader(el: HTMLElement): SVGElement {
    if (this.regions.length == 0) {
      // @ts-ignore
      return el.createSvg("svg");
    }

    const [vx1, vy1, vx2, vy2] = this.orientation.viewbox(this.regions);
    const width = (vx2 - vx1).toFixed(0);
    const height = (vy2 - vy1).toFixed(0);

    // @ts-ignore
    const svgEl: SVGElement = el.createSvg("svg", {
      attr: {
        "xmlns:xlink": "http://www.w3.org/1999/xlink",
        viewBox: `${vx1} ${vy1} ${width} ${height}`,
      },
    });

    svgEl.createSvg("rect", {
      attr: {
        x: vx1,
        y: vy1,
        width: width,
        height: height,
        fill: "white",
      },
    });

    return svgEl;
  }

  svgDefs(svgEl: SVGElement): void {
    // All the definitions are included by default.
    const defsEl = svgEl.createSvg("defs");
    defsEl.innerHTML = this.defs.join("\n");

    // collect region types from attributes and paths in case the sets don't overlap
    const types: any = {};
    for (const region of this.regions) {
      for (const rtype of region.types) {
        types[rtype] = 1;
      }
    }
    for (const spline of this.splines) {
      types[spline.types] = 1;
    }

    // now go through them all
    for (const type of Object.keys(types).sort()) {
      const path = this.path[type];
      const attributes = this.attributes[type];
      if (path || attributes) {
        const gEl = defsEl.createSvg("g", {
          attr: { id: this.namespace(type) },
        });

        // just shapes get a glow, eg. a house (must come first)
        if (path && !attributes) {
          gEl.createSvg("path", {
            attr: {
              ...this.glowAttributes,
              d: path,
            },
          });
        }
        // region with attributes get a shape (square or hex), eg. plains and grass
        if (attributes) {
          this.shape(gEl, attributes);
        }
        // and now the attributes themselves the shape itself
        if (path) {
          gEl.createSvg("path", {
            attr: {
              ...this.pathAttributes,
              d: path,
            },
          });
        }
      }
    }
  }

  svgBackgrounds(svgEl: SVGElement): void {
    const bgEl = svgEl.createSvg("g", {
      attr: { id: this.namespace("backgrounds") },
    });
    const whitelist = Object.keys(this.attributes);
    for (const region of this.regions) {
      region.svg(bgEl, this.orientation, whitelist);
    }
  }

  svgPaths(svgEl: SVGElement): void {
    const splinesEl = svgEl.createSvg("g", {
      attr: { id: this.namespace("paths") },
    });
    for (const spline of this.splines) {
      spline.svg(splinesEl, this.orientation, this.pathAttributes);
    }
  }

  svgThings(svgEl: SVGElement): void {
    const thingsEl = svgEl.createSvg("g", {
      attr: { id: this.namespace("things") },
    });
    const blacklist = Object.keys(this.attributes);
    for (const region of this.regions) {
      const filtered: string[] = region.types.filter(
        (t) => !blacklist.includes(t)
      );
      region.svg(thingsEl, this.orientation, filtered);
    }
  }

  svgCoordinates(svgEl: SVGElement): void {
    const coordsEl = svgEl.createSvg("g", {
      attr: { id: this.namespace("coordinates") },
    });
    for (const region of this.regions) {
      region.svgCoordinates(
        coordsEl,
        this.orientation,
        this.textAttributes,
        this.options["coordinates-format"]
      );
    }
  }

  svgRegions(svgEl: SVGElement): void {
    const regionsEl = svgEl.createSvg("g", {
      attr: { id: this.namespace("regions") },
    });
    const attributes = this.attributes["default"];
    for (const region of this.regions) {
      region.svgRegion(regionsEl, this.orientation, attributes);
    }
  }

  svgPathLabels(svgEl: SVGElement): void {
    const labelsEl = svgEl.createSvg("g", {
      attr: { id: this.namespace("path-labels") },
    });
    for (const spline of this.splines) {
      spline.svgLabel(
        labelsEl,
        this.labelAttributes,
        this.glowAttributes
      );
    }
  }

  svgLabels(svgEl: SVGElement): void {
    const labelsEl = svgEl.createSvg("g", {
      attr: { id: this.namespace("labels") },
    });
    for (const region of this.regions) {
      region.svgLabel(
        labelsEl,
        this.orientation,
        this.labelAttributes,
        this.glowAttributes
      );
    }
  }

  svg(el: HTMLElement) {
    const svgEl = this.svgHeader(el);
    this.svgDefs(svgEl);
    this.svgBackgrounds(svgEl);
    this.svgPaths(svgEl);
    this.svgThings(svgEl);
    this.svgCoordinates(svgEl);
    this.svgRegions(svgEl);
    this.svgPathLabels(svgEl);
    this.svgLabels(svgEl);
    return svgEl;
  }
}
