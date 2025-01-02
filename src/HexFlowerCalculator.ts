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
    "2": [0, -1],   // North (inverted)
    "3": [+1, 0],   // Northeast
    "4": [+1, +1],  // Southeast
    "5": [0, +1],   // South (inverted)
    "6": [-1, +1],  // Southwest
    "7": [-1, 0],   // Northwest
    "8": [-1, -1],  // Northwest outer
    "9": [0, -2],   // North outer
    "10": [+1, -1], // Northeast outer
    "11": [+2, -1],
    "12": [+2, 0],  // East outer
    "13": [+2, +1],
    "14": [+1, +2], // Southeast outer
    "15": [0, +2],  // South outer
    "16": [-1, +2], // Southwest outer
    "17": [-2, +1],
    "18": [-2, 0],  // West outer
    "19": [-2, -1]
  };

  static getLetterIndex(letter: string): number {
    return this.SEQUENCE.indexOf(letter);
  }

  static getLetterFromIndex(index: number): string {
    const wrappedIndex = index % this.SEQUENCE.length;
    return this.SEQUENCE[wrappedIndex >= 0 ? wrappedIndex : wrappedIndex + this.SEQUENCE.length];
  }

  static getConnectedLetter(baseLetter: string, position: number, counterclockwise: boolean, startDir: FlowerDirection): string {
    const baseIndex = this.getLetterIndex(baseLetter);
    let offsets = [1,2,3,4,5,6];  // Base sequence AB,AC,AD,AE,AF,AG

    if (counterclockwise) {
      offsets = offsets.reverse();
    }

    const shift = ((startDir - 1) * 2) % 6;
    for (let i = 0; i < shift; i++) {
      offsets.unshift(offsets.pop()!);
    }

    const newIndex = baseIndex + offsets[position];
    return this.getLetterFromIndex(newIndex);
  }

  static rotatePositions(positions: {[key: string]: [number, number]}, startDir: FlowerDirection, counterclockwise: boolean): {[key: string]: [number, number]} {
    const rotated: {[key: string]: [number, number]} = {"1": [0, 0]};

    const clockwiseSpiral = [
      "2","3","4","5","6","7",  // inner ring clockwise
      "8","9","10","11","12","13","14","15","16","17","18","19" // outer ring clockwise
    ];

    const counterClockwiseSpiral = [
      "2","7","6","5","4","3",  // inner ring counterclockwise
      "10","9","8","19","18","17","16","15","14","13","12","11" // outer ring counterclockwise
    ];

    const spiral = counterclockwise ? counterClockwiseSpiral : clockwiseSpiral;
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
    counterclockwise: boolean = false,
    startDir: FlowerDirection,
    useSubhexRelabel?: boolean
  ): HexMapping[] {
    if (!centerCoord?.match(/\d{4}/)) return [];

    const [centerX, centerY] = centerCoord.match(/\d{2}/g)!.map(Number);
    const positions = this.rotatePositions(this.basePositions, startDir, counterclockwise);

    // First rotate to get AB in the right position
    const baseOuterSequence = ["9", "11", "13", "15", "17", "19"];

    const outerHexNumberMap = {
      "10": "9",    // Position 10 → '9'
      "12": "10",   // Position 12 → '10'
      "14": "11",   // Position 14 → '11'
      "16": "12",   // Position 16 → '12'
      "18": "13",   // Position 18 → '13'
    };

    let ringPositions = [...baseOuterSequence];
    if (counterclockwise) {
      ringPositions.reverse();
    }
    const offset = startDir - 1;
    for (let i = 0; i < offset; i++) {
      ringPositions.unshift(ringPositions.pop()!);
      ringPositions.unshift(ringPositions.pop()!);
    }

    return Object.entries(positions).map(([num, [dx, dy]]) => {
      let displayValue;

      if (useSubhexRelabel) {
        const positionIndex = ringPositions.indexOf(num);
        if (positionIndex !== -1) {
          const connectedLetter = this.getConnectedLetter(letter, positionIndex, counterclockwise, startDir);
          displayValue = `${letter}${connectedLetter}`;
        } else if (num === "1") {
          displayValue = `${letter}1`;
        } else {
          const mappedNum = outerHexNumberMap[num] || num;
          displayValue = `${letter}${mappedNum}`;
        }
      } else {
        displayValue = `${letter}${num}`;
      }

      return {
        displayValue,
        coordinate: `${String(centerX + dx).padStart(2, '0')}${String(centerY + dy).padStart(2, '0')}`
      };
    });
  }


}
