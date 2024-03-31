/**
 * 认知搜索 iframe内嵌页面
 * @author Jason.ji
 * @date 2022/07/04
 *
 */

import React from 'react';
import CognitiveSearch from '@/pages/CognitiveApplication/CognitiveEngine/CognitiveSearch';

const CognitiveSearchIframe = () => {
  return (
    <div style={{ height: '100vh' }}>
      <CognitiveSearch knData={{ id: 7 }} />
    </div>
  );
};

export default CognitiveSearchIframe;
