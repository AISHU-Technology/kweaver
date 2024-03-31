import React, { useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Tag } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';

import './index.less';

type UploadShowLineType = {
  value: { uid: string; name: string }[];
  onDeleteFile: (uid: string) => void;
};
const UploadShowLine = (props: UploadShowLineType) => {
  const { value = [], onDeleteFile } = props;

  const onClose = (e: any, uid: string) => {
    e.preventDefault();
    onDeleteFile(uid);
  };

  return (
    <div className="thesaurus-uploadShowLineRoot">
      <div className="prefix">
        <FolderOpenOutlined />
      </div>
      <div className="fileShowContainer">
        {_.isEmpty(value) ? (
          <span className="placeholder">{intl.get('knowledge.pleaseSelectFile')}</span>
        ) : (
          _.map(value, item => {
            const { uid, name } = item;
            return (
              <Tag
                key={uid}
                closable
                className="tag"
                closeIcon={<IconFont type="icon-shibai" style={{ fontSize: 12, paddingTop: 5 }} />}
                onClose={e => onClose(e, uid)}
              >
                <span className="tagText" title={name}>
                  {name}
                </span>
              </Tag>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UploadShowLine;
