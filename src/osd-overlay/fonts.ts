import { OsdReader } from "./osd";
export const SD_TILE_WIDTH = 12 * 3;
export const SD_TILE_HEIGHT = 18 * 3;

export const HD_TILE_WIDTH = 12 * 2;
export const HD_TILE_HEIGHT = 18 * 2;

export const TILES_PER_PAGE = 256;

export interface FontPack {
  sd: Font;
  hd: Font;
}

export interface FontPackFiles {
  sd: File;
  hd: File;
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

  static async fromFile(file: File, isHd : boolean, reader: OsdReader): Promise<Font> {
    const [filename, data] = await (async (file : File) => {
      if (file && file.size > 0) {
        return [file.name, await file.arrayBuffer()];
      } else {
        const font_filename = `font_${reader.header.config.fontVariant.toLowerCase()}${isHd ? "_hd" : ""}.png`;
        return ["font_filename", await fetch(`https://raw.githubusercontent.com/fpv-wtf/msp-osd/main/fonts/${font_filename}`).then((response) => response.arrayBuffer())];
      }
    })(file);

    const tileWidth = isHd ? HD_TILE_WIDTH : SD_TILE_WIDTH;
    const tileHeight = isHd ? HD_TILE_HEIGHT : SD_TILE_HEIGHT;

    // Create an image bitmap from the ArrayBuffer
    const imageBitmap = await createImageBitmap(new Blob([data]));

    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("2D context not supported or canvas creation failed");
    }

    context.drawImage(imageBitmap, 0, 0);

    const tiles = [];
    const tilesPerColumn = TILES_PER_PAGE; // Number of tiles per column
    const columns = imageBitmap.width / tileWidth; // Number of columns

    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
      for (let rowIndex = 0; rowIndex < tilesPerColumn; rowIndex++) {
        const x = columnIndex * tileWidth; // x-coordinate based on column
        const y = rowIndex * tileHeight; // y-coordinate based on row

        const imageData = context.getImageData(x, y, tileWidth, tileHeight);
        const tileBitmap = await createImageBitmap(imageData);
        tiles.push(tileBitmap);
      }
    }

    return new Font(filename, tiles);
  }

  static async fromFiles(files: FontPackFiles, reader: OsdReader): Promise<FontPack> {
    return {
      sd: await Font.fromFile(files.sd, false, reader),
      hd: await Font.fromFile(files.hd, true, reader),
    };
  }
}
