import React, { useEffect, useMemo, useState } from 'react';
import { Tabs } from 'antd';
import Format from '@/components/Format';

import BasicInfo from './BasicInfo';
import Property from './Property';
import Relationships from './RelationShips';
import './style.less';
import { useGlossaryStore } from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';
import { getTermNameByLanguage } from '@/pages/KnowledgeNetwork/Glossary/assistant';
import intl from 'react-intl-universal';

const GlossaryInfoTabs = ({ refreshTerm, openCustomRelationModal, setSelectedNodeByTerm }: any) => {
  const {
    glossaryStore: { selectedTerm, selectedLanguage }
  } = useGlossaryStore();
  const [activeKey, setActiveKey] = useState<string>('1');

  useEffect(() => {
    setActiveKey('1');
  }, [selectedTerm]);

  const name = useMemo(() => {
    if (selectedTerm && selectedTerm.length > 0 && selectedTerm[0]) {
      const termData = selectedTerm[0];
      return getTermNameByLanguage(termData, selectedLanguage);
    }
    return '';
  }, [selectedTerm, selectedLanguage]);

  return (
    <div className="glossaryInforTabsRoot kw-flex-column">
      <div title={name} className="glossaryInforTabsRoot-title kw-mb-2 kw-ellipsis" style={{ maxWidth: 416 }}>
        {name}
      </div>
      <Tabs
        destroyInactiveTabPane
        size="small"
        className="kw-flex-item-full-height"
        activeKey={activeKey}
        onChange={e => setActiveKey(e)}
      >
        <Tabs.TabPane tab={intl.get('glossary.basicInfo')} key={'1'}>
          <BasicInfo refreshTerm={refreshTerm} />
        </Tabs.TabPane>
        <Tabs.TabPane tab={intl.get('glossary.attribute')} key={'2'}>
          <Property setSelectedNodeByTerm={setSelectedNodeByTerm} />
        </Tabs.TabPane>
        <Tabs.TabPane tab={intl.get('glossary.customRelation')} key={'3'}>
          <Relationships
            openCustomRelationModal={openCustomRelationModal}
            setSelectedNodeByTerm={setSelectedNodeByTerm}
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};
export default GlossaryInfoTabs;
