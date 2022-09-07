/**
 * 认知引擎
 */
import React, { memo } from 'react';
import intl from 'react-intl-universal';

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
      <div className="ad-w-100 ad-pl-5 ad-bg-white ad-border-b" style={{ height: 40 }}>
        <Format.Title className="ad-mt-2"> {intl.get('global.knowledgeSearch')}</Format.Title>
      </div>
      <CognitiveSearch kgData={kgData} />
    </div>
  );
};

export default memo(CognitiveEngine);
