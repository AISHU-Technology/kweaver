/* eslint-disable no-param-reassign */
/* eslint-disable max-params */
import ImageBitmap from '../classes/ImageBitmap';

export default jest.fn(function createImageBitmap(img, sx, sy, sWidth, sHeight, options) {
  const { length } = arguments;
  return new Promise((resolve, reject) => {
    if (length === 0) {
      return reject(
        new TypeError("Failed to execute 'createImageBitmap' on 'Window': 1 argument required, but only 0 present.")
      );
    }
    if (length === 3 || length === 4) {
      return reject(
        new TypeError(
          `Failed to execute 'createImageBitmap' on 'Window': Valid arities are: [1, 2, 5, 6], but ${length} arguments provided.`
        )
      );
    }
    let validImage = false;
    if (img instanceof HTMLImageElement) validImage = true;
    if (img instanceof HTMLVideoElement) validImage = true;
    if (img instanceof HTMLCanvasElement) validImage = true;
    // checking constructor name is the only reliable way to verify the object's constructing class is "blob-like"
    if (img instanceof Blob || (img && img.constructor && img.constructor.name === 'Blob')) {
      validImage = true;
    }
    if (img instanceof ImageBitmap) validImage = true;
    if (img instanceof ImageData) validImage = true;
    if (!validImage) {
      return reject(
        new TypeError(
          "Failed to execute 'createImageBitmap' on 'Window': The provided value is not of type '(HTMLImageElement or SVGImageElement or HTMLVideoElement or HTMLCanvasElement or Blob or ImageData or ImageBitmap or OffscreenCanvas)'"
        )
      );
    }
    if (length >= 2) {
      let index = 6;
      if (length === 2) {
        index = 2;
        options = sx;
      }
      if (length === 5) options = null;
      if (options !== null && options !== undefined) {
        if (typeof options !== 'object') {
          throw new TypeError(
            `Failed to execute 'createImageBitmap' on 'Window': parameter ${index} ('options') is not an object.`
          );
        }
      }
    }

    if (length >= 5) {
      sWidth = Number(sWidth);
      sHeight = Number(sHeight);
      if (sWidth === 0 || !Number.isFinite(sWidth)) {
        return reject(new RangeError('The crop rect width is 0.'));
      }
      if (sHeight === 0 || !Number.isFinite(sHeight)) {
        return reject(new RangeError('The crop rect height is 0.'));
      }
      sWidth = Math.abs(sWidth);
      sHeight = Math.abs(sHeight);
    } else {
      sWidth = img.width || 1;
      sHeight = img.height || 1;
    }
    return resolve(new ImageBitmap(sWidth, sHeight));
  });
});
