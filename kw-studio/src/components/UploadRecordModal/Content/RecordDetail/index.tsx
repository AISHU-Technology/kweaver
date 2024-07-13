import React, { useMemo } from 'react';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import { Steps, Spin } from 'antd';
import { CloseCircleOutlined, EllipsisOutlined, LoadingOutlined } from '@ant-design/icons';
import { UPLOAD_RECORD_STATUS } from '@/enums';
import { RecordItem } from '../types';
import './style.less';
import KwScrollBar from '@/components/KwScrollBar';

export interface RecordDetailProps {
  className?: string;
  loading: boolean;
  record: Partial<RecordItem>;
  onCancel: Function;
  onRefresh: Function;
}

const { COMPLETE, FAILED } = UPLOAD_RECORD_STATUS;
const { Step } = Steps;
const WaitIcon = () => <div className="step-wait-icon" />;

const STEPS = [
  { step: 0, title: intl.get('uploadService.startUpload') },
  { step: 1, title: intl.get('uploadService.localExport') },
  { step: 2, title: intl.get('uploadService.transferData') },
  { step: 3, title: intl.get('uploadService.finish') }
];

const decodeError = (cause?: string) => {
  try {
    return cause?.split('----+++++----');
  } catch (err) {
    return null;
  }
};
const ERRORSTEP: Record<any, any> = {
  1: intl.get('uploadService.exportFailed'),
  2: intl.get('uploadService.transFailed'),
  3: intl.get('uploadService.importFailed')
};

const RecordDetail = (props: RecordDetailProps) => {
  const { className, record, loading } = props;
  const curStep = useMemo(() => {
    if (record.transferState === '2' || record.transferState === '3') return 2;
    if (record.transferState === '4') return 4;
    return parseInt(record.transferState || '0');
  }, [record.transferState]);

  /**
   * 渲染步骤条图标
   */
  const renderIcon = (step: number) => {
    if (record.transferStatus === FAILED) {
      if (curStep === step) {
        return (
          <div>
            <CloseCircleOutlined className="kw-c-error" style={{ fontSize: 32 }} />
          </div>
        );
      }

      return curStep > step ? null : <WaitIcon />;
    }
    if (step === curStep) {
      return (
        <div className="ellipsis-wrap">
          <EllipsisOutlined className="ellipsis-icon" />
        </div>
      );
    }

    return curStep > step ? null : <WaitIcon />;
  };

  /**
   * 转化百分比
   */
  const formatPercent = (step: number) => {
    if (step !== curStep || record.transferStatus === COMPLETE) return;
    const { transferProgress = 0 } = record;
    return `${Math.floor(transferProgress * 100) || 0}%`;
  };

  return (
    <div className={classNames('upload-record-detail', className)}>
      <div className="info-box">
        <div className="row">
          <span className="name-label">{intl.get('uploadService.graphName1')}</span>
          <span className="info-text ellipsis-one" title={record.graphName}>
            {record.graphName}
          </span>
        </div>
        <div className="row">
          <span className="name-label">
            {([FAILED, COMPLETE] as any[]).includes(record.transferStatus)
              ? intl.get('uploadService.recordTime')
              : intl.get('uploadService.uploadTime')}
          </span>
          <span className="info-text">
            {record.created}
            {record.transferStatus === FAILED ? (
              <>&nbsp;-&nbsp;{record.updated}</>
            ) : record.finished ? (
              <>&nbsp;-&nbsp;{record.finished}</>
            ) : null}
          </span>
        </div>
      </div>

      {!loading ? (
        <div className="steps-box kw-border kw-h-100">
          <Steps current={curStep} className="progress-steps" labelPlacement="vertical">
            {STEPS.map(({ step, title }) => {
              return (
                <Step
                  key={step}
                  className={classNames({
                    'dashed-step': !_.includes(['3', '2'], record.transferStatus) && step < 3 && curStep - 1 === step,
                    'error-step': record.transferStatus === FAILED && curStep - 1 === step
                  })}
                  title={title}
                  icon={renderIcon(step)}
                  description={record.transferStatus !== FAILED && formatPercent(step)}
                />
              );
            })}
          </Steps>

          {decodeError(record.cause) && (
            <KwScrollBar
              autoHeight
              autoHeightMax={260}
              isShowX={false}
              color="rgb(184,184,184)"
              className="scrollWrapper kw-mt-9"
            >
              <div className="kw-border-t kw-pl-5 kw-pr-5 kw-pt-2 kw-h-100">
                {record.transferState && ERRORSTEP?.[record.transferState]}
                {': '}
                {decodeError(record.cause)?.[1] || record.cause || '- -'}
              </div>
            </KwScrollBar>
          )}
        </div>
      ) : (
        <div className="kw-center" style={{ height: 200 }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </div>
      )}
    </div>
  );
};

export default RecordDetail;
