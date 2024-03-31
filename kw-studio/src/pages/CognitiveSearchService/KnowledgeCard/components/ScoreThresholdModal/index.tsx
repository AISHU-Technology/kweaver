import React from 'react';
import { Form, InputNumber } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import TemplateModal from '@/components/TemplateModal';
import UniversalModal from '@/components/UniversalModal';
import ExplainTip from '@/components/ExplainTip';
import './style.less';

export interface ScoreThresholdModalProps {
  className?: string;
  visible?: boolean;
  score?: number;
  onCancel?: () => void;
  onOk?: (score: number) => void;
}

/** 实体分数阈值配置弹窗 */
const ScoreThresholdModal = (props: ScoreThresholdModalProps) => {
  const { className, visible, score = 0.8, onCancel, onOk } = props;
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then(values => {
      onOk?.(values.score);
    });
  };

  return (
    <UniversalModal
      className={classNames(className, 'knw-card-weight-sorting')}
      title={intl.get('cognitiveSearch.configuration')}
      okText={intl.get('global.save')}
      width={480}
      visible={visible}
      onCancel={onCancel}
      onOk={handleOk}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.save'), type: 'primary', onHandle: handleOk }
      ]}
    >
      <div style={{ transform: 'translateY(50%)' }}>
        <Form form={form} colon={false} initialValues={{ score }}>
          <Form.Item label={<span>{intl.get('cognitiveSearch.entityLow')}</span>} name="score">
            <InputNumber className="kw-w-100" min={0} max={1} step={0.1} precision={2} />
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};

export default (props: ScoreThresholdModalProps) => (props.visible ? <ScoreThresholdModal {...props} /> : null);
