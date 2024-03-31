import React, { memo, useMemo } from 'react';
import JsonView from '@/components/JsonView';
import './style.less';
import _ from 'lodash';

export interface JsonResultProps {
  className?: string;
  resData: Record<string, any>;
}

const JsonResult: React.FC<JsonResultProps> = props => {
  const { className = '', resData } = props;
  // 调整key顺序
  const resetData = useMemo(() => {
    const { query_understand, full_text, kgqa, knowledge_card, related_knowledge } = resData;
    if (resData.full_text === null || !resData.full_text?.count) {
      return {
        query_understand,
        kgqa,
        knowledge_card,
        related_knowledge
      };
    }
    const { count, vertexs } = full_text;
    return {
      query_understand,
      full_text: { time: full_text.execute_time, number: count, res: vertexs },
      kgqa,
      knowledge_card,
      related_knowledge
    };
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
