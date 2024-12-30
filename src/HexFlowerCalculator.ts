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
 static basePositions = {
   "1": [0, 0],
   "2": [0, -1],
   "3": [+1, 0],
   "4": [+1, +1],
   "5": [0, +1],
   "6": [-1, +1],
   "7": [-1, 0],
   "8": [-1, -1],
   "9": [0, -2],
   "10": [+1, -1],
   "11": [+2, -1],
   "12": [+2, 0],
   "13": [+2, +1],
   "14": [+1, +2],
   "15": [0, +2],
   "16": [-1, +2],
   "17": [-2, +1],
   "18": [-2, 0],
   "19": [-2, -1]
 };

  static rotatePositions(positions: {[key: string]: [number, number]}, startDir: FlowerDirection, counterClockwise: boolean): {[key: string]: [number, number]} {
    const rotated: {[key: string]: [number, number]} = {"1": [0, 0]};

    // Define the spiral sequences
    const clockwiseSpiral = [
      "2","3","4","5","6","7",  // inner ring
      "8","9","10","11","12","13","14","15","16","17","18","19" // outer ring clockwise
    ];

    const counterClockwiseSpiral = [
      "2","7","6","5","4","3",  // inner ring counterclockwise
      "10","9","8","19","18","17","16","15","14","13","12","11"

    ];

    // Choose spiral based on direction
    const spiral = counterClockwise ? counterClockwiseSpiral : clockwiseSpiral;

    // Rotate entire spiral based on start direction
    const offset = startDir - 1;
    const rotatedSpiral = [...spiral];
    for (let i = 0; i < offset; i++) {
      // Take the first 6 elements (inner ring) and rotate them
      const innerRing = rotatedSpiral.slice(0, 6);
      const outerRing = rotatedSpiral.slice(6);
      innerRing.unshift(innerRing.pop()!);
      // Rotate outer ring by two positions to maintain alignment
      outerRing.unshift(outerRing.pop()!);
      outerRing.unshift(outerRing.pop()!);
      rotatedSpiral.splice(0, rotatedSpiral.length, ...innerRing, ...outerRing);
    }

    // Apply rotated positions
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
   startDir: FlowerDirection
 ): HexMapping[] {
   if (!centerCoord?.match(/\d{4}/)) return [];

   const [centerX, centerY] = centerCoord.match(/\d{2}/g)!.map(Number);
   const positions = this.rotatePositions(this.basePositions, startDir, counterClockwise);

   return Object.entries(positions).map(([num, [dx, dy]]) => ({
     displayValue: `${letter}${num}`,
     coordinate: `${String(centerX + dx).padStart(2, '0')}${String(centerY + dy).padStart(2, '0')}`
   }));
 }
}
