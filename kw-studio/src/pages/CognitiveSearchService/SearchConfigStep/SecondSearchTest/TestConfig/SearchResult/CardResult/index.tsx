import React, { useMemo } from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import ScrollBar from '@/components/ScrollBar';
import useComponents from '@/components/KnowledgeCard/useComponents';
import './style.less';

export interface CardResultProps {
  className?: string;
  size?: 'default' | 'large'; // 只有卡片时, 拉宽组件
  data: any[];
  onLabelClick?: (node: any) => void;
}

const CardResult = (props: CardResultProps) => {
  const { className, size = 'default', data, onLabelClick } = props;
  const configs = useMemo(() => {
    return _.filter(data, d => d.nodes?.length);
  }, [data]);

  const toNextDetail = (node: any) => {
    onLabelClick?.(node);
  };

  const knowledgeCardComponent = useComponents({
    configs,
    toNextDetail,
    toAsPreview: toNextDetail
  });

  const prefix = 'kg-search-card-res';
  return (
    <div className={classNames(className, 'kg-search-card-res kw-h-100', { [`${prefix}-lg`]: size === 'large' })}>
      <ScrollBar isshowx="false">
        <div className="card-component-wrap">{_.map(knowledgeCardComponent.source, c => c.dom)}</div>
      </ScrollBar>
    </div>
  );
};

export default CardResult;
