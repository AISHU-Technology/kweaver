/**
 * 认知引擎
 */
import React, { memo } from 'react';
import { Tabs } from 'antd';
import intl from 'react-intl-universal';
import CognitiveSearch from './CognitiveSearch';
import './style.less';

interface CognitiveEngineProps {
  kgData: Record<string, any>;
}

const { TabPane } = Tabs;
const SEARCH = 'search';

const CognitiveEngine: React.FC<CognitiveEngineProps> = props => {
  const { kgData } = props;

  return (
    <div className="kg-cognitive-engine">
      <Tabs className="engine-top-tabs">
        <TabPane key={SEARCH} tab={intl.get('global.cognitiveSearch')}>
          <CognitiveSearch kgData={kgData} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default memo(CognitiveEngine);
