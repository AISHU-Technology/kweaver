/**
 * 认知引擎
 */
import React, { memo } from 'react';
import CognitiveSearch from './CognitiveSearch';

import './style.less';

interface CognitiveEngineProps {
  kgData: Record<string, any>;
}

const CognitiveEngine: React.FC<CognitiveEngineProps> = props => {
  const { kgData } = props;

  return (
    <div className="kg-cognitive-engine">
      <CognitiveSearch kgData={kgData} />
    </div>
  );
};

export default memo(CognitiveEngine);
