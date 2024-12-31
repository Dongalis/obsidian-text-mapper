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
    // Handle wrapping around the sequence if we go past S
    const wrappedIndex = index % this.SEQUENCE.length;
    return this.SEQUENCE[wrappedIndex >= 0 ? wrappedIndex : wrappedIndex + this.SEQUENCE.length];
  }

  static calculateStartingOffset(startDir: FlowerDirection): number {
    // Convert FlowerDirection to number of positions to shift
    // North = 0, Northeast = 1, etc.
    return (startDir - 1) * 2;
  }

  static readonly BORDER_SEQUENCE = [3, 4, 5, 6, 1, 2];

  static mirrorEastWestIndex(index: number): number {
    // Mirror east-west positions for clockwise operation
    const baseIndex = this.SEQUENCE.indexOf('A');
    const mirrorMap = new Map([
      ['H', 'R'], ['I', 'Q'], ['J', 'P'], ['K', 'O'], ['L', 'N']
    ]);
    // Add reverse mappings
    [...mirrorMap.entries()].forEach(([k,v]) => mirrorMap.set(v,k));

    const letter = this.SEQUENCE[index];
    const mirrored = mirrorMap.get(letter);
    return mirrored ? this.SEQUENCE.indexOf(mirrored) : index;
  }

  static getConnectedLetter(baseLetter: string, position: number, clockwise: boolean, startDir: FlowerDirection): string {
    const baseIndex = this.getLetterIndex(baseLetter);
    let offsets = [6,1,2,3,4,5];  // Base sequence AG,AB,AC,AD,AE,AF

    if (clockwise) {
      offsets = offsets.reverse();
    }

    const shift = ((startDir - 1) * 2) % 6;
    for (let i = 0; i < shift; i++) {
      offsets.unshift(offsets.pop()!);
    }

    const newIndex = baseIndex + offsets[position];
    return this.getLetterFromIndex(newIndex);
  }

  static rotatePositions(positions: {[key: string]: [number, number]}, startDir: FlowerDirection, clockwise: boolean): {[key: string]: [number, number]} {
    const rotated: {[key: string]: [number, number]} = {"1": [0, 0]};

    const clockwiseSpiral = [
      "2","7","6","5","4","3",  // inner ring clockwise
      "10","9","8","19","18","17","16","15","14","13","12","11" // outer ring clockwise
    ];

    const counterClockwiseSpiral = [
      "2","3","4","5","6","7",  // inner ring counterclockwise
      "8","9","10","11","12","13","14","15","16","17","18","19" // outer ring counterclockwise
    ];

    const spiral = clockwise ? clockwiseSpiral : counterClockwiseSpiral;
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
    clockwise: boolean = false,
    startDir: FlowerDirection,
    useSubhexRelabel?: boolean
  ): HexMapping[] {
    if (!centerCoord?.match(/\d{4}/)) return [];

    const [centerX, centerY] = centerCoord.match(/\d{2}/g)!.map(Number);
    const positions = this.rotatePositions(this.basePositions, startDir, clockwise);

    const outerRingPositions = {
      counterclockwise: ["9", "11", "13", "15", "17", "19"],
      clockwise: ["19", "17", "15", "13", "11", "9"]
    };

    let numberCount = 1;
    const outerHexNumberMap = {
      "10": "9",    // Position 10 → '9'
      "12": "10",   // Position 12 → '10'
      "14": "11",   // Position 14 → '11'
      "16": "12",   // Position 16 → '12'
      "18": "13",   // Position 18 → '13'
      };

    return Object.entries(positions).map(([num, [dx, dy]]) => {
      let displayValue;

      if (useSubhexRelabel) {
        // Map outer ring positions
        const ringPositions = clockwise
          ? outerRingPositions.clockwise
          : outerRingPositions.counterclockwise;

        const positionIndex = ringPositions.indexOf(num);
        if (positionIndex !== -1) {
          // This is an outer ring position that should be relabeled
          const connectedLetter = this.getConnectedLetter(letter, positionIndex, clockwise, startDir);
          displayValue = `${letter}${connectedLetter}`; // Show both letters
        } else if (num === "1") {
          // Center hex (always numbered as 1)
          displayValue = `${letter}${num}`;
        } else {
          // Use the mapped number for outer ring, or original number for inner ring
          const mappedNum = outerHexNumberMap[num] || num;
          displayValue = `${letter}${mappedNum}`;
        }
      } else {
        // For numbering without subhex relabeling, increment numberCount stepwise
        if (parseInt(num) >= 9 && parseInt(num) <= 13) {
          // For outer positions (9-13), assign numberCount
          displayValue = `${letter}${numberCount}`;
          numberCount++;
        } else {
          // For other positions (1-8), use the original number
          displayValue = `${letter}${numberCount}`;
          numberCount++;
        }
      }

      return {
        displayValue,
        coordinate: `${String(centerX + dx).padStart(2, '0')}${String(centerY + dy).padStart(2, '0')}`
      };
    });
  }
}
