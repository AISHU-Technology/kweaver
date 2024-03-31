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

    // 只显示query理解 其余都为空
    if (
      (resData?.full_text === null || !resData?.full_text?.count) &&
      query_understand !== null &&
      (!kgqa?.count || _.isEmpty(kgqa)) &&
      _.isEmpty(knowledge_card) &&
      _.isEmpty(related_knowledge)
    ) {
      return {
        query_understand
      };
    }
    // TODO 只有qa 其余都为空

    // 都有
    return {
      query_understand,
      full_text: { time: full_text?.execute_time, number: full_text?.count, res: full_text?.vertexs },
      kgqa,
      knowledge_card,
      related_knowledge
    };
  }, [resData]);

  return (
    <>
      <div className={`${className} kg-search-json-res`}>
        <div className="border-wrap">
          <JsonView data={resetData} />
        </div>
      </div>
      {/* <div style={{ height: '80px' }}></div> */}
    </>
  );
};

export default memo(JsonResult);
