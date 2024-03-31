import React, { useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classnames from 'classnames';

import Format from '@/components/Format';
import { GRAPH_LAYOUT } from '@/enums';
import Size from './Size';
import ColorDropDown from './ColorDropDown';

import './style.less';

type StylesType = {
  className?: string;
  style?: React.CSSProperties;
  modalType: string;
  styleData: any;
  onChangeData: (data: any) => void;
  onUpdateStyle: (data: any, changeData?: any) => void;
  batchClass?: string[];
  readOnly?: boolean;
  selectedElement: Record<string, any>;
};
const EdgeStyles = (props: StylesType) => {
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
      <Format.Title className="kw-mb-2">{intl.get('exploreGraph.style.color')}</Format.Title>
      <ColorDropDown
        className="kw-mb-4"
        color={styleData.strokeColor || '#ffffff'}
        readOnly={readOnly}
        onChange={(color: any) => {
          onUpdate({ strokeColor: color.rgba });
        }}
      />

      <Format.Title className="kw-mb-2">{intl.get('exploreGraph.style.width')}</Format.Title>
      <Size
        className="kw-mb-4"
        value={styleData?.size}
        modalType={modalType}
        shapeType={styleData?.type}
        readOnly={readOnly}
        onChange={(value: number) => onUpdate({ size: value })}
      />
    </div>
  );
};

export default EdgeStyles;
