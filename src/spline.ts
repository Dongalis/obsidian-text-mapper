import { SVGElement } from "./constants";
import { Point, Orientation } from "./orientation";

export class Spline {
  types: string;
  label: string;
  side: string;
  start: string;
  id: string;
  points: Point[];
  orientation: Orientation;
  curvatureAmount: number = 0.1; // Default curvature amount
  pathCurvature?: number;
  options: any


  constructor(options: any) {
    this.points = [];
    this.options = options; // Store options

  }


  addPoint(x: string, y: string) {
    const nX = parseInt(x);
    const nY = parseInt(y);
    this.points.push(new Point(nX, nY));
  }

  computeMissingPoints(): Point[] {
    let i = 0;
    let current = this.points[i++];
    const result = [current];
    while (i < this.points.length) {
      current = this.oneStep(current, this.points[i]);
      result.push(current);
      if (
        current.x == this.points[i].x &&
          current.y == this.points[i].y
      ) {
        i++;
      }
    }
    return result;
  }

  oneStep(from: Point, to: Point): Point {
    // Brute forcing the "next" step by trying all the neighbors. The
    // connection data to connect to neighboring hexes.
    //
    // Example Map             Index for the array
    //
    //      0201                      2
    //  0102    0302               1     3
    //      0202    0402
    //  0103    0303               6     4
    //      0203    0403              5
    //  0104    0304
    //
    //  Note that the arithmetic changes when x is odd.
    // If this.orientation.swapEvenOdd === true, then this is the example map:
    //
    // Example Map             Index for the array
    //
    //      0201                      2
    //  0101    0301               1     3
    //      0202    0402
    //  0102    0302               6     4
    //      0203    0403              5
    //  0103    0303
    //
    // We need to use a different algorithm with horizontal hexes
    // Example map:          Index for the array
    //     0301  0401           1   2
    //  0202  0302  0402      6       3
    //     0303  0403  0503     5   4
    //  0204  0304  0404
    //
    // If this.orientation.swapEvenOdd === true, then this is the example map:
    //
    // Example Map             Index for the array
    //     0201  0301           1   2
    //  0202  0302  0402      6       3
    //     0203  0303  0403     5   4
    //  0204  0304  0404
    let delta;
    const evenOdd = this.orientation.swapEvenOdd ? 1 : 0;

    if (this.orientation.flatTop) {
      delta = [
        [
          new Point(-1, 0 - evenOdd), // -1 -1
          new Point(0, -1), // 0 -1
          new Point(+1, 0 - evenOdd), // +1 -1
          new Point(+1, +1 - evenOdd), // +1 +0
          new Point(0, +1), // 0 +1
          new Point(-1, +1 - evenOdd), // -1, 0
        ], // x is even
        [
          new Point(-1, -1 + evenOdd),
          new Point(0, -1),
          new Point(+1, -1 + evenOdd),
          new Point(+1, 0 + evenOdd),
          new Point(0, +1),
          new Point(-1, 0 + evenOdd),
        ], // x is odd
      ];
    } else {
      delta = [
        [
          new Point(0 - evenOdd, -1),
          new Point(1 - evenOdd, -1),
          new Point(+1, 0),
          new Point(+1 - evenOdd, +1),
          new Point(0 - evenOdd, +1),
          new Point(-1, 0),
        ], // Y is even
        [
          new Point(-1 + evenOdd, -1),
          new Point(0 + evenOdd, -1),
          new Point(+1, 0),
          new Point(0 + evenOdd, +1),
          new Point(-1 + evenOdd, +1),
          new Point(-1, 0),
        ], // Y is odd
      ];
    }

    let min, best;

    for (let i = 0; i < 6; i++) {
      // make a new guess
      let offset;
      if (this.orientation.flatTop) {
        offset = Math.abs(from.x % 2);
      } else {
        offset = Math.abs(from.y % 2);
      }

      const x = from.x + delta[offset][i].x;
      const y = from.y + delta[offset][i].y;
      let d = (to.x - x) * (to.x - x) + (to.y - y) * (to.y - y);
      if (min === undefined || d < min) {
        min = d;
        best = new Point(x, y);
      }
    }

    return best;
  }

  partway(from: Point, to: Point, lerp: number = 1): Point {
    const pix1 = this.orientation.pixels(from);
    const pix2 = this.orientation.pixels(to);
    return new Point(
      pix1.x + (pix2.x - pix1.x) * lerp,
      pix1.y + (pix2.y - pix1.y) * lerp
    );
  }

  svg(svgEl: SVGElement, orientation: any, pathAttributes: any): void {
    this.orientation = orientation;
    const points = this.computeMissingPoints();
    if (points.length == 0) return;

    let path = "";
    let current, next;


    for (let i = 0; i < points.length - 1; i++) {
      current = points[i];
      next = points[i + 1];


      // Modify scaling based on direction
      const isVertical = Math.abs(next.y - current.y) > Math.abs(next.x - current.x);
      const curveValue = this.pathCurvature ||
        (isVertical ? this.options.vCurve : this.options.hCurve) ||
        this.curvatureAmount;

      const scaledCurvature = isVertical ?
        curveValue * 0.2 * 1.75 :
        curveValue * 0.175 * 0.2 ;


      if (path.length === 0) {
        // For very small curvature values, make the path nearly straight
        if (scaledCurvature < 0.01) {
          const start = this.orientation.pixels(current);
          const end = this.orientation.pixels(next);
          path += `M${start.toString()} L${end.toString()}`;
        } else {
          const perpX = -(next.y - current.y) * scaledCurvature;
          const perpY = (next.x - current.x) * scaledCurvature;

          const controlPoint = new Point(
            (current.x + next.x)/2 + perpX,
            (current.y + next.y)/2 + perpY
          );

          const start = this.orientation.pixels(current);
          const control = this.orientation.pixels(controlPoint);
          const end = this.orientation.pixels(next);

          path += `M${start.toString()} Q${control.toString()} ${end.toString()}`;
        }
      } else {
        if (scaledCurvature < 0.01) {
          const end = this.orientation.pixels(next);
          path += ` L${end.toString()}`;
        } else {
          const perpX = -(next.y - current.y) * scaledCurvature;
          const perpY = (next.x - current.x) * scaledCurvature;

          const controlPoint = new Point(
            (current.x + next.x)/2 + perpX,
            (current.y + next.y)/2 + perpY
          );

          const control = this.orientation.pixels(controlPoint);
          const end = this.orientation.pixels(next);

          path += ` T${end.toString()}`;
        }
      }
    }

    svgEl.createSvg("path", {
      attr: {
        id: this.id,
        type: this.types,
        ...pathAttributes[this.types],
        d: path,
      },
    });
  }

  // Add helper method to create path offsets
  private addPathOffset(pathString: string, amount: number): string {
    // Parse the path string and add perpendicular offsets to control points
    // This is a simplified example - you'd need to properly parse the path string
    const parts = pathString.split(' ');
    const newParts = parts.map(part => {
      if (part.includes(',')) {
        const [x, y] = part.split(',').map(Number);
        return `${x + (Math.random() - 0.5) * amount},${y}`;
      }
      return part;
    });
    return newParts.join(' ');
  }


  svgLabel(
    svgEl: SVGElement,
    labelAttributes: any,
    glowAttributes: any
  ): void {
    if (this.label === undefined) {
      return;
    }
    const points = this.computeMissingPoints();
    const pathAttributes: any = {
      href: `#${this.id}`,
    };
    // Default side is left, but if the line goes from right to left, then "left"
    // means "upside down", so allow people to control it.
    if (this.side !== undefined) {
      pathAttributes["side"] = this.side;
    } else if (
      points[1].x < points[0].x ||
        (points.length > 2 && points[2].x < points[0].x)
    ) {
      pathAttributes["side"] = "right";
    }
    if (this.start !== undefined) {
      pathAttributes["startOffset"] = this.start;
    }

    const gEl = svgEl.createSvg("g");
    const glowEl = gEl.createSvg("text", {
      attr: {
        ...labelAttributes,
        ...glowAttributes,
      },
    });
    const glowPathEl = glowEl.createSvg("textPath", {
      attr: pathAttributes,
    });
    glowPathEl.textContent = this.label;

    const labelEl = gEl.createSvg("text", { attr: labelAttributes });
    const labelPathEl = labelEl.createSvg("textPath", {
      attr: pathAttributes,
    });
    labelPathEl.textContent = this.label;
  }
}
