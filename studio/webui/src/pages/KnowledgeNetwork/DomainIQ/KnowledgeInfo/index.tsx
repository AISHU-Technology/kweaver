import React, { useState } from 'react';
import intl from 'react-intl-universal';
import AvatarName from '@/components/Avatar';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import KnowledgeModal from '@/components/KnowledgeModal';
import ScorePanel from './ScorePanel';
import { formatID } from '@/utils/handleFunction';
import { KgInfo } from '../types';
import './style.less';

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
    <div className="kg-iq-info ad-p-5">
      <div className="ad-space-between">
        <AvatarName str={knw_name} color={color} size={24} style={{ fontSize: 16, fontWeight: 400 }} />
        <Format.Title ellipsis className="name-title" title={knw_name}>
          {knw_name || '--'}
        </Format.Title>
        <div className="icon-click-mask" onClick={onEdit}>
          <IconFont type="icon-edit" />
        </div>
      </div>
      <div className="score-icon">
        <ScorePanel score={intelligence_score} />
      </div>

      <div className="ad-pt-4 ad-pb-6 info-box">
        <p className="ad-c-subtext">ID</p>
        <Format.Title className="one-text" strong={4}>
          {formatID(id) || '--'}
        </Format.Title>
        <div className="ad-space-between ad-mt-2 ad-mb-3 ad-c-subtext">
          <span>{intl.get('global.desc')}</span>
          <div className="icon-click-mask" onClick={onEdit}>
            <IconFont type="icon-edit" />
          </div>
        </div>
        <Format.Title className="desc-text" strong={4}>
          {knw_description || '--'}
        </Format.Title>
      </div>

      <div className="ad-pt-4 ad-pb-4 info-box">
        <p className="ad-c-subtext">{intl.get('global.creationTime')}</p>
        <Format.Title className="one-text" strong={4}>
          {creation_time || '--'}
        </Format.Title>
        <p className="ad-mt-2 ad-c-subtext">{intl.get('global.finalOperatorTime')}</p>
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
