import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import _ from 'lodash';
import Styles from '../../components/Styles';

import './style.less';
import { useLocation } from 'react-router-dom';

export interface EntityStyleDataType {
  type: string;
  fillColor: string;
  strokeColor: string;
  size: number;
  labelFill: string;
  position: string;
  labelType: string;
  labelLength: number;
  labelFixLength: number;
  icon: string;
  iconColor: string;
}

export interface EntityStyleProps {
  entityStyleData: EntityStyleDataType;
  updateData: Function;
  ontoLibType: string;
  selectedElement: Record<string, any>;
}

export interface EntityStyleRef {
  dataSummary: React.MutableRefObject<EntityStyleDataType | undefined>;
}

const EntityClassStyle: React.ForwardRefRenderFunction<EntityStyleRef, EntityStyleProps> = (styleProps, styleRef) => {
  // 对外暴露的属性或者方法
  useImperativeHandle(styleRef, () => ({
    dataSummary
  }));
  const { updateData, entityStyleData, ontoLibType, selectedElement } = styleProps;
  const dataSummary = useRef<EntityStyleDataType | undefined>();
  const location = useLocation<any>();
  const viewMode = location.state?.mode === 'view'; // 是否处于查看模式
  useEffect(() => {
    setStyleData(entityStyleData);
  }, []);

  const [styleData, setStyleData] = useState<EntityStyleDataType>(entityStyleData);

  useEffect(() => {
    dataSummary.current = styleData;
    updateData();
  }, [styleData]);

  return (
    <Styles
      modalType={'node'}
      batchClass={['nodeStyle']}
      styleData={styleData}
      onChangeData={data => {
        const newStyle = data.data.node.nodeStyle;
        const newData = { ...styleData, ...newStyle };
        setStyleData(newData);
      }}
      onUpdateStyle={() => {}}
      readOnly={ontoLibType === 'view' || viewMode}
      selectedElement={selectedElement}
    />
  );
};

export default forwardRef(EntityClassStyle);
