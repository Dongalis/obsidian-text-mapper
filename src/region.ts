import { App } from "obsidian";
import { SVGElement } from "./constants";
import { Point, Orientation } from "./orientation";
import { NamespaceFunction } from "./constants";

export class Region {
  x: number;
  y: number;
  types: string[];
  label: string;
  size: string;
  id: string;
  namespace: NamespaceFunction;
  private app: App;

  constructor(namespace: NamespaceFunction, app: App) {
    this.types = [];
    this.namespace = namespace;
    this.app = app;
  }

  pixels(orientation: Orientation, addX: number, addY: number): number[] {
    const pix = orientation.pixels(new Point(this.x, this.y), addX, addY);
    return [pix.x, pix.y];
  }

  svg(svgEl: SVGElement, orientation: Orientation, types: string[]): void {
    const pix = orientation.pixels(new Point(this.x, this.y));
    for (const type of this.types) {
      if (!types.includes(type)) {
        continue;
      }
      const namespaced = this.namespace(type);
      svgEl.createSvg("use", {
        attr: {
          x: pix.x.toFixed(1),
          y: pix.y.toFixed(1),
          href: `#${namespaced}`,
        },
      });
    }
  }

  svgCoordinates(
    svgEl: SVGElement,
    orientation: Orientation,
    textAttributes: any,
    coordinatesFormat: string
  ): void {
    const pix = orientation.pixels(
      new Point(this.x, this.y),
      0,
      -orientation.dy * orientation.labelOffset
    );

    const coordEl = svgEl.createSvg("text", {
      attr: {
        ...textAttributes,
        "text-anchor": "middle",
        x: pix.x.toFixed(1),
        y: pix.y.toFixed(1),
      },
    });

    const xStr = this.x.toString().padStart(2, "0");
    const yStr = this.y.toString().padStart(2, "0");

    const content = coordinatesFormat
      .replace("{X}", xStr)
      .replace("{Y}", yStr);

    coordEl.textContent = content;
  }

  svgRegion(
    svgEl: SVGElement,
    orientation: Orientation,
    attributes: any
  ): void {
    const points = orientation
      .hexCorners()
      .map((corner: Point) => {
        return orientation
          .pixels(new Point(this.x, this.y), corner.x, corner.y)
          .toString();
      })
      .join(" ");

    svgEl.createSvg("polygon", {
      attr: {
        ...attributes,
        id: this.namespace(this.id),
        points,
      },
    });
  }

  svgLabel(
    svgEl: SVGElement,
    orientation: Orientation,
    labelAttributes: any,
    glowAttributes: any
  ): void {
    if (!this.label) return;

    const attributes = {
      ...labelAttributes,
      ...(this.size && { "font-size": this.size })
    };

    const [linkText, displayText] = this.computeLinkAndLabel(this.label);
    const pix = orientation.pixels(
      new Point(this.x, this.y),
      0,
      orientation.dy * orientation.labelOffset
    );

    const gEl = svgEl.createSvg("g");

    if (linkText !== displayText) {
      // For linked text
      const linkEl = gEl.createSvg("a", {
        attr: {
          "data-href": linkText,
          class: "internal-link",
          href: linkText
        }
      });

      // Add hover handler
      if (this.app?.workspace) {
        // @ts-ignore - SVG element type issues
        linkEl.addEventListener('mouseover', (event: MouseEvent) => {
          const targetEl = event.target as HTMLElement;
          this.app.workspace.trigger('hover-link', {
            event,
            source: 'text-mapper',
            hoverParent: targetEl,
            targetEl: targetEl,
            linktext: linkText
          });
        });
      }

      // Add glow behind linked text
      const glowEl = linkEl.createSvg("text", {
        attr: {
          "text-anchor": "middle",
          x: pix.x.toFixed(1),
          y: pix.y.toFixed(1),
          ...attributes,
          ...glowAttributes,
        },
      });
      glowEl.textContent = displayText;

      // Add visible text
      const textEl = linkEl.createSvg("text", {
        attr: {
          "text-anchor": "middle",
          x: pix.x.toFixed(1),
          y: pix.y.toFixed(1),
          ...attributes,
        },
      });
      textEl.textContent = displayText;
    } else {
      // For non-linked text
      const glowEl = gEl.createSvg("text", {
        attr: {
          "text-anchor": "middle",
          x: pix.x.toFixed(1),
          y: pix.y.toFixed(1),
          ...attributes,
          ...glowAttributes,
        },
      });
      glowEl.textContent = displayText;

      const textEl = gEl.createSvg("text", {
        attr: {
          "text-anchor": "middle",
          x: pix.x.toFixed(1),
          y: pix.y.toFixed(1),
          ...attributes,
        },
      });
      textEl.textContent = displayText;
    }
  }

  computeLinkAndLabel(label: string): [string, string] {
    if (!label) return ["", ""];
    const parts = label.split("|");
    if (parts.length > 1) {
      return [parts[0].trim(), parts[1].trim()];
    }
    return [label.trim(), label.trim()];
  }
}
