/**
 *  知识网络颜色
 * @param color
 */
const getKnowledgeNetIcon = (color: string) => {
  switch (color) {
    case '':
      return 'icon-color-zswl10';
    default:
      return '';
  }
};

export default getKnowledgeNetIcon;
