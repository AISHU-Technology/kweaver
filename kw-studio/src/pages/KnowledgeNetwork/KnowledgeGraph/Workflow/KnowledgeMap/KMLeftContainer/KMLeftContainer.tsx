import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import OntologyG6 from './OntologyG6/OntologyG6';
import OntologyList from './OntologyList/OntologyList';
import { Button } from 'antd';
import { useKnowledgeMapContext } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';
import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';

type KMLeftContainerProps = {
  onOntologyDisplayTypeChange?: (type: 'g6' | 'list') => void;
};

type KMLeftContainerRefProps = {
  ontologyG6Ref?: any;
};

/**
 * 知识映射左侧容器
 */
const KMLeftContainer = forwardRef<KMLeftContainerRefProps, KMLeftContainerProps>(
  ({ onOntologyDisplayTypeChange }, ref) => {
    const {
      knowledgeMapStore: { ontologyDisplayType, graphG6Data }
    } = useKnowledgeMapContext();

    const ontologyG6Ref = useRef<any>();

    useImperativeHandle(ref, () => ({
      ontologyG6Ref: ontologyG6Ref.current
    }));

    useEffect(() => {
      onOntologyDisplayTypeChange?.(ontologyDisplayType);
    }, [ontologyDisplayType]);

    /**
     * 取消选中
     */
    const onCancelSelected = () => {
      ontologyG6Ref.current?.cancelSelected();
    };

    return (
      <>
        <div className="kw-w-100 kw-h-100" style={{ display: ontologyDisplayType === 'g6' ? 'block' : 'none' }}>
          <OntologyG6 ref={ontologyG6Ref} />
        </div>
        <div className="kw-w-100 kw-h-100" style={{ display: ontologyDisplayType === 'list' ? 'block' : 'none' }}>
          <OntologyList onCancelSelected={onCancelSelected} />
        </div>
      </>
    );
  }
);

export default KMLeftContainer;
