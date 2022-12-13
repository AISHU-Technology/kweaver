/**
 * 无内容提示
 */
import React from 'react';
import NoData, { NoDataProps } from './NoData';
import NoResult from './NoResult';
import NoContent from './NoContent';

type NoDataInterface = React.MemoExoticComponent<React.FC<NoDataProps>> & {
  NO_RESULT: Function;
  NO_CONTENT: Function;
};

const NoDataBox = NoData as NoDataInterface;
NoDataBox.NO_RESULT = NoResult;
NoDataBox.NO_CONTENT = NoContent;

export default NoDataBox;
