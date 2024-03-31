import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import _ from 'lodash';
import EdgeStyles from '../../components/Styles/EdgeStyles';

import { useLocation } from 'react-router-dom';

export interface EdgeStyleDataType {
  type: string;
  strokeColor: string;
  size: number;
}

export interface EdgeStyleProps {
  edgeStyleData: EdgeStyleDataType;
  updateData: Function;
  ontoLibType: string;
  selectedElement: Record<string, any>;
}

export interface EdgeStyleRef {
  dataSummary: React.MutableRefObject<EdgeStyleDataType | undefined>;
}

const EdgeClassStyle: React.ForwardRefRenderFunction<EdgeStyleRef, EdgeStyleProps> = (styleProps, styleRef) => {
  // 对外暴露的属性或者方法
  useImperativeHandle(styleRef, () => ({
    dataSummary
  }));
  const { updateData, edgeStyleData, ontoLibType, selectedElement } = styleProps;
  const dataSummary = useRef<EdgeStyleDataType | undefined>();
  const [styleData, setStyleData] = useState<EdgeStyleDataType>({
    type: '',
    strokeColor: '',
    size: 0.75
  });
  const location = useLocation<any>();
  const viewMode = location.state?.mode === 'view'; // 是否处于查看模式

  useEffect(() => {
    setStyleData(edgeStyleData);
  }, []);

  useEffect(() => {
    dataSummary.current = styleData;
    updateData();
  }, [styleData]);

  return (
    <EdgeStyles
      modalType={'edge'}
      batchClass={['edgeStyle']}
      styleData={styleData}
      onChangeData={data => {
        const newStyle = data.data.edge.edgeStyle;
        const newData = { ...styleData, ...newStyle };
        setStyleData(newData);
      }}
      onUpdateStyle={() => {}}
      readOnly={ontoLibType === 'view' || viewMode}
      selectedElement={selectedElement}
    />
  );
};

export default forwardRef(EdgeClassStyle);
