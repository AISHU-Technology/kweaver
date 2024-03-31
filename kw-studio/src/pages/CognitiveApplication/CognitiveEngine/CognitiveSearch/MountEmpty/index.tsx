import React from 'react';
import { useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';

import HELPER from '@/utils/helper';
import { PERMISSION_KEYS, PERMISSION_CODES } from '@/enums';

import AdSpin from '@/components/AdSpin';
import ContainerIsVisible from '@/components/ContainerIsVisible';

import knowledgeEmpty from '@/assets/images/kgEmpty.svg';

export interface MountEmptyProps {
  kgData: any;
  initLoading: boolean;
  isNotGraph: boolean;
  isNotConfig: boolean;
}

const MountEmpty: React.FC<MountEmptyProps> = ({ kgData, initLoading, isNotGraph, isNotConfig }) => {
  const history = useHistory(); // 路由

  // 初始loading
  if (initLoading) {
    return (
      <div className="loading-mask spinning">
        <AdSpin />
      </div>
    );
  }

  // 管理员, 但无图谱
  if (isNotGraph && isNotConfig) {
    return (
      <div className="empty-content kw-c-text">
        <img src={knowledgeEmpty} alt="empty" />
        <ContainerIsVisible
          placeholder={intl.get('knowledge.noKnowledgeGraphs')}
          isVisible={HELPER.getAuthorByUserInfo({
            roleType: PERMISSION_CODES.ADF_KN_KG_CREATE,
            userType: PERMISSION_KEYS.KN_ADD_KG,
            userTypeDepend: kgData?.__codes
          })}
        >
          <p className="empty-tip">
            {intl.get('searchConfig.noGraphTip').split('|')[0]}
            <span className="create-span" onClick={() => history.push(`/knowledge/workflow/create?knId=${kgData?.id}`)}>
              {intl.get('searchConfig.noGraphTip').split('|')[1]}
            </span>
            {intl.get('searchConfig.noGraphTip').split('|')[2]}
          </p>
        </ContainerIsVisible>
      </div>
    );
  }

  return null;
};

export default MountEmpty;
