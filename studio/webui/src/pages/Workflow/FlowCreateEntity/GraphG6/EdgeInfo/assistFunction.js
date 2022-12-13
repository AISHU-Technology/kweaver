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

/**
 * @description 是否在流程中
 */
const isFlow = () => {
  if (window.location.pathname === '/home/workflow/edit' || window.location.pathname === '/home/workflow/create') {
    return true;
  }

  return false;
};

const analyUrl = url => {
  if (isFlow()) {
    return { name: '', type: '' };
  }

  if (url === '') {
    return { name: '', type: '' };
  }

  return { name: url.split('&')[0].substring(13), type: url.split('&')[1].substring(5) };
};

export { handleProperty, analyUrl, isFlow };
