import CanvasRenderingContext2D from './CanvasRenderingContext2D';

// Path2D.prototype
const Path2DFunc = ['addPath'];

const borrowedFromCanvas = [
  'closePath',
  'moveTo',
  'lineTo',
  'bezierCurveTo',
  'quadraticCurveTo',
  'arc',
  'arcTo',
  'ellipse',
  'rect'
];

export default class Path2D {
  _path = [];

  _events = [];

  _stackIndex = 0;

  _transformStack = [[1, 0, 0, 1, 0, 0]];

  constructor() {
    borrowedFromCanvas.forEach(key => {
      this[key] = jest.fn(CanvasRenderingContext2D.prototype[key].bind(this));
    });
    Path2DFunc.forEach(key => {
      this[key] = jest.fn(this[key].bind(this));
    });
  }

  addPath(path) {
    if (arguments.length < 1) {
      throw new TypeError("Failed to execute 'addPath' on 'Path2D': 1 argument required, but only 0 present.");
    }
    if (!(path instanceof Path2D)) {
      throw new TypeError("Failed to execute 'addPath' on 'Path2D': parameter 1 is not of type 'Path2D'.");
    }
    for (let i = 0; i < path._path.length; i++) this._path.push(path._path[i]);
  }
}
