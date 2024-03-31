const colorList = [
  '#fadb14',
  '#ffa039',
  '#f75959',
  '#f759ab',
  '#9254de',
  '#126ee3',
  '#019688',
  '#13c2c2',
  '#52c41a',
  '#8c8c8c'
];

// 对话型icon
export const PROMPT_CHAT_ICONS = colorList.map((color, index) => ({
  color,
  fontClass: `icon-color-duihua${index + 1}`
}));
// 生成型icon
export const PROMPT_COMPLETION_ICONS = colorList.map((color, index) => ({
  color,
  fontClass: `icon-color-wenben${index + 1}`
}));

const getIcons = (type?: 'chat' | 'completion' | string) => {
  if (type === 'chat') return PROMPT_CHAT_ICONS;
  return PROMPT_COMPLETION_ICONS;
};

const getIcon = (icon?: string | number, type?: 'chat' | 'completion' | string) => {
  const icons = getIcons(type);
  const iconIndex = isNaN(Number(icon)) ? 5 : Number(icon);
  return icons[iconIndex] || icons[iconIndex % 10] || icons[5];
};

export const PROMPT_CONFIGS = {
  PROMPT_CHAT_ICONS,
  PROMPT_COMPLETION_ICONS,
  getIcons,
  getIcon
};
