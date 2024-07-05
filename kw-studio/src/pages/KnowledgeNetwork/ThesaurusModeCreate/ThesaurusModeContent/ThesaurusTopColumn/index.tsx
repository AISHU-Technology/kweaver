import React, { useState } from 'react';

import classNames from 'classnames';
import intl from 'react-intl-universal';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import ThesaurusModeModal from '@/components/ThesaurusModeModal';
import THESAURUS_TEXT from '@/enums/thesaurus_mode';
import AdExitBar from '@/components/KwExitBar';
import './style.less';

const ThesaurusTopColumn = (props: any) => {
  const {
    onExit,
    editRecord,
    setEditRecord,
    mode,
    setIsChange,
    isChange,
    tableData,
    thesaurusTableData,
    onGetInfoById
  } = props;
  const [editVisible, setEditVisible] = useState(false); // 编辑弹窗

  /**
   * 编辑
   */
  const onEdit = () => {
    setEditVisible(true);
  };

  /**
   * 取消
   */
  const onHandleCancel = () => {
    setEditVisible(false);
  };

  /**
   * 确定
   */
  const onHandleOk = (data: any) => {
    onGetInfoById();
    setIsChange(true);
    setEditRecord({ ...editRecord, name: data?.name, description: data?.description });
  };

  return (
    <div
      className={classNames(
        'thesaurus-mode-create-edit-operate-root kw-flex kw-c-header',
        mode === 'custom' ? 'kw-mb-3' : 'kw-mb-7'
      )}
    >
      <AdExitBar
        onExit={onExit}
        title={
          <span className="kw-align-center">
            <div className="kw-mr-1 kw-flex">
              <div className="kw-ellipsis thesaurus-name" title={editRecord?.name}>
                {editRecord?.name}
              </div>
              <div>：{THESAURUS_TEXT.THESAURUS_MODE_ZH_CN[editRecord?.mode]}</div>
            </div>
            <Format.Button className="kw-ml-2" onClick={onEdit} tip={intl.get('global.edit')} type="text">
              <IconFont type="icon-edit" />
            </Format.Button>
          </span>
        }
      />

      <ThesaurusModeModal
        visible={editVisible}
        onHandleOk={onHandleOk}
        onHandleCancel={onHandleCancel}
        editRecord={editRecord}
        thesaurusTableData={thesaurusTableData}
        tableData={tableData}
        isChange={isChange}
      />
    </div>
  );
};

export default ThesaurusTopColumn;
