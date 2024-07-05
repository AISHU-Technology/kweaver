import React, { useRef, useState, useEffect } from 'react';
import _ from 'lodash';

import { UseComponentsType } from './types';
import EntityInfo from './components/EntityInfo';
import RelatedLabel from './components/RelatedLabel';
import RelatedDocument1 from './components/RelatedDocument1';
import RelatedDocument2 from './components/RelatedDocument2';

import './style.less';

const ENTITY_INFO = 'entity_info' as const;
const RELATED_LABEL = 'related_label';
const RELATED_DOCUMENT_1 = 'related_document_1';
const RELATED_DOCUMENT_2 = 'related_document_2';

const COMPONENT: any = {
  [ENTITY_INFO]: (data: any) => {
    return <EntityInfo {...data} />;
  },
  [RELATED_LABEL]: (data: any) => {
    return <RelatedLabel {...data} />;
  },
  [RELATED_DOCUMENT_1]: (data: any) => {
    return <RelatedDocument1 {...data} />;
  },
  [RELATED_DOCUMENT_2]: (data: any) => {
    return <RelatedDocument2 {...data} />;
  }
};

const useComponents = (props: UseComponentsType) => {
  const { mode, language, configs, skeleton, loading } = props;
  const { toNextDetail, toAsPreview } = props;
  const key = useRef(0);

  const [source, setSource] = useState<any>([]);
  useEffect(() => {
    key.current = new Date().valueOf();
    const source = _.map(configs, (componentConfig, index) => {
      const { config } = componentConfig;
      const domProps: any = { key: config.type + index, mode, language, componentConfig, skeleton, loading };
      if (config.type === RELATED_LABEL) domProps.toNextDetail = toNextDetail;
      if (config.type === RELATED_DOCUMENT_1) domProps.toAsPreview = toAsPreview;
      if (config.type === RELATED_DOCUMENT_2) domProps.toAsPreview = toAsPreview;
      const dom = COMPONENT[config.type]?.(domProps) || (
        <div style={{ minHeight: 100 }}>{config.id || String(index)}</div>
      );
      return { ...config, dom };
    });
    setSource(source);
  }, [JSON.stringify(configs), loading]);

  return { source, key: key.current };
};

export default useComponents;
