const stringEllipsis = (str: string, length: number) => {
  return !str ? '' : str.length > length ? `${str.slice(0, length)}...` : str;
};

export default stringEllipsis;
