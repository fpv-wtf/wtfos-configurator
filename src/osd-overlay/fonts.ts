export const SD_TILE_WIDTH = 12 * 3;
export const SD_TILE_HEIGHT = 18 * 3;

export const HD_TILE_WIDTH = 12 * 2;
export const HD_TILE_HEIGHT = 18 * 2;

export const TILES_PER_PAGE = 256;

export interface FontPack {
  sd1: Font;
  sd2: Font;
  hd1: Font;
  hd2: Font;
}

export interface FontPackFiles {
  sd1: File;
  sd2: File;
  hd1: File;
  hd2: File;
}

export class Font {
  readonly name: string;
  readonly tiles: ImageBitmap[];

  constructor(name: string, tiles: ImageBitmap[]) {
    this.name = name;
    this.tiles = tiles;
  }

  getTile(index: number): ImageBitmap {
    return this.tiles[index];
  }

  static async fromFile(file: File): Promise<Font> {
    const data = await file.arrayBuffer();
    const isHd = file.name.includes("hd");

    const tileWidth = isHd ? HD_TILE_WIDTH : SD_TILE_WIDTH;
    const tileHeight = isHd ? HD_TILE_HEIGHT : SD_TILE_HEIGHT;

    const tiles: ImageBitmap[] = [];
    for (let tileIndex = 0; tileIndex < TILES_PER_PAGE; tileIndex++) {
      const pixData = new Uint8ClampedArray(
        data,
        tileIndex * tileWidth * tileHeight * 4,
        tileWidth * tileHeight * 4
      );

      const imageData = new ImageData(pixData, tileWidth, tileHeight);
      const imageBitmap = await createImageBitmap(imageData);
      tiles.push(imageBitmap);
    }

    return new Font(file.name, tiles);
  }

  static async fromFiles(files: FontPackFiles): Promise<FontPack> {
    return {
      sd1: await Font.fromFile(files.sd1),
      sd2: await Font.fromFile(files.sd2),
      hd1: await Font.fromFile(files.hd1),
      hd2: await Font.fromFile(files.hd2),
    };
  }
}
