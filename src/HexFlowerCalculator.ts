import { HexMapping } from './types';

// Defines the six possible cardinal directions for orienting the hex flower.
// Each value represents how many 60-degree rotations from North are needed.
export enum FlowerDirection {
  North = 1,
  Northeast = 2,
  Southeast = 3,
  South = 4,
  Southwest = 5,
  Northwest = 6
}

export class HexFlowerCalculator {
  // All possible superhex labels in order. Used for determining connections
  // between superhexes in the larger flower structure.
  static readonly SEQUENCE = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];

  // Defines the coordinate system for hex positions relative to center (0,0).
  // First ring (positions 2-7) is one step from center.
  // Outer ring (positions 8-19) is two steps from center.
  // Y coordinates are inverted because positive Y is down in SVG coordinates.
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
    "11": [+2, -1], // Northeast outer far
    "12": [+2, 0],  // East outer
    "13": [+2, +1], // Southeast outer far
    "14": [+1, +2], // Southeast outer
    "15": [0, +2],  // South outer
    "16": [-1, +2], // Southwest outer
    "17": [-2, +1], // Southwest outer far
    "18": [-2, 0],  // West outer
    "19": [-2, -1]  // Northwest outer far
  };

  // Helper function to find a letter's position in the SEQUENCE array
  static getLetterIndex(letter: string): number {
    return this.SEQUENCE.indexOf(letter);
  }

  // Helper function to get a letter from the SEQUENCE array with wraparound
  static getLetterFromIndex(index: number): string {
    const wrappedIndex = index % this.SEQUENCE.length;
    return this.SEQUENCE[wrappedIndex >= 0 ? wrappedIndex : wrappedIndex + this.SEQUENCE.length];
  }

  // Define the base adjacency map showing how hexes connect in clockwise order
  private static readonly adjacencyMap = {
    // Inner hexes only connect to other letters since they're not on the border
    'A': ['B', 'C', 'D', 'E', 'F', 'G'],
    'B': ['I', 'J', 'C', 'A', 'G', 'H'],
    'C': ['J', 'K', 'L', 'D', 'A', 'B'],
    'D': ['C', 'L', 'M', 'N', 'E', 'A'],
    'E': ['A', 'D', 'N', 'O', 'P', 'F'],
    'F': ['G', 'A', 'E', 'P', 'Q', 'R'],
    'G': ['H', 'B', 'A', 'F', 'R', 'S'],
    // Edge hexes include cardinal directions where they border empty space
    'H': ['North', 'I', 'B', 'G', 'S', 'NW'],
    'I': ['North', 'NE', 'J', 'B', 'H', 'NW'],
    'J': ['North', 'NE', 'K', 'C', 'B', 'I'],
    'K': ['North', 'NE', 'SE', 'L', 'C', 'J'],
    'L': ['K', 'NE', 'SE', 'M', 'D', 'C'],
    'M': ['L', 'NE', 'SE', 'South', 'N', 'D'],
    'N': ['D', 'M', 'SE', 'South', 'O', 'E'],
    'O': ['E', 'N', 'SE', 'South', 'SW', 'P'],
    'P': ['F', 'E', 'O', 'South', 'SW', 'Q'],
    'Q': ['R', 'F', 'P', 'South', 'SW', 'NW'],
    'R': ['S', 'G', 'F', 'Q', 'SW', 'NW'],
    'S': ['North', 'H', 'G', 'R', 'SW', 'NW']
  };

  // Each mapping shows how cardinal directions transform when we rotate the
  // flower clockwise to bring the chosen start direction to the top (North)
  // position Determines how hexes connect to their neighbors, including
  // cardinal directions for edge hexes. Each array represents connections in
  // clockwise order from north

  static getConnectedLetter(baseLetter: string, position: number, counterclockwise: boolean, startDir: FlowerDirection): string {
    // Get the base connections for this hex from our adjacency map
    let neighbors = this.adjacencyMap[baseLetter];
    if (!neighbors) {
        return baseLetter + position;
    }

    // Define both clockwise and counterclockwise transformation maps
    const cardinalTransforms = {
        [FlowerDirection.North]: {
            'North': 'North', 'NE': 'NE', 'SE': 'SE',
            'South': 'South', 'SW': 'SW', 'NW': 'NW'
        },
        [FlowerDirection.Northwest]: {
            'North': 'NW', 'NE': 'North', 'SE': 'NE',
            'South': 'SE', 'SW': 'South', 'NW': 'SW'
        },
        [FlowerDirection.West]: {
            'North': 'SW', 'NE': 'NW', 'SE': 'North',
            'South': 'NE', 'SW': 'SE', 'NW': 'South'
        },
        [FlowerDirection.Southwest]: {
            'North': 'South', 'NE': 'SW', 'SE': 'NW',
            'South': 'North', 'SW': 'NE', 'NW': 'SE'
        },
        [FlowerDirection.Southeast]: {
            'North': 'SE', 'NE': 'South', 'SE': 'SW',
            'South': 'NW', 'SW': 'North', 'NW': 'NE'
        },
        [FlowerDirection.Northeast]: {
            'North': 'NE', 'NE': 'SE', 'SE': 'South',
            'South': 'SW', 'SW': 'NW', 'NW': 'North'
        }
    };

    const cardinalTransformsCounterclockwise = {
        [FlowerDirection.North]: {
            'North': 'North', 'NE': 'NE', 'SE': 'SE',
            'South': 'South', 'SW': 'SW', 'NW': 'NW'
        },
        [FlowerDirection.Northwest]: {
            'North': 'NW', 'NE': 'SW', 'SE': 'South',
            'South': 'SW', 'SW': 'NW', 'NW': 'North'
        },
        [FlowerDirection.West]: {
            'North': 'SE', 'NE': 'South', 'SE': 'SW',
            'South': 'NW', 'SW': 'North', 'NW': 'NE'
        },
        [FlowerDirection.Southwest]: {
            'North': 'South', 'NE': 'SW', 'SE': 'NW',
            'South': 'North', 'SW': 'NE', 'NW': 'SE'
        },
        [FlowerDirection.Southeast]: {
            'North': 'SW', 'NE': 'NW', 'SE': 'North',
            'South': 'NE', 'SW': 'SE', 'NW': 'South'
        },
        [FlowerDirection.Northeast]: {
            'North': 'NE', 'NE': 'SE', 'SE': 'South',
            'South': 'SW', 'SW': 'South', 'NW': 'North'
        }
    };

    // Choose the appropriate transformation map based on traversal direction
    const transforms = counterclockwise ?
        cardinalTransformsCounterclockwise[startDir] :
        cardinalTransforms[startDir];

    // First transform the cardinal directions according to our rotation
    let transformed = neighbors.map(direction => {
        return transforms[direction] || direction;  // Use transform if it's a cardinal direction, otherwise keep original
    });

    // Then handle traversal direction by reversing if going counterclockwise
    if (counterclockwise) {
        transformed = transformed.reverse();
    }

    return baseLetter + transformed[position];
}

  // Handles the physical rotation of hex positions based on chosen cardinal direction
  static rotatePositions(positions: {[key: string]: [number, number]}, startDir: FlowerDirection, counterclockwise: boolean): {[key: string]: [number, number]} {
    // Center hex never moves
    const rotated: {[key: string]: [number, number]} = {"1": [0, 0]};

    // Define position sequences for both rotation directions
    const clockwiseSpiral = [
      "2","3","4","5","6","7",  // inner ring clockwise
      "8","9","10","11","12","13","14","15","16","17","18","19" // outer ring clockwise
    ];

    const counterClockwiseSpiral = [
      "2","7","6","5","4","3",  // inner ring counterclockwise
      "10","9","8","19","18","17","16","15","14","13","12","11" // outer ring counterclockwise
    ];

    // Choose appropriate spiral based on rotation direction
    const spiral = counterclockwise ? counterClockwiseSpiral : clockwiseSpiral;
    const offset = startDir - 1;
    const rotatedSpiral = [...spiral];

    // Rotate both rings according to cardinal direction
    for (let i = 0; i < offset; i++) {
      const innerRing = rotatedSpiral.slice(0, 6);
      const outerRing = rotatedSpiral.slice(6);
      innerRing.unshift(innerRing.pop()!);
      outerRing.unshift(outerRing.pop()!);
      outerRing.unshift(outerRing.pop()!);
      rotatedSpiral.splice(0, rotatedSpiral.length, ...innerRing, ...outerRing);
    }

    // Map new positions to original coordinates
    rotatedSpiral.forEach((newPos, index) => {
      const originalPos = (index + 2).toString();
      rotated[newPos] = positions[originalPos];
    });

    return rotated;
  }

  // Main function that generates the hex flower with proper labeling and positioning
  static calculateHexFlower(
    letter: string,          // The superhex letter (A-S)
    centerCoord: string,     // Center hex coordinate (e.g., "1010")
    counterclockwise: boolean = false,  // Rotation direction
    startDir: FlowerDirection,          // Cardinal direction for orientation
    useSubhexRelabel?: boolean         // Whether to use letter connections for outer ring
  ): HexMapping[] {
    // Validate center coordinate format
    if (!centerCoord?.match(/\d{4}/)) return [];

    // Extract x,y coordinates from center position
    const [centerX, centerY] = centerCoord.match(/\d{2}/g)!.map(Number);

    // Get rotated physical positions based on cardinal direction
    const positions = this.rotatePositions(this.basePositions, startDir, counterclockwise);

    // Define which outer positions should connect to other superhexes
    const baseOuterSequence = ["9", "11", "13", "15", "17", "19"];

    // Map alternate outer positions to main sequence numbers
    const outerHexNumberMap = {
      "10": "9",    // Position 10 → '9'
      "12": "10",   // Position 12 → '10'
      "14": "11",   // Position 14 → '11'
      "16": "12",   // Position 16 → '12'
      "18": "13"    // Position 18 → '13'
    };

    // Handle rotation of connection positions
    let ringPositions = [...baseOuterSequence];
    if (counterclockwise) {
      ringPositions.reverse();
    }

    // Rotate connecting positions based on cardinal direction
    const offset = startDir - 1;
    for (let i = 0; i < offset; i++) {
      // Rotate positions to maintain proper connections
      ringPositions.push(ringPositions.shift()!);
      ringPositions.unshift(ringPositions.pop()!);

    }

    // Generate final hex mappings with proper labels and coordinates
    return Object.entries(positions).map(([num, [dx, dy]]) => {
      let displayValue;

      if (useSubhexRelabel) {
        if (num === "1") {
          // Center hex is always letter + 1
          displayValue = `${letter}1`;
        } else if (parseInt(num) <= 7) {
          // Inner ring uses numbers 2-7
          displayValue = `${letter}${num}`;
        } else {
          // Outer ring - check if this position connects to another superhex
          const positionIndex = ringPositions.indexOf(num);
          if (positionIndex !== -1) {
            // Connected position - use letter label
            const connectedLetter = this.getConnectedLetter(letter, positionIndex, counterclockwise, startDir);
            displayValue = connectedLetter;
          } else {
            // Non-connected position - use number label
            const mappedNum = outerHexNumberMap[num] || num;
            displayValue = `${letter}${mappedNum}`;
          }
        }
      } else {
        // Simple numbering mode - just use position numbers
        displayValue = `${letter}${num}`;
      }

      // Return final hex mapping with label and coordinate
      return {
        displayValue,
        coordinate: `${String(centerX + dx).padStart(2, '0')}${String(centerY + dy).padStart(2, '0')}`
      };
    });
  }
}
