import React from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import * as _intl from 'react-intl-universal';
import { Tooltip } from 'antd';

import { TextInterface } from '../type';

import './style.less';

const TEXT_ALIGN = {
  start: 'kw-format-start',
  center: 'kw-format-center',
  end: 'kw-format-end'
};

/**
 * @param {string}  tip         - 文字提示
 * @param {string}  intl        - 国际化
 * @param {object}  style       - 内联样式
 * @param {string}  align       - 剧中方式 start | center | end
 * @param {number}  level       - 字体大小和行高级别, 默认为: 2, 1:12px | 2:14px | 3:16px | ...
 * @param {number}  strong      - 字体粗细级别，默认为: 4, 1:100 | 2:200 | 3:300 | ...
 * @param {boolean} noHeight    - 文字是否有高度，默认为: false
 * @param {string}  tipPosition - 文字提示位置，默认为: topLeft
 * @param {string}  className   - class名
 * @param {boolean} ellipsis    - 单行超长是否显示省略号
 * @param {boolean} subText     - 次文本
 * @param {string}  title       - 原生html属性
 * @param {Function}onClick     - 点击事件
 * @returns Component
 */
const Text = (props: TextInterface) => {
  const {
    tip,
    intl,
    style,
    align,
    level = 21,
    strong = 4,
    noHeight = false,
    tipPosition = 'topLeft',
    className,
    block,
    ellipsis,
    subText,
    title,
    onClick
  } = props;
  const text = intl ? _intl.get(intl) : props.children;
  const textAlign = TEXT_ALIGN[align as keyof typeof TEXT_ALIGN] || '';

  const component = (
    <div
      className={classnames(
        `kw-format-text${block ? '-block' : ''}`,
        noHeight ? `kw-format-text-no-height-${level}` : `kw-format-text-${level}`,
        `kw-format-strong-${strong}`,
        { 'kw-ellipsis': ellipsis },
        { 'kw-c-subtext': subText },
        textAlign,
        className
      )}
      title={title}
      style={style}
      onClick={onClick}
    >
      {text}
    </div>
  );

  if (tip) {
    return (
      <Tooltip title={tip} placement={tipPosition}>
        {component}
      </Tooltip>
    );
  }
  return component;
};

export default Text;
