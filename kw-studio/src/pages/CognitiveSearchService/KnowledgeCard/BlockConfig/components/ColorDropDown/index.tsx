import React, { useState } from 'react';
import { Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import _ from 'lodash';
import classnames from 'classnames';
import './style.less';
import ColorSelect from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/components/Styles/ColorSelect';

export interface IconDropdownProps {
  className?: string;
  style?: React.CSSProperties;
  color: string;
  disabled?: boolean;
  onChange: (colorObj: { rgb: any; hex: string; [key: string]: any }) => void;
}

const ColorDropDown = (props: IconDropdownProps) => {
  const { className, style, color, disabled, onChange } = props;
  const [visible, setVisible] = useState(false);

  return (
    <Dropdown
      trigger={['click']}
      open={visible}
      onOpenChange={v => !disabled && setVisible(v)}
      overlay={
        <div className="knw-card-color-pick-overlay kw-p-3" style={{ width: 350 }}>
          <ColorSelect value={color} onChangeColor={onChange} />
        </div>
      }
    >
      <div
        className={classnames(className, 'knw-card-color-pick kw-center', { focused: visible, disabled })}
        style={style}
      >
        <span className="color-bg kw-mr-2" style={{ background: color }}></span>
        <DownOutlined className="arrow-icon" />
      </div>
    </Dropdown>
  );
};

export default ColorDropDown;
