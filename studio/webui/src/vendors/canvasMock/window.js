import Path2D from './classes/Path2D';
import CanvasGradient from './classes/CanvasGradient';
import CanvasPattern from './classes/CanvasPattern';
import CanvasRenderingContext2D from './classes/CanvasRenderingContext2D';
import DOMMatrix from './classes/DOMMatrix';
import ImageData from './classes/ImageData';
import TextMetrics from './classes/TextMetrics';
import ImageBitmap from './classes/ImageBitmap';
import mockPrototype from './mock/prototype';
import createImageBitmap from './mock/createImageBitmap';

export default win => {
  if (!win.Path2D) win.Path2D = Path2D;
  if (!win.CanvasGradient) win.CanvasGradient = CanvasGradient;
  if (!win.CanvasPattern) win.CanvasPattern = CanvasPattern;
  if (!win.CanvasRenderingContext2D) win.CanvasRenderingContext2D = CanvasRenderingContext2D;
  if (!win.DOMMatrix) win.DOMMatrix = DOMMatrix;
  if (!win.ImageData) win.ImageData = ImageData;
  if (!win.TextMetrics) win.TextMetrics = TextMetrics;
  if (!win.ImageBitmap) win.ImageBitmap = ImageBitmap;
  if (!win.createImageBitmap) win.createImageBitmap = createImageBitmap;

  mockPrototype();

  return win;
};
