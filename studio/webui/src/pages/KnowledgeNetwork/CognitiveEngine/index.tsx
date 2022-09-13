/**
 * 认知引擎
 */
import React, { memo } from 'react';

import Format from '@/components/Format';
import CognitiveSearch from './CognitiveSearch';

import './style.less';

interface CognitiveEngineProps {
  kgData: Record<string, any>;
}

const CognitiveEngine: React.FC<CognitiveEngineProps> = props => {
  const { kgData } = props;

  return (
    <div className="kg-cognitive-engine">
      <div className="ad-border-b ad-bg-white ad-pl-6 ad-pr-6">
        <Format.Title className="ad-mt-5 ad-mb-5">知识网络搜索</Format.Title>
      </div>
      <CognitiveSearch kgData={kgData} />
    </div>
  );
};

export default memo(CognitiveEngine);
