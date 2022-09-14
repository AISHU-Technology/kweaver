const image2Base64 = (img: any) => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx: any = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height);
  const dataURL = canvas.toDataURL('image/png');
  return dataURL;
};

const getImgBase64 = async (src: any) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.src = src;
      img.onload = function () {
        const _temp = image2Base64(img);
        resolve(_temp);
      };
    } catch (error) {
      resolve('');
    }
  });
};

export default getImgBase64;
