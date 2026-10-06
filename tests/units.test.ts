import { describe, it, expect } from 'vitest';
import { formatQuantity, piecesToDisplay, displayToPieces } from '../src/domain/units';
import { Product } from '../src/domain/types';

const chips: Product = { id: 'p1', name: 'Rs5 Chips', pricePaise: 500, unitsPerStrip: 12, stripsPerBox: 12, piecesPerBox: 144 };

describe('Natural unit conversion (shared helper)', () => {
  it('2 Boxes at 12 Strips per Box = 24 Strips; after 18 sold, 6 remain', () => {
    const twoBoxes = displayToPieces({ boxes: 2, strips: 0, pieces: 0 }, chips);
    expect(piecesToDisplay(twoBoxes, chips).strips).toBe(0);
    expect(twoBoxes / chips.unitsPerStrip).toBe(24);
    const remaining = twoBoxes - 18 * chips.unitsPerStrip;
    expect(remaining / chips.unitsPerStrip).toBe(6);
    expect(formatQuantity(remaining, chips)).toBe('6 Strips');
  });

  it('decomposes mixed quantities into Boxes/Strips/Pieces', () => {
    expect(formatQuantity(144 + 12 + 5, chips)).toBe('1 Box 1 Strip 5 Pieces');
    expect(formatQuantity(0, chips)).toBe('0 Pieces');
  });
});
