export default class ImageBitmap {
  width = 0;

  height = 0;

  _closed = false;

  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.close = jest.fn(this.close.bind(this));
  }

  close() {
    this.width = 0;
    this.height = 0;
    this._closed = true;
  }
}
