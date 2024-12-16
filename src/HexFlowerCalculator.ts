import { HexMapping } from './types';

export class HexFlowerCalculator {
    static getRelativePositions(): {[key: string]: [number, number]} {
        return {
            // Center
            "1": [0, 0],     //  (center)

            // First ring (clockwise from north)
            "2": [0, -1],    //  (north)
            "3": [+1, 0],    //  (northeast)
            "4": [+1, +1],   //  (southeast)
            "5": [0, +1],    //  (south)
            "6": [-1, +1],   //  (southwest)
            "7": [-1, 0],    //  (northwest)

            // Outer ring (clockwise from northwest-north)
            "8": [-1, -1],   //  (northwest-north)
            "9": [0, -2],    //  (north)
            "10": [+1, -1],  //  (northeast-north)
            "11": [+2, -1],  //  (northeast)
            "12": [+2, 0],   //  (east)
            "13": [+2, +1],  //  (southeast)
            "14": [+1, +2],  //  (south-southeast)
            "15": [0, +2],   //  (south)
            "16": [-1, +2],  //  (south-southwest)
            "17": [-2, +1],  //  (southwest)
            "18": [-2, 0],   //  (west)
            "19": [-2, -1]   //  (northwest)
        };
    }

    static calculateHexFlower(letter: string, centerCoord: string): HexMapping[] {
        const [centerX, centerY] = centerCoord.match(/\d{2}/g).map(Number);
        const positions = this.getRelativePositions();
        const mappings: HexMapping[] = [];

        for (const [num, [dx, dy]] of Object.entries(positions)) {
            const newX = centerX + dx;
            const newY = centerY + dy;
            // Ensure coordinates are always 2 digits
            const coord = `${String(newX).padStart(2, '0')}${String(newY).padStart(2, '0')}`;

            mappings.push({
                displayValue: `${letter}${num}`,
                coordinate: coord
            });
        }

        return mappings;
    }
}
