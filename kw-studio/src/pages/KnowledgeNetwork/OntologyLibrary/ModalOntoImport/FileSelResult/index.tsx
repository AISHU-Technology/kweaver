import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';

import { FolderOpenOutlined } from '@ant-design/icons';
import './index.less';

type FileSelResultType = {
  value: { uid: string; name: string }[];
  onDeleteFile: (uid: string) => void;
};

const FileSelResult = (props: FileSelResultType) => {
  const { value = [] } = props;

  return (
    <div className="FileSelResultRoot">
      <div className="prefix">
        <FolderOpenOutlined />
      </div>
      <div className="fileShowContainer">
        {_.isEmpty(value) ? (
          <span className="placeholder">{intl.get('ontoLib.importPlaceHold')}</span>
        ) : (
          _.map(value, item => {
            const { uid, name } = item;
            return (
              <span className="tagText" title={name}>
                {name}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FileSelResult;
