import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { Radio } from 'antd';
import classNames from 'classnames';

import UniversalModal from '@/components/UniversalModal';
import IconFont from '@/components/IconFont';

import './style.less';
type BuildGraphModelType = {
  visible: boolean;
  firstBuild: boolean; // Controlling incremental updates
  onCancel: () => void;
  onOk: (type: string) => void;
};
const BuildGraphModel = (props: BuildGraphModelType) => {
  const { visible, firstBuild, onCancel, onOk } = props;
  const [type, setType] = useState<string>('increment');

  useEffect(() => {
    // For the first build, only the full amount can be selected
    if (firstBuild) setType('full');
  }, [firstBuild]);

  return (
    <UniversalModal
      className="buildGraphModelRoot"
      title={intl.get('task.selectType')}
      width={480}
      footer={null}
      maskClosable={false}
      keyboard={false}
      destroyOnClose={true}
      visible={visible}
      onCancel={onCancel}
      footerData={[
        {
          label: intl.get('createEntity.back'),
          onHandle: () => onCancel()
        },
        {
          label: intl.get('createEntity.ok'),
          type: 'primary',
          onHandle: () => onOk(type)
        }
      ]}
    >
      <div className="mixModelContent">
        <div
          className={classNames(
            'update-type',
            { 'update-type-selected': type === 'increment' },
            { disabledBox: firstBuild }
          )}
          onClick={() => {
            if (firstBuild) return;
            setType('increment');
          }}
        >
          <div
            className="kw-center"
            style={{ width: 32, height: 32, borderRadius: 2, background: 'rgba(108, 57, 200, 0.06)' }}
          >
            <IconFont type="icon-zenglianggengxin" className="iconColor" style={{ color: '#6C39C8' }} />
          </div>
          <div className="kw-flex-item-full-width kw-pl-3 kw-mr-2">
            <div className="title">{intl.get('task.iu')}</div>
            <div className="des">{intl.get('task.amTwo')}</div>
          </div>
          <div className="radio-select">
            <Radio checked={type === 'increment'} disabled={firstBuild}></Radio>
          </div>
        </div>

        <div
          className={classNames('kw-mt-3 update-type', { 'update-type-selected': type === 'full' })}
          onClick={() => {
            setType('full');
          }}
        >
          <div
            className="kw-center"
            style={{ width: 32, height: 32, borderRadius: 2, background: 'rgba(34,97,228,0.06)' }}
          >
            <IconFont type="icon-quanlianggoujian" style={{ color: '#2261E4' }} />
          </div>
          <div className="kw-flex-item-full-width kw-pl-3 kw-mr-2">
            <div className="title">{intl.get('task.fu')}</div>
            <div className="des">{intl.get('task.fmTwo')}</div>
          </div>
          <div className="radio-select">
            <Radio checked={type === 'full'}></Radio>
          </div>
        </div>
      </div>
    </UniversalModal>
  );
};
export default (props: BuildGraphModelType) => (props?.visible ? <BuildGraphModel {...props} /> : null);
