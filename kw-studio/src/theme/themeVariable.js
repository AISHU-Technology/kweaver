/**
 * 主题变量
 */

const { inputToRGB } = require('@ctrl/tinycolor');
const { generate } = require('@ant-design/colors');

const antdTheme = {
  primaryColor: '#126ee3',
  successColor: '#52c41a',
  warningColor: '#faad14',
  errorColor: '#f5222d',
  infoColor: '#126ee3'
};

const antdCssMap = {
  primaryColor: '--ant-primary-color',
  successColor: '--ant-success-color',
  warningColor: '--ant-warning-color',
  errorColor: '--ant-error-color',
  infoColor: '--ant-info-color'
};

const adTheme = {
  primaryColor: '#126ee3',
  successColor: '#52c41a',
  warningColor: '#faad14',
  errorColor: '#f5222d',
  infoColor: '#126ee3',
  disabledColor: 'rgba(0, 0, 0, 0.25)',

  linkColor: 'rgba(52,97,236,.8)',
  linkHoverColor: '#3461ec',
  headingColor: 'rgba(0, 0, 0, 0.85)',
  textColor: 'rgba(0, 0, 0, 0.65)',
  textColorSecondary: 'rgba(0, 0, 0, 0.45)',

  borderRadiusBase: '3px',
  borderColorBase: 'rgba(0, 0, 0, 0.15)',
  boxShadowBase:
    '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
  lineColor: 'rgba(0, 0, 0, 0.06)',
  hoverBgColor: '#f5f5f5',
  selectBgColor: '#f1f7fe'
};

const adCssMap = {
  primaryColor: '--kw-primary-color',
  warningColor: '--kw-warning-color',
  errorColor: '--kw-error-color',
  infoColor: '--kw-info-color',
  disabledColor: '--kw-disabled-color',

  linkColor: '--kw-link-color',
  linkHoverColor: '--kw-link-hover-color',
  headingColor: '--kw-heading-color',
  textColor: '--kw-text-color',
  textColorSecondary: '--kw-text-color-secondary',

  borderRadiusBase: '--kw-border-radius-base',
  borderColorBase: '--kw-border-color-base',
  boxShadowBase: '--kw-box-shadow-base',
  lineColor: '--kw-line-color',
  hoverBgColor: '--kw-hover-bg-color',
  selectBgColor: '--kw-select-bg-color'
};

/**
 * 生成rgb通道值, rgb(1, 2, 3) => 1, 2, 3
 * @param {String} colorVal 颜色值
 */
const createRgbValue = colorVal => {
  const { ok, r, g, b } = inputToRGB(colorVal);

  return ok && `${r}, ${g}, ${b}`;
};

/**
 * 计算一些特殊的变量：rgb值, 主色hover值
 * @param {Object} variables 修改的变量
 */
const otherVariables = variables => {
  const cssObj = {};

  Object.keys(antdTheme).forEach(key => {
    const cssValue = adTheme[key];
    const cssKey = adCssMap[key];
    const rgb = createRgbValue(cssValue);

    rgb && (cssObj[`${cssKey}-rgb`] = rgb);
  });

  const primaryColor = inputToRGB(variables.primaryColor);
  const colorPalettes = generate(primaryColor);
  const primaryHover = colorPalettes[4];

  cssObj[`${adCssMap.primaryColor}-hover`] = primaryHover;

  return cssObj;
};

/**
 * 构造css变量对象, { primaryColor: red } --> { --kw-primary-color: red }
 * @param {Object || undefined} variables 修改的变量, 不传参则初始化所有
 */
const createVariables = variables => {
  const newVariables = Object.assign({}, adTheme, variables || {});
  const cssObj = {};
  const otherObj = otherVariables(newVariables);

  Object.entries(newVariables).forEach(item => (cssObj[adCssMap[item[0]]] = item[1]));

  return Object.assign(cssObj, otherObj);
};

module.exports = { createVariables, antdTheme, antdCssMap, adTheme, adCssMap };
