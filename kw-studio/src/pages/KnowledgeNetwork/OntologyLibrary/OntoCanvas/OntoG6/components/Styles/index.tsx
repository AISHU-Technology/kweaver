import React, { useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classnames from 'classnames';

import Format from '@/components/Format';
import Size from './Size';
import IconDropdown from './IconDropdown';
import ColorDropDown from './ColorDropDown';
import PositionDropdown from './PositionDropdown';
import Length from './Length';

import './style.less';

type StylesType = {
  className?: string;
  style?: React.CSSProperties;
  modalType: string;
  styleData: any;
  readOnly?: boolean;
  onChangeData: (data: any) => void;
  onUpdateStyle: (data: any, changeData?: any) => void;
  batchClass?: string[];
  selectedElement: Record<string, any>;
};
const Styles = (props: StylesType) => {
  const { className, style, modalType, batchClass, styleData, readOnly } = props;
  const { onChangeData, onUpdateStyle } = props;
  const [hasChangeKeys, setHasChangeKeys] = useState<string[]>([]);

  const onUpdate = (data: any) => {
    const keys: string[] = _.keys(data);
    setHasChangeKeys([...hasChangeKeys, ...keys]);
    onUpdateStyle({ ...styleData, ...data }, data);

    let key = '';
    if (styleData.scope === 'one') key = styleData.id;
    if (styleData.scope === 'all') key = styleData._class || styleData.class;
    const newConfig: any = { node: {}, edge: {}, more: {}, type: styleData.scope };

    newConfig[modalType][key] = data;

    if (!_.isEmpty(batchClass)) {
      _.forEach(batchClass, _key => {
        newConfig[modalType][_key] = data;
      });
    }

    onChangeData({ type: 'config', data: newConfig });
  };

  return (
    <div className={classnames(className, 'stylesRoot')} style={style}>
      <Format.Title className="kw-mb-2">{intl.get('exploreGraph.style.icon')}</Format.Title>
      <IconDropdown
        className="kw-mb-4"
        icon={styleData.icon}
        modalType={'node'}
        readOnly={readOnly}
        onChange={(icon: string) => {
          onUpdate({ icon });
        }}
      />
      <ColorDropDown
        className="kw-mb-4"
        label={intl.get('exploreGraph.style.fillColor')}
        color={styleData.iconColor || '#ffffff'}
        readOnly={readOnly}
        onChange={(color: any) => {
          onUpdate({ iconColor: color.rgba });
        }}
      />

      <Format.Title className="kw-mb-2">{intl.get('exploreGraph.style.shape')}</Format.Title>
      <Size
        className="kw-mb-4"
        value={styleData?.size}
        modalType={modalType}
        readOnly={readOnly}
        onChange={(value: number) => onUpdate({ size: value })}
      />
      <ColorDropDown
        className="kw-mb-4"
        label={intl.get('exploreGraph.style.fillColor')}
        color={styleData.fillColor || '#ffffff'}
        readOnly={readOnly}
        onChange={(color: any) => {
          onUpdate({ fillColor: color.rgba });
        }}
      />
      <ColorDropDown
        className="kw-mb-4"
        label={intl.get('exploreGraph.style.strokeColor')}
        color={styleData.strokeColor || '#ffffff'}
        readOnly={readOnly}
        onChange={(color: any) => {
          onUpdate({ strokeColor: color.rgba });
        }}
      />

      <Format.Title className="kw-mb-2">{intl.get('exploreGraph.style.word')}</Format.Title>
      <ColorDropDown
        className="kw-mb-4"
        label={intl.get('exploreGraph.style.textColor')}
        color={styleData.labelFill || '#666666'}
        readOnly={readOnly}
        onChange={(color: any) => {
          onUpdate({ labelFill: color.rgba });
        }}
      />
      <PositionDropdown
        className="kw-mb-4"
        value={styleData.position || '#666666'}
        readOnly={readOnly}
        onChange={(value: any) => {
          onUpdate({ position: value });
        }}
      />
      <Length
        value={styleData.labelLength}
        readOnly={readOnly}
        onChange={(value: any) => {
          onUpdate({ labelLength: value });
        }}
      />
    </div>
  );
};

export default Styles;
