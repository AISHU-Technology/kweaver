import React, { useState } from 'react';
import { Dropdown } from 'antd';
import _ from 'lodash';
import classnames from 'classnames';

import StyleInput from '../StyleInput';
import ColorSelect from '../ColorSelect';
import '../baseStyle.less';

export interface IconDropdownProps {
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  color: string;
  readOnly?: boolean;
  onChange: (colorObj: { rgb: any; hex: string; [key: string]: any }) => void;
}

const ColorDropDown = (props: IconDropdownProps) => {
  const { className, style, label, color, readOnly, onChange } = props;
  const [visible, setVisible] = useState(false);
  const [DOM, setDOM] = useState<HTMLDivElement | null>(null);

  return (
    <Dropdown
      trigger={['click']}
      visible={visible}
      onVisibleChange={v => !readOnly && setVisible(v)}
      overlay={
        <div className="onto-styles-dropdown kw-p-3" style={{ width: DOM?.clientWidth }}>
          <ColorSelect value={color} onChangeColor={onChange} />
        </div>
      }
    >
      <div ref={setDOM} className={classnames(className)} style={style}>
        <StyleInput
          label={label}
          type="color"
          data={color}
          arrowRotate={visible ? 180 : 0}
          focused={visible}
          readOnly={readOnly}
        />
      </div>
    </Dropdown>
  );
};

export default ColorDropDown;
