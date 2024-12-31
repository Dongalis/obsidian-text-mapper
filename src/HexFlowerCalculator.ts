import { HexMapping } from './types';

export enum FlowerDirection {
  North = 1,
  Northeast = 2,
  Southeast = 3,
  South = 4,
  Southwest = 5,
  Northwest = 6
}

export class HexFlowerCalculator {
  static readonly SEQUENCE = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];

  static basePositions = {
    "1": [0, 0],    // Center
    "2": [0, -1],   // North
    "3": [+1, 0],   // Northeast
    "4": [+1, +1],  // Southeast
    "5": [0, +1],   // South
    "6": [-1, +1],  // Southwest
    "7": [-1, 0],   // Northwest
    "8": [-1, -1],  // North by Northwest
    "9": [0, -2],   // North
    "10": [+1, -1], // North by Northeast
    "11": [+2, -1],
    "12": [+2, 0],  // East
    "13": [+2, +1],
    "14": [+1, +2], // South by Southeast
    "15": [0, +2],  // South
    "16": [-1, +2], // South by Southwest
    "17": [-2, +1],
    "18": [-2, 0],  // West
    "19": [-2, -1]
  };

  static borderPositions = {
    counterclockwise: {
      "9": 0,    // First position pair (B/I)
      "11": 1,   // Second position pair (C/J)
      "13": 2,   // Third position pair (D/C)
      "15": 3,   // Fourth position pair (E/A)
      "17": 4,   // Fifth position pair (F/G)
      "19": 5    // Sixth position pair (G/H)
    },
    clockwise: {
      "9": 5,
      "11": 0,
      "13": 1,
      "15": 2,
      "17": 3,
      "19": 4
    }
  };

  static readonly connections = {
    'A': ['B', 'I'],
    'B': ['C', 'K'],
    'C': ['D', 'M'],
    'D': ['E', 'O'],
    'E': ['F', 'Q'],
    'F': ['G', 'S'],
    'G': ['H', 'I'],
    'H': ['I', 'K'],
    'I': ['J', 'M'],
    'J': ['K', 'O'],
    'K': ['L', 'Q'],
    'L': ['M', 'S'],
    'M': ['N', 'I'],
    'N': ['O', 'K'],
    'O': ['P', 'M'],
    'P': ['Q', 'O'],
    'Q': ['R', 'Q'],
    'R': ['S', 'S'],
    'S': ['A', 'I']
  };

  static rotatePositions(positions: {[key: string]: [number, number]}, startDir: FlowerDirection, counterClockwise: boolean): {[key: string]: [number, number]} {
    const rotated: {[key: string]: [number, number]} = {"1": [0, 0]};

    const clockwiseSpiral = [
      "2","3","4","5","6","7",  // inner ring
      "8","9","10","11","12","13","14","15","16","17","18","19" // outer ring clockwise
    ];

    const counterClockwiseSpiral = [
      "2","7","6","5","4","3",  // inner ring counterclockwise
      "10","9","8","19","18","17","16","15","14","13","12","11"
    ];

    const spiral = counterClockwise ? counterClockwiseSpiral : clockwiseSpiral;
    const offset = startDir - 1;
    const rotatedSpiral = [...spiral];

    for (let i = 0; i < offset; i++) {
      const innerRing = rotatedSpiral.slice(0, 6);
      const outerRing = rotatedSpiral.slice(6);
      innerRing.unshift(innerRing.pop()!);
      outerRing.unshift(outerRing.pop()!);
      outerRing.unshift(outerRing.pop()!);
      rotatedSpiral.splice(0, rotatedSpiral.length, ...innerRing, ...outerRing);
    }

    rotatedSpiral.forEach((newPos, index) => {
      const originalPos = (index + 2).toString();
      rotated[newPos] = positions[originalPos];
    });

    return rotated;
  }
  static calculateHexFlower(
    letter: string,
    centerCoord: string,
    counterClockwise: boolean = false,
    startDir: FlowerDirection,
    useSubhexRelabel?: boolean
  ): HexMapping[] {
    if (!centerCoord?.match(/\d{4}/)) return [];

    const [centerX, centerY] = centerCoord.match(/\d{2}/g)!.map(Number);
    const positions = this.rotatePositions(this.basePositions, startDir, counterClockwise);

    return Object.entries(positions).map(([num, [dx, dy]]) => {
      let displayValue;

      if (useSubhexRelabel && num in this.borderPositions[counterClockwise ? 'counterclockwise' : 'clockwise']) {
        const borderIndex = this.borderPositions[counterClockwise ? 'counterclockwise' : 'clockwise'][num];
        const connection = this.connections[letter];
        if (connection) {
          // Use the first or second connection based on border index
          displayValue = borderIndex === 0 ? connection[0] : connection[1];
        } else {
          // Fallback if no connection is found
          displayValue = `${letter}${num}`;
        }
      } else {
        // For center and inner ring hexes, use sequential numbering
        displayValue = `${letter}${num}`;
      }

      return {
        displayValue,
        coordinate: `${String(centerX + dx).padStart(2, '0')}${String(centerY + dy).padStart(2, '0')}`
      };
    });
  }
}
