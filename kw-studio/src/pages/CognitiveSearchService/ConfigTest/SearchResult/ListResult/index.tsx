import React, { memo } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import './style.less';

export interface ListResultProps {
  className?: string;
  resData: any[];
  onRowClick?: Function;
}

const ListResult: React.FC<ListResultProps> = props => {
  const { className = '', resData, onRowClick } = props;

  return (
    <div className={`${className} kg-search-list-res`}>
      {resData?.map((item: any) => {
        const { id, tags, color, score, properties, default_property, classfication, kg_name } = item;
        const title = default_property?.v || default_property?.value;
        return (
          <div className="res-item" key={id} onClick={() => onRowClick?.(item)}>
            <div className="info-box">
              <p className="file-name ellipsis-one" title={title}>
                {title}
              </p>

              <div className="pro-tags">
                {/* 命中的实体 */}
                <span className="pro-tag ellipsis-one" title={`class：${tags}`}>
                  class：
                  <span className="circle-span" style={{ backgroundColor: color || '#126ee3' }} />
                  {tags}
                </span>

                {_.map(properties, (pro, proIndex) => {
                  return _.map(pro.props, (n: any, i: any) => {
                    return (
                      <span
                        key={`${i}`}
                        className={`${
                          ['_ds_id_', '_timestamp_'].includes(n.alias || n.name)
                            ? 'tag-display'
                            : 'pro-tag ellipsis-one'
                        }`}
                        title={`${n.alias || n.name}：${n.value}`}
                        dangerouslySetInnerHTML={{ __html: `${n.alias || n.name}：${n.value}` }}
                      />
                    );
                  });
                })}
                <div className="operation-box kw-flex">
                  <span className="op-item kw-flex">
                    {intl.get('cognitiveSearch.categoryTwo')}：
                    <span
                      className="kw-ellipsis from"
                      title={
                        classfication === '全部资源' ? intl.get('cognitiveSearch.classify.allResource') : classfication
                      }
                    >
                      {classfication === '全部资源' ? intl.get('cognitiveSearch.classify.allResource') : classfication}
                    </span>
                  </span>
                  <span className="op-item">
                    {intl.get('cognitiveSearch.from')}：<span>{kg_name}</span>
                  </span>
                  <span className="op-item">
                    {intl.get('cognitiveSearch.score')}：
                    <span className="score-text">
                      {score}
                      {intl.get('cognitiveSearch.scoreTwo')}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default memo(ListResult);
