interface SrtFrame {
  start: number;
  end: number;
  signal: string;
  ch: string;
  flightTime: string;
  uavBat: string;
  glsBat: string;
  uavBatCells: string;
  glsBatCells: string;
  delay: string;
  bitrate:string;
  rcSignal:string;
}

export class SrtReader {
  readonly frames: SrtFrame[] = [];

  constructor(data: String) {
    const blocks = data.split("\n\n").slice(0, -1);

    for (const block of blocks) {
      const [ , timestamps, text ] = block.split("\n");
      const [ startHours, startMinutes, startSeconds, startMilliseconds ] = timestamps
        .substring(0, 12)
        .split(/\D/)
        .map((it) => parseInt(it));
      const [ endHours, endMinutes, endSeconds, endMilliseconds ] = timestamps
        .substring(17)
        .split(/\D/)
        .map((it) => parseInt(it));

      const start = startHours * 1000 * 60 * 60 + startMinutes * 1000 * 60 + startSeconds * 1000 + startMilliseconds;
      const end = endHours * 1000 * 60 * 60 + endMinutes * 1000 * 60 + endSeconds * 1000 + endMilliseconds;

      const [ signalRaw, chRaw, flightTimeRaw, uavBatRaw, glsBatRaw, uavBatCellsRaw, glsBatCellsRaw, delayRaw, bitrateRaw, rcSignalRaw ] = text.split(" ");
      const signal = signalRaw.split(":")[1];
      const ch = chRaw.split(":")[1];
      const flightTime = parseInt(flightTimeRaw.split(":")[1]);
      const uavBat = uavBatRaw.split(":")[1];
      const glsBat = glsBatRaw.split(":")[1];
      const uavBatCells = uavBatCellsRaw.split(":")[1];
      const glsBatCells = glsBatCellsRaw.split(":")[1];
      const delay = delayRaw.split(":")[1];
      const bitrate = bitrateRaw.split(":")[1];
      const rcSignal = rcSignalRaw.split(":")[1];

      const formatFlightTime = (totalSeconds: number) => {
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
        const seconds = String(totalSeconds % 60).padStart(2, "0");
        return `${minutes}' ${seconds}"`;
      };

      this.frames.push({
        start,
        end,
        signal,
        ch: "CH" + ch,
        flightTime: formatFlightTime(flightTime),
        uavBat,
        glsBat,
        uavBatCells,
        glsBatCells,
        delay,
        bitrate,
        rcSignal,
      });
    }
  }

  static async fromFile(file: File): Promise<SrtReader> {
    const data = await file.text();
    return new SrtReader(data);
  }
}
