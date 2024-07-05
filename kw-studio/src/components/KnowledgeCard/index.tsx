import React from 'react';
import _ from 'lodash';
import useComponents from './useComponents';

import './style.less';

const KnowledgeCardComponent = (props: any) => {
  const { className, style, language, loading, data } = props;
  const { toNextDetail, toAsPreview } = props;
  const components = useComponents({
    configs: data,
    toNextDetail,
    toAsPreview,
    language,
    loading
  });
  return (
    <div className={`kw-knowledge-card-component ${className}`} style={style}>
      {_.map(components.source, s => s.dom)}
    </div>
  );
};

export default KnowledgeCardComponent;
