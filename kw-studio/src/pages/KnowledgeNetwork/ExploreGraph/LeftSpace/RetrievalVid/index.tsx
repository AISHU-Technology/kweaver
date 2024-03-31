import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { Tabs, Radio, Space, Popover } from 'antd';
import { CloseOutlined, SettingOutlined } from '@ant-design/icons';

import Retrieval from './Retrieval';
import VidSearch from './VidSearch';
import { DisplayResult, LeftDrawer } from '../components';

import './style.less';

type RetrievalAndVidProps = {
  classData: any; // 当前图谱下所有class
  isLayoutTree: boolean;
  selectedItem: any;
  leftDrawerKey: any;
  onCloseLeftDrawer: () => void;
  onChangeData: (data: { type: string; data: any }) => void;
};
const RetrievalAndVid = (props: RetrievalAndVidProps) => {
  const { classData, selectedItem, isLayoutTree, leftDrawerKey, onChangeData, onCloseLeftDrawer } = props;
  const [searchConfig, setSearchConfig] = useState<Array<any>>([]); // 筛选设置
  const [shouldScaling, setShouldScaling] = useState(false); // 是否可以拉伸

  const [resultPanelDisplay, setResultPanelDisplay] = useState(
    selectedItem?.configFeatures?.resultPanelDisplay?.value || 'notDisplayResult'
  );
  useEffect(() => {
    if (!selectedItem?.configFeatures?.resultPanelDisplay?.value) return;
    setResultPanelDisplay(selectedItem?.configFeatures?.resultPanelDisplay?.value);
  }, [selectedItem?.configFeatures?.resultPanelDisplay?.value]);

  const onChangeResultPanelDisplay = (value: string) => setResultPanelDisplay(value);

  return (
    <LeftDrawer scaling={shouldScaling && leftDrawerKey === 'search'} padding={false}>
      <div className="retrievalAndVidRoot">
        <Tabs
          tabBarExtraContent={
            <span>
              <DisplayResult value={resultPanelDisplay} onChange={onChangeResultPanelDisplay} />
              <CloseOutlined onClick={onCloseLeftDrawer} />
            </span>
          }
        >
          <Tabs.TabPane
            key="1"
            tab={isLayoutTree ? intl.get('exploreGraph.searchTree') : intl.get('exploreGraph.search')}
          >
            <Retrieval
              leftDrawerKey={leftDrawerKey}
              classData={classData}
              selectedItem={selectedItem}
              isLayoutTree={isLayoutTree}
              searchConfig={searchConfig}
              onChangeData={onChangeData}
              onCloseLeftDrawer={onCloseLeftDrawer}
              setSearchConfig={setSearchConfig}
              resultPanelDisplay={resultPanelDisplay}
              onResultVisibleChange={setShouldScaling}
            />
          </Tabs.TabPane>
          <Tabs.TabPane key="2" tab="VID">
            <VidSearch
              leftDrawerKey={leftDrawerKey}
              classData={classData}
              selectedItem={selectedItem}
              isLayoutTree={isLayoutTree}
              searchConfig={searchConfig}
              onChangeData={onChangeData}
              onCloseLeftDrawer={onCloseLeftDrawer}
              setSearchConfig={setSearchConfig}
              resultPanelDisplay={resultPanelDisplay}
              onResultVisibleChange={setShouldScaling}
            />
          </Tabs.TabPane>
        </Tabs>
      </div>
    </LeftDrawer>
  );
};

export default RetrievalAndVid;
