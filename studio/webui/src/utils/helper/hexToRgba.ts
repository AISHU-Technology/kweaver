const hexToRgba = (hex: string, opacity = 1) => {
  if (hex?.length < 7) return console.warn('需要完整的6位hex颜色');
  const r = parseInt(`0x${hex.slice(1, 3)}`);
  const g = parseInt(`0x${hex.slice(3, 5)}`);
  const b = parseInt(`0x${hex.slice(5, 7)}`);
  const a = opacity;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export default hexToRgba;
