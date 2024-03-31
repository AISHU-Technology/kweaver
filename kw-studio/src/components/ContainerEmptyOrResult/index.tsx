import React, { ReactElement } from 'react';
import classnames from 'classnames';
import intl from 'react-intl-universal';

import empty from '@/assets/images/kong.svg';
import noResult from '@/assets/images/noResult.svg';
import './style.less';

const EMPTY_TEXT = intl.get('global.noContent');
const EMPTY_IMAGE = empty;

const NO_SEARCH_TEXT = intl.get('global.noResult');
const NO_SEARCH_IMAGE = noResult;

export type ContainerEmptyOrResultType = {
  hasResult: boolean;
  hasSearch: boolean;
  children?: any;
  noSearchImage?: any;
  noSearchText?: string | ReactElement;
  emptyImage?: any;
  emptyText?: string | ReactElement;

  style?: any;
  className?: string;
};
const ContainerEmptyOrResult = (props: ContainerEmptyOrResultType) => {
  const { style, className } = props;
  const { hasResult, hasSearch, noSearchImage, noSearchText, emptyImage, emptyText } = props;

  return (
    <div className={classnames(className, 'containerEmptyOrResultRoot')} style={style}>
      {hasResult ? (
        props.children || null
      ) : hasSearch ? (
        <div className="emptyBox">
          <img src={noSearchImage || NO_SEARCH_IMAGE} />
          <div className="kw-c-text">{noSearchText || NO_SEARCH_TEXT}</div>
        </div>
      ) : (
        <div className="emptyBox">
          <img src={emptyImage || EMPTY_IMAGE} />
          <div className="kw-c-text">{emptyText || EMPTY_TEXT}</div>
        </div>
      )}
    </div>
  );
};

export default ContainerEmptyOrResult;
