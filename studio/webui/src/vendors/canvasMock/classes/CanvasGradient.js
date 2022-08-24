export default class CanvasGradient {
  constructor() {
    this.addColorStop = jest.fn(this.addColorStop.bind(this));
  }

  addColorStop(offset, color) {
    const numoffset = Number(offset);
    if (!Number.isFinite(numoffset) || numoffset < 0 || numoffset > 1) {
      throw new DOMException(
        'IndexSizeError',
        `Failed to execute 'addColorStop' on 'CanvasGradient': The provided value ('${numoffset}') is outside the range (0.0, 1.0)`
      );
    }
  }
}
