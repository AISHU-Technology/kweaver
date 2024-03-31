import _ from 'lodash';
export const getIntionListByFile = (list: any[]) => {
  const handleEditMes = _.map(list, (item: any, index: any) => {
    const intent_id = index + 1;
    if (typeof item?.entity_name === 'string') {
      let entity_name: any = '';
      if (isValidJSONString(item?.entity_name)) {
        entity_name = JSON.parse(item?.entity_name);
      } else {
        entity_name = _.filter(item?.entity_name?.split("'"), (i: any) => {
          return i !== '[' && i !== ']' && i !== ', ';
        });
      }
      return { ...item, entity_name, intent_id };
    }
    return item;
  });
  const entityHandle = _.map(handleEditMes, (e: any) => {
    if (e.entity_name?.[0] === '[]' || !e.entity_name) {
      e.entity_name = [];
    }
    return e;
  });
  return entityHandle;
};

const isValidJSONString = (str: any) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};
