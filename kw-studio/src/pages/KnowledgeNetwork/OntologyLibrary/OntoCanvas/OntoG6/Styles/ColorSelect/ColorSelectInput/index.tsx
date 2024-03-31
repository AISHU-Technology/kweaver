import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

import ColorSelect from '../index';

import './style.less';

const ColorSelectInput = (props: any) => {
  const { style = {}, className, panelClassName = '' } = props;
  const { type, color, label, direction = 'vertical' } = props;
  const { onChangeColor } = props;

  useEffect(() => {
    const modal = document.querySelector('.displayModalRoot');
    if (!modal) return;
    const close = (e: any) => {
      const colorSelectContainer = modal.querySelector('.colorSelectContainer');
      if (!e.target.contains(colorSelectContainer)) return;
      onCloseIsShowSelect();
    };
    modal.addEventListener('click', close);
    return () => {
      modal.removeEventListener('click', close);
    };
  }, []);

  const [isShowSelect, setIsShowSelect] = useState(false);
  const onOpenIsShowSelect = () => setIsShowSelect(true);
  const onCloseIsShowSelect = () => setIsShowSelect(false);

  return (
    <div className={classnames('colorSelectInputRoot', className)} style={style}>
      <div className={classnames({ horizontal: direction === 'horizontal', vertical: direction === 'vertical' })}>
        {label && <div className="label">{label}</div>}
        <div style={{ width: '100%', position: 'relative' }}>
          <div
            className="colorSelectContainer"
            onClick={() => {
              if (isShowSelect) {
                onCloseIsShowSelect();
              } else {
                onOpenIsShowSelect();
              }
            }}
          >
            <div className="kw-align-center">
              <div className="demo" style={{ backgroundColor: color }} />
              <span>{color}</span>
            </div>
            {isShowSelect ? (
              <Tooltip title={intl.get('exploreGraph.style.collapse')}>
                <UpOutlined />
              </Tooltip>
            ) : (
              <Tooltip title={intl.get('exploreGraph.style.expand')}>
                <DownOutlined />
              </Tooltip>
            )}
          </div>
          {isShowSelect && (
            <div className={classnames('box', panelClassName)}>
              <ColorSelect
                value={color}
                onChangeColor={(data: any) => {
                  data.type = type;
                  onChangeColor(data);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColorSelectInput;
