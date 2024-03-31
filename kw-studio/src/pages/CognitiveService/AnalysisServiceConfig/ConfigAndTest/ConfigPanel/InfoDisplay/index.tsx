/**
 * 显示基本信息
 */
import React from 'react';
import { Select } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import { ANALYSIS_SERVICES } from '@/enums';
import { BasicData } from '../../../types';
import './style.less';

export interface InfoDisplayProps {
  data: BasicData;
  className?: string;
  isHorizontal?: boolean; // 是否水平布局
}

const InfoDisplay = (props: InfoDisplayProps) => {
  const { data, className, isHorizontal } = props;
  return (
    <div className={classNames('basic-info-display-root', className, { 'horizontal-layout': isHorizontal })}>
      <div className="field-item">
        <div className="item-label kw-mb-2">{intl.get('global.kgNet')}</div>
        <Select className="kw-w-100" disabled value={data.knw_name} />
      </div>

      <div className="field-item">
        <div className="item-label kw-mb-2">{intl.get('global.graph')}</div>
        <Select className="kw-w-100" disabled value={data.kg_name} />
      </div>

      <div className="field-item">
        <div className="item-label kw-mb-2">{intl.get('analysisService.queryType')}</div>
        <Select className="kw-w-100" disabled value={ANALYSIS_SERVICES.text(data.operation_type)} />
      </div>
    </div>
  );
};

export default InfoDisplay;
