import React, { useState } from 'react';
import { Alert, Button, message } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';
import Format from '@/components/Format';
import RequireLabel from '../components/RequireLabel';
import NeighborConfig from '../components/NeighborConfig';
import TitleInput from '../components/TitleInput';
import Header from '../components/Header';
import TestPanel from '../components/TestPanel';
import './style.less';

import { RelatedLabelType, TitleObj } from '../../types';
import { validator, verifyTitle, triggerVerify } from '../../validator';
import { buildConfig } from '../components/TestPanel/utils';

export interface RelatedLabelProps {
  className?: string;
  knwId: number;
  type: string;
  node: Record<string, any>;
  ontoData?: Record<string, any>;
  data: RelatedLabelType;
  testOptions?: any;
  externalModel?: any[]; // 外接模型
  onChange: (newData: Partial<RelatedLabelType>) => void;
  onViewOntology?: () => void;
}

const RelatedLabel = (props: RelatedLabelProps) => {
  const { className, knwId, type, node, ontoData, data, testOptions, externalModel, onChange, onViewOntology } = props;
  const [testPanel, setTestPanel] = useState({ visible: false, id: '' });
  const [loading, setLoading] = useState(false);

  /**
   * 标题修改, 实时校验
   * @param title
   */
  const onTitleChange = (title: TitleObj) => {
    const errMsg = validator.verify(title, { rules: [{ validator: verifyTitle }] });
    const error = _.startsWith(errMsg, '{"json":') ? JSON.parse(errMsg).json : errMsg;
    onChange({ title, error: { ...(data.error || {}), title: error } });
  };

  /**
   * 点击组件测试
   */
  const onTest = async () => {
    const error = triggerVerify(data);
    if (!_.isEmpty(error)) {
      onChange({ error });
      return;
    }

    if (loading) return;
    setLoading(true);
    const response = await buildConfig(
      type,
      { ...ontoData, knw_id: knwId },
      { node, components: [data] },
      externalModel
    );

    if (response?.res) {
      setLoading(false);
      setTestPanel({ visible: true, id: response?.res });
    }
    const err = response?.ErrorDetails?.[0]?.detail;
    if (err) {
      setLoading(false);
      message.error(err);
    }
  };

  return (
    <div className={classNames(className, 'knw-card-related-label kw-flex-column kw-h-100')}>
      <Header title={intl.get('knowledgeCard.componentConfig')} />
      <div className="kw-flex-item-full-height kw-pl-6 kw-pr-6" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
        <div className="warning-tip kw-pt-3 kw-pb-3">
          <Alert
            message={intl.get('knowledgeCard.configTip')}
            type="info"
            showIcon
            style={{ backgroundColor: '#e6f4ff', borderColor: '#bae0ff' }}
          />
        </div>
        <RequireLabel label={intl.get('knowledgeCard.title')} />
        <div className="kw-mb-2 kw-c-subtext" style={{ fontSize: 12, lineHeight: '17px' }}>
          {intl.get('knowledgeCard.languageTip')}
        </div>
        <TitleInput
          className={classNames({ 'error-input': !!data.error?.title?.['zh-CN'] })}
          label={'中文 (简体)'}
          placeholder={intl.get('global.pleaseEnter')}
          value={data.title['zh-CN']}
          onChange={value => onTitleChange({ ...data.title, 'zh-CN': value })}
        />
        <div className="kw-c-error" style={{ minHeight: 12, lineHeight: '20px' }}>
          {data.error?.title?.['zh-CN']}
        </div>
        <TitleInput
          className={classNames({ 'error-input': !!data.error?.title?.['zh-TW'] })}
          label={'中文 (繁體)'}
          placeholder={intl.get('global.pleaseEnter')}
          value={data.title['zh-TW']}
          onChange={value => onTitleChange({ ...data.title, 'zh-TW': value })}
        />
        <div className="kw-c-error" style={{ minHeight: 12, lineHeight: '20px' }}>
          {data.error?.title?.['zh-TW']}
        </div>
        <TitleInput
          className={classNames({ 'error-input': !!data.error?.title?.['en-US'] })}
          label={'English'}
          placeholder={intl.get('global.pleaseEnter')}
          value={data.title['en-US']}
          onChange={value => onTitleChange({ ...data.title, 'en-US': value })}
        />
        <div className="kw-c-error" style={{ minHeight: 32, lineHeight: '20px' }}>
          {data.error?.title?.['en-US'] || data.error?.title?.error}
        </div>
        <div className="kw-space-between kw-mb-4">
          <Format.Title>{intl.get('knowledgeCard.relateEntityConfig')}</Format.Title>
          <span className="kw-c-primary kw-pointer" onClick={onViewOntology}>
            {intl.get('datamanagement.vo')}
          </span>
        </div>
        <NeighborConfig type={data.type!} node={node} ontoData={ontoData} data={data as any} onChange={onChange} />
      </div>
      <div className="test-btn kw-p-6 kw-pt-3">
        <Button type="default" block onClick={onTest}>
          {intl.get('knowledgeCard.componentTest')}
          <RightOutlined className="kw-ml-2" />
        </Button>
      </div>

      <TestPanel
        {...testPanel}
        type={type}
        graphId={ontoData?.kg_id}
        startNode={node}
        configData={data as any}
        onClose={() => setTestPanel({ visible: false, id: '' })}
      />
    </div>
  );
};

export default RelatedLabel;
