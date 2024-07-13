import React from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import TemplateModal from '@/components/TemplateModal';
import KwScrollBar from '@/components/KwScrollBar';
import IconFont from '@/components/IconFont';

import './style.less';
const ErrorModel = (props: any) => {
  const { visible, successLength, errorData, onCancel } = props;

  return (
    <TemplateModal
      open={visible}
      className="uploadSettingErrorModal"
      title={intl.get('uploadService.tip')}
      width={800}
      footer={null}
      onCancel={onCancel}
    >
      <div className="kw-pl-6 kw-pr-8">
        <div className="errorDes kw-align-center">
          {errorData?.type === 1
            ? intl.get('uploadService.openErrorDes').split('|')[0]
            : intl.get('uploadService.closeErrorDes').split('|')[0]}
          <span className="kw-c-primary kw-pl-1 kw-pr-1">{successLength || 0}</span>
          {intl.get('uploadService.openErrorDes').split('|')[1]}
          <span className="kw-c-error kw-pl-1 kw-pr-1">{errorData?.errors?.length}</span>
          {errorData?.type === 1
            ? intl.get('uploadService.openErrorDes').split('|')[2]
            : intl.get('uploadService.closeErrorDes').split('|')[2]}
        </div>
        <KwScrollBar autoHeight autoHeightMax={484} color="rgb(184,184,184)">
          <div className="kw-pb-5">
            <div className="graphName kw-align-center kw-pl-6">{intl.get('uploadService.graphName')}</div>
            {_.map(errorData?.errors, item => {
              const { name, kgDesc } = item;
              return (
                <div className="kw-align-center kw-border-b kw-pl-6 dataItem">
                  <div className="kw-center kw-border graphImg">
                    <IconFont type="icon-zhishiwangluo" className="icon" />
                  </div>
                  <div className="kw-ml-3">
                    <div className="kw-ellipsis kw-c-text" style={{ width: 620 }} title={name}>
                      {name}
                    </div>
                    <div className="kw-ellipsis kw-c-subtext" style={{ width: 600 }} title={kgDesc}>
                      {kgDesc || '- -'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </KwScrollBar>
      </div>
    </TemplateModal>
  );
};
export default ErrorModel;
