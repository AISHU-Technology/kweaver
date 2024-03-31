import React, { memo, useMemo } from 'react';
import JsonView from '@/components/JsonView';
import './style.less';

export interface JsonResultProps {
  className?: string;
  resData: Record<string, any>;
}

const JsonResult: React.FC<JsonResultProps> = props => {
  const { className = '', resData } = props;
  // 调整key顺序
  const resetData = useMemo(() => {
    const { time, number, res } = resData;

    return { time, number, res };
  }, [resData]);

  return (
    <div className={`${className} kg-search-json-res`}>
      <div className="border-wrap">
        <JsonView data={resetData} />
      </div>
    </div>
  );
};

export default memo(JsonResult);
