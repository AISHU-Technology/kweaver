import React, { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { Button } from 'antd';
import './style.less';
import KMLeftContainer from './KMLeftContainer/KMLeftContainer';
import KMRightContainer from './KMRightContainer/KMRightContainer';
import KMFooter from './KMFooter/KMFooter';
import KnowledgeMapContext from './KnowledgeMapContext';

import { SplitBox } from '@antv/x6-react-components';
import '@antv/x6-react-components/es/split-box/style/index.css';

interface KnowledgeMapProps {
  onPrev: () => void; // 上一步
  onSave: () => void; // 保存按钮
  currentStep: number; // 第几步
  footerRef: React.Ref<any>;
  defaultParsingRule: any;
  parsingSet: any;
  setParsingSet: (data: any) => void;
  setParsingTreeChange: (data: any) => void;
  parsingTreeChange: any;
}

/**
 * 知识映射组件（原流程四 流程五  流程六的合并）
 * @constructor
 */
const KnowledgeMap: React.FC<PropsWithChildren<KnowledgeMapProps>> = props => {
  const {
    onPrev,
    onSave,
    footerRef,
    currentStep,
    defaultParsingRule,
    parsingSet,
    setParsingSet,
    parsingTreeChange,
    setParsingTreeChange
  } = props;
  const prefixCls = 'knowledge-map';
  const [sizeState, setSizeState] = useState({
    size: 0,
    minSize: 0,
    maxSize: 0
  });
  const [arFileSave, setArFileSave] = useState<any>({});
  const sizeCache = useRef({ type: 'g6', list: 0, g6: 0 }); // [bug 481976] 记住切换前的宽度
  const ref = useRef<any>();

  useEffect(() => {
    const minSize = 560;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const maxSize = viewportWidth - minSize;
    setSizeState({
      size: viewportWidth / 2,
      minSize,
      maxSize
    });
  }, []);

  const calculateSizeG6 = () => {
    sizeCache.current.type = 'g6';
    const minSize = 560;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    setSizeState(prevState => ({
      ...prevState,
      minSize,
      size: sizeCache.current.g6 || viewportWidth / 2
    }));
  };

  const calculateSizeList = () => {
    sizeCache.current.type = 'list';
    const minSize = 400;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const maxSize = viewportWidth - 560;
    setSizeState(prevState => ({
      ...prevState,
      size: sizeCache.current.list || minSize,
      minSize
    }));
  };

  /**
   * x6空白处的点击事件
   */
  const onX6BlankClick = () => {
    ref.current?.ontologyG6Ref?.updateGraphDataStatusByDataFile();
  };

  return (
    <KnowledgeMapContext currentStep={currentStep}>
      <div className={`${prefixCls} kw-w-100 kw-h-100`}>
        <SplitBox
          size={sizeState.size}
          minSize={sizeState.minSize}
          maxSize={sizeState.maxSize}
          onResizeEnd={(newSize: any) => {
            (sizeCache.current as any)[sizeCache.current.type] = newSize;
            // setSizeState(prevState => ({
            //   ...prevState,
            //   size: newSize
            // }));
          }}
        >
          <KMLeftContainer
            onOntologyDisplayTypeChange={type => {
              if (type === 'g6') {
                calculateSizeG6();
              }
              if (type === 'list') {
                calculateSizeList();
              }
            }}
            ref={ref}
          />
          <KMRightContainer
            defaultParsingRule={defaultParsingRule}
            parsingSet={parsingSet}
            setParsingSet={setParsingSet}
            parsingTreeChange={parsingTreeChange}
            setParsingTreeChange={setParsingTreeChange}
            onX6BlankClick={onX6BlankClick}
            arFileSave={arFileSave}
            setArFileSave={setArFileSave}
          />
        </SplitBox>
        <div className={`${prefixCls}-footer`}>
          <KMFooter onSave={onSave} onPrev={onPrev} ref={footerRef} />
        </div>
      </div>
    </KnowledgeMapContext>
  );
};

export default KnowledgeMap;
