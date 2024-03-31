const hexToRgba = (hex: string, opacity = 1) => {
  if (hex?.includes('rgba')) {
    const rgba = hex.split(',');
    rgba.splice(rgba?.length - 1, 1, `${opacity})`);
    return rgba.join(',');
  }
  if (hex?.length < 7) {
    console.warn('需要完整的6位hex颜色');
    return '';
  }

  const r = parseInt(`0x${hex?.slice(1, 3)}`);
  const g = parseInt(`0x${hex?.slice(3, 5)}`);
  const b = parseInt(`0x${hex?.slice(5, 7)}`);
  const a = opacity;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export default hexToRgba;
