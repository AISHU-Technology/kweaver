import _ from 'lodash';
const getTemplate = (type: string) => {
  const data: any = [];
  if (type === 'one') {
    for (let i = 0; i <= 10; i++) {
      data.push({ word: `人_${i}`, vid: `鬼_${i}`, graph_id: `人类_${i}` });
    }
  }
  if (type === 'two') {
    for (let i = 0; i <= 10; i++) {
      data.push({
        synonym: `哈哈_${i}`,
        pods: `字符串字符串字符串字符串字符串字符串字符串字符串_${i}`,
        std_property: `物质_${i}`,
        ent_name: `00title_${i}`,
        graph_id: i
      });
    }
  }
  if (type === 'three') {
    for (let i = 0; i <= 10; i++) {
      data.push({ synonym: `哈哈_${i}`, eeee: `vvvvvvvvv_${i}`, cccc: `六六六_${i}`, default: `这很难评_${i}` });
    }
  }

  return data;
};

export const templateOne = getTemplate('one');
export const templateTwo = getTemplate('two');
export const templateThree = getTemplate('three');

export const columnsData = (value: any) => {
  if (!value) return [];
  return Object.keys(value?.[0]);
};
