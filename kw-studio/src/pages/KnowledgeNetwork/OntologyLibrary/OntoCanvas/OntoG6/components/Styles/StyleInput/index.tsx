import React from 'react';
import { DownOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import { GraphIcon, getIconName } from '@/utils/antv6';
import HELPER from '@/utils/helper';
import HOOKS from '@/hooks';
import './style.less';

const StyleInput = (props: any) => {
  const { className, label, type, data, showArrow = true, arrowRotate, renderInput, focused, readOnly } = props;
  const language = HOOKS.useLanguage();

  /**
   * 颜色大写hex展示
   * @param color
   */
  const showColor = (color: string) => {
    let _color = color;
    if (_.includes(color, 'rgb')) {
      _color = HELPER.rgbaToHex(color);
    }
    return _color?.toLocaleUpperCase?.();
  };

  const render = () => {
    if (type === 'icon') {
      return (
        <>
          {!data || data === 'empty' ? (
            intl.get('exploreGraph.style.none')
          ) : (
            <GraphIcon type={data} style={{ fontSize: 20, transform: 'translateY(2px)' }} title={getIconName(data)} />
          )}
        </>
      );
    }

    if (type === 'color') {
      return (
        <>
          <span className="color-bg kw-mr-2" style={{ background: data }}></span>
          <span className="kw-c-header">{showColor(data)}</span>
        </>
      );
    }
    return renderInput || data;
  };

  return (
    <div
      className={classNames(className, 'onto-style-input kw-align-center kw-pl-3 kw-pr-3 ', {
        'kw-pointer': !readOnly,
        EN: language === 'en-US',
        focused,
        readOnly
      })}
    >
      {!!label && <div className="label-text kw-mr-3">{label}</div>}
      <div className="c-input">{render()}</div>
      {showArrow && (
        <div className="arrow-icon">
          <DownOutlined rotate={arrowRotate} />
        </div>
      )}
    </div>
  );
};

export default StyleInput;
