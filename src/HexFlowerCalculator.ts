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

   const order = counterClockwise ?
     ["2","7","6","5","4","3"] :
     ["2","3","4","5","6","7"];

   // Rotate array based on start direction
   const offset = startDir - 1;
   const rotatedOrder = [...order];
   for (let i = 0; i < offset; i++) {
     rotatedOrder.unshift(rotatedOrder.pop()!);
   }

   rotatedOrder.forEach((newPos, index) => {
     const originalPos = (index + 2).toString();
     rotated[newPos] = positions[originalPos];
   });

   // Copy outer ring unchanged
   for (let i = 8; i <= 19; i++) {
     rotated[i.toString()] = positions[i.toString()];
   }

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
