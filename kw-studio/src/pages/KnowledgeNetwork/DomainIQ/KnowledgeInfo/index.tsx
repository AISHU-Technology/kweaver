import React, { useState } from 'react';
import intl from 'react-intl-universal';
import AvatarName from '@/components/Avatar';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import KnowledgeModal from '@/components/KnowledgeModal';
import ScorePanel from './ScorePanel';
import { formatID, sessionStore } from '@/utils/handleFunction';
import { KgInfo } from '../types';
import './style.less';
import AdKnowledgeNetIcon from '@/components/AdKnowledgeNetIcon/AdKnowledgeNetIcon';

interface KnowledgeInfoProps {
  kgInfo: KgInfo;
  onEditSuccess: () => void;
}

const KnowledgeInfo: React.FC<KnowledgeInfoProps> = ({ kgInfo, onEditSuccess }) => {
  const { id, knw_name, knw_description, color, intelligence_score, creation_time, update_time } = kgInfo;
  const [editVisible, setEditVisible] = useState(false); // 编辑知识图谱弹窗

  const onEdit = () => {
    if (!id) return;
    setEditVisible(true);
  };

  return (
    <div className="kg-iq-info kw-p-5">
      <ScorePanel score={intelligence_score} />

      <div className="kw-pt-4 kw-pb-6 info-box kw-border-t">
        <div className="kw-c-subtext">{intl.get('graphList.knoNetworkname')}</div>
        <div className="kw-space-between" style={{ height: 40 }}>
          <span className="kw-flex-item-full-width kw-align-center">
            <AdKnowledgeNetIcon type={color} />
            <span className="kw-ml-3 kw-ellipsis kw-flex-item-full-width" title={knw_name}>
              {knw_name || '--'}
            </span>
          </span>
          <Format.Button tip={intl.get('global.edit')} type="icon" onClick={onEdit}>
            <IconFont type="icon-edit" />
          </Format.Button>
        </div>
        <div className="kw-c-subtext kw-mt-2">ID</div>
        <span className="kw-align-center" style={{ height: 40 }}>
          {formatID(id) || '--'}
        </span>
        <div className="hover-bg">
          <div className="kw-space-between kw-mt-2 kw-mb-3 kw-c-subtext">
            <span>{intl.get('global.desc')}</span>
            {/* <div className="icon-click-mask" onClick={onEdit}>*/}
            {/*  <IconFont type="icon-edit" />*/}
            {/* </div>*/}
          </div>
          <Format.Title className="desc-text" strong={4}>
            {knw_description || '--'}
          </Format.Title>
        </div>
      </div>

      <div className="kw-pt-4 kw-pb-4 info-box">
        <div className="kw-c-subtext">{intl.get('global.creationTime')}</div>
        <Format.Title className="one-text" strong={4}>
          {creation_time || '--'}
        </Format.Title>
        <div className="kw-mt-2 kw-c-subtext">{intl.get('global.finalOperatorTime')}</div>
        <Format.Title className="one-text" strong={4}>
          {update_time || '--'}
        </Format.Title>
      </div>

      <KnowledgeModal
        visible={editVisible}
        source={{ type: 'edit', data: kgInfo }}
        onSuccess={onEditSuccess}
        onCancel={() => setEditVisible(false)}
      />
    </div>
  );
};

export default KnowledgeInfo;
