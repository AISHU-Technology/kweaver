import React, { useMemo } from 'react';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import classNames from 'classnames';
import HOOKS from '@/hooks';
import './style.less';

import { useKnowledgeMapContext } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';

const OperationTooltip: React.FC = () => {
  const language = HOOKS.useLanguage();
  const prefixCls = 'km-tooltip-box';
  const {
    knowledgeMapStore: { ontologyDisplayType, viewMode }
  } = useKnowledgeMapContext();

  const operationTips = useMemo(() => {
    return (intl.get(`workflow.knowledgeMap.${viewMode ? 'operationTooltipViewMode' : 'operationTooltip'}`) as any).map(
      (tip: { operation: string; details: string }) => {
        const str = tip.details.replace(
          '{box}',
          intl.get(`workflow.knowledgeMap.${ontologyDisplayType === 'list' ? 'list' : 'canvas'}`)
        );
        const newStr = str.split('$').map((item, index) => {
          if (item.startsWith('icon-')) {
            return <IconFont key={index} type={item} style={{ fontSize: 16, margin: '0 6px' }} />;
          }
          return item;
        });
        return {
          operation: tip.operation,
          details: newStr
        };
      }
    );
  }, [ontologyDisplayType, viewMode]);

  return (
    <div className={classNames(`${prefixCls} kw-w-100 kw-h-100 kw-column-center`, { EN: language === 'en-US' })}>
      <img src={require('@/assets/images/dictionary.svg').default} alt="" className="kw-tip-img" />

      <div>
        {operationTips.map(({ operation, details }: any) => (
          <div key={operation} className={classNames(`${prefixCls}-row kw-flex kw-mb-4 kw-c-text`)}>
            <div className={classNames(`${prefixCls}-col-left kw-mr-5`)}>{operation}</div>
            <div className={classNames(`${prefixCls}-col-right`)}>{details}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperationTooltip;
