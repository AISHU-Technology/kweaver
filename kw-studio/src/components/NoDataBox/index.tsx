import React from 'react';
import NoData, { NoDataProps } from './NoData';
import NoResult from './NoResult';
import NoContent from './NoContent';

interface ExtendedNoDataProps extends Partial<NoDataProps> {
  type?: 'NO_RESULT' | 'NO_CONTENT' | 'DEFAULT';
}

const NoDataBox: React.FC<ExtendedNoDataProps> = ({ type = 'DEFAULT', ...props }) => {
  const ComponentMap: { [key: string]: React.ComponentType<any> } = {
    NO_RESULT: NoResult,
    NO_CONTENT: NoContent,
    DEFAULT: NoData
  };

  const ComponentToRender = ComponentMap[type] || NoData;

  return <ComponentToRender {...props} />;
};

export default NoDataBox;
