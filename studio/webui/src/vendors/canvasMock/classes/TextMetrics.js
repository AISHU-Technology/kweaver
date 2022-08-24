export default class TextMetrics {
  width = 0;

  actualBoundingBoxLeft = 0;

  actualBoundingBoxRight = 0;

  fontBoundingBoxAscent = 0;

  fontBoundingBoxDescent = 0;

  actualBoundingBoxAscent = 0;

  actualBoundingBoxDescent = 0;

  emHeightAscent = 0;

  emHeightDescent = 0;

  hangingBaseline = 0;

  alphabeticBaseline = 0;

  ideographicBaseline = 0;

  constructor(text) {
    this.width = text.length;
  }
}
