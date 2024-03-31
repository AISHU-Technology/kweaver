import React, { useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classnames from 'classnames';

import HELPER from '@/utils/helper';
import { GRAPH_LAYOUT } from '@/enums';
import HeaderTabs from './HeaderTabs';
import Shape from './Shape';
import Color from './Color';
import Size from './Size';
import Label from './Label';
import Icon from './Icon';

import './style.less';

const Block = (props: any) => {
  const { _key, selected, children } = props;
  return <div className={classnames('block', { displayBlock: _key === selected })}>{children}</div>;
};

const STYLES_HEADER: any = {
  node: [
    { key: 'type', label: intl.get('exploreGraph.style.shape') },
    { key: 'color', label: intl.get('exploreGraph.style.color') },
    { key: 'size', label: intl.get('exploreGraph.style.size') },
    { key: 'label', label: intl.get('exploreGraph.style.text') },
    { key: 'icon', label: intl.get('exploreGraph.style.icon') }
  ],
  edge: [
    // { key: 'type', label: intl.get('exploreGraph.style.shape') },
    { key: 'color', label: intl.get('exploreGraph.style.color') },
    { key: 'size', label: intl.get('exploreGraph.style.width') }
    // { key: 'label', label: intl.get('exploreGraph.style.text') }
  ],
  more: [
    { key: 'type', label: intl.get('exploreGraph.style.shape') },
    { key: 'color', label: intl.get('exploreGraph.style.color') },
    { key: 'label', label: intl.get('exploreGraph.style.text') },
    { key: 'icon', label: intl.get('exploreGraph.style.icon') }
  ]
};

type StylesType = {
  className?: string;
  style?: React.CSSProperties;
  modalType: string;
  updateData: any;
  layoutType: string;
  onChangeData: (data: any) => void;
  onUpdateStyle: (data: any, changeData?: any) => void;
  batchClass?: string[];
  ontoLibType: string;
  selectedElement: Record<string, any>;
};
const Styles = (props: StylesType) => {
  const { className, style, modalType, batchClass, updateData, layoutType, ontoLibType, selectedElement } = props;
  const { onChangeData, onUpdateStyle } = props;
  const [hasChangeKeys, setHasChangeKeys] = useState<string[]>([]);
  const [selected, setSelected] = useState(modalType !== 'edge' ? 'type' : 'color');

  const onChangeSelected = (value: string) => () => setSelected(value);

  const onUpdate = (data: any) => {
    const keys: string[] = _.keys(data);
    setHasChangeKeys([...hasChangeKeys, ...keys]);
    onUpdateStyle({ ...updateData, ...data }, data);

    let key = '';
    if (updateData.scope === 'one') key = updateData.id;
    if (updateData.scope === 'all') key = updateData._class || updateData.class;
    const newConfig: any = { node: {}, edge: {}, more: {}, type: updateData.scope };

    newConfig[modalType][key] = data;

    if (!_.isEmpty(batchClass)) {
      _.forEach(batchClass, _key => {
        newConfig[modalType][_key] = data;
      });
    }

    onChangeData({ type: 'config', data: newConfig });
  };

  const isRect = updateData?.type === 'customRect';
  const isTree = layoutType === GRAPH_LAYOUT.TREE;
  const isBatchClass = !_.isEmpty(batchClass);

  return (
    <div className={classnames(className, 'stylesRoot')} style={style}>
      <HeaderTabs items={STYLES_HEADER[modalType]} selected={selected} onChangeSelected={onChangeSelected} />
      <div className="kw-mt-4" style={{ height: 'calc(100% - 48px)' }}>
        <Block _key="type" selected={selected}>
          <Shape
            value={updateData?.type}
            // value={isBatchClass && !_.includes(hasChangeKeys, 'type') ? '' : updateData?.type}
            modalType={modalType}
            onChange={(value: string) => {
              const data: any = { type: value };
              if (value === 'customCircle') data.labelType = 'adapt';
              // if (value === 'customRect') {
              //   data.fillColor = HELPER.hexToRgba(updateData.fillColor, 0.8) || data.fillColor;
              // }
              onUpdate(data);
            }}
            ontoLibType={ontoLibType}
            selectedElement={selectedElement}
          />
        </Block>
        <Block _key="color" selected={selected}>
          <Color
            modalType={modalType}
            fillColor={updateData?.fillColor}
            strokeColor={
              updateData.type === 'customCircle' && !updateData?.strokeColor
                ? updateData?.fillColor
                : updateData?.strokeColor
            }
            isFillAndStroke={isRect}
            onChange={(data: any) => {
              if ((updateData.type === 'customCircle' || updateData.type === 'circle') && data?.fillColor) {
                onUpdate({ ...data, strokeColor: data?.fillColor });
              } else {
                onUpdate(data);
              }
            }}
          />
        </Block>
        <Block _key="size" selected={selected}>
          <Size
            value={updateData?.size}
            // value={isBatchClass && !_.includes(hasChangeKeys, 'size') ? '' : updateData?.size}
            disabled={isTree || (isRect && updateData?.position === 'center')}
            modalType={modalType}
            shapeType={updateData?.type}
            onChange={(value: number) => onUpdate({ size: value })}
          />
        </Block>
        <Block _key="label" selected={selected}>
          <Label
            value={{
              labelFill: updateData?.labelFill,
              showLabels: updateData?.showLabels,
              labelType: updateData?.labelType,
              labelLength: updateData?.labelLength,
              labelFixLength: updateData?.labelFixLength,
              position: isTree && isRect ? 'center' : updateData?.position
            }}
            shapeType={updateData?.type}
            modalType={modalType}
            isBatchClass={isBatchClass}
            disabledPosition={isRect && isTree}
            onChange={(data: any) => {
              if (data.position && data.position !== 'center') data.labelType = 'adapt';
              onUpdate(data);
            }}
          />
        </Block>
        <Block _key="icon" selected={selected}>
          <Icon
            icon={updateData?.icon}
            // icon={isBatchClass && !_.includes(hasChangeKeys, 'icon') ? '' : updateData.icon}
            iconColor={updateData.iconColor}
            modalType={modalType}
            onChange={(value: { type: string; [key: string]: any }) => {
              const { type } = value;
              onUpdate({ [type]: value[type] });
            }}
          />
        </Block>
      </div>
    </div>
  );
};

export default Styles;
