/**
 * 语义搜索初始化空界面
 */

import React from 'react';
import { useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import AdSpin from '@/components/AdSpin';
import knowledgeEmpty from '@/assets/images/kgEmpty.svg';

export interface MountEmptyProps {
  initLoading: boolean;
  isNotGraph: boolean;
  isNotConfig: boolean;
}
const MountEmpty: React.FC<MountEmptyProps> = ({ initLoading, isNotGraph, isNotConfig }) => {
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
      <div className="empty-content">
        <img src={knowledgeEmpty} alt="empty" />
        <p className="tip">
          {intl.get('searchConfig.noGraphTip').split('|')[0]}
          <span className="create-span" onClick={() => history.push('/home/workflow/create')}>
            {intl.get('searchConfig.noGraphTip').split('|')[1]}
          </span>
          {intl.get('searchConfig.noGraphTip').split('|')[2]}
        </p>
      </div>
    );
  }

  return null;
};

export default MountEmpty;
