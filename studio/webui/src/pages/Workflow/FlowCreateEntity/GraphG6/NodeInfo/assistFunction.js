/**
 * @description 处理属性(以数组的形式存储)
 */
const handleProperty = (properties, properties_index) => {
  let property = properties;

  property = property.map((item, index) => {
    if (properties_index?.includes(item?.[0])) {
      item[2] = true;

      return item;
    }

    item[2] = false;

    return item;
  });

  return property;
};

export { handleProperty };
