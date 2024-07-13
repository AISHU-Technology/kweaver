import IconFont from '@/components/IconFont';
import React, { useState } from 'react';
import { Divider, Button, Tooltip } from 'antd';
import Format from '@/components/Format';
import intl from 'react-intl-universal';
import { useGlossaryStore } from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';
import { SwapOutlined } from '@ant-design/icons';
import AdExitBar from '@/components/KwExitBar';

const TopBar = (props: any) => {
  const { glossaryStore } = useGlossaryStore();
  const { openCustomRelationModal, goBack, openCreateModal } = props;

  const { glossaryData, mode } = glossaryStore;

  return (
    <AdExitBar
      onExit={goBack}
      extraContent={
        <div className="kw-space-between">
          <div className="kw-align-center">
            <span title={glossaryData?.name} className="kw-ellipsis" style={{ display: 'inline-block', maxWidth: 300 }}>
              {glossaryData?.name}
            </span>
            {mode === 'edit' && (
              <Tooltip title={intl.get('global.edit')}>
                <span className="kw-ml-2 kw-pointer" onClick={() => openCreateModal(glossaryData)}>
                  <IconFont type="icon-edit" />
                </span>
              </Tooltip>
            )}
          </div>
          <Format.Button type="text" onClick={openCustomRelationModal}>
            <span className="kw-align-center">
              {intl.get('glossary.customRelationManageBtn')}
              <IconFont type="icon-setting" className="kw-ml-2" />
            </span>
          </Format.Button>
        </div>
      }
    />
  );
};

export default TopBar;
