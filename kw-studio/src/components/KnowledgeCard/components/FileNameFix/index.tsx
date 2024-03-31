import React, { useMemo } from 'react';
import _ from 'lodash';
import { switchIcon } from '@/utils/handleFunction';

export interface FileNameFixProps {
  name?: string;
}

const FileNameFix = (props: any) => {
  const { name } = props;
  const { prefix, suffix } = useMemo(() => {
    const splitList = _.split(name, '.');
    let prefix = '';
    let suffix = '';
    if (splitList.length > 1) {
      if (switchIcon('file', name)?.type?.displayName === 'UnknownIcon') {
        return { prefix: name, suffix };
      }
      suffix = '.' + splitList.pop()!;
      prefix = splitList.join('');
    } else {
      prefix = name;
    }
    return { prefix, suffix };
  }, [name]);

  return (
    <>
      <div className="kw-flex-item-full-width kw-ellipsis" title={name}>
        {prefix}
      </div>
      <div style={{ flexShrink: 0 }}>{suffix}</div>
    </>
  );
};

export default FileNameFix;
