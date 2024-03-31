import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import useComponents from '@/components/KnowledgeCard/useComponents';
import DragContainer from '../components/DragContainer';

import './style.less';
import { useCard } from '../useCard';
import KNOWLEDGE_CARD from '../enums';

const BlockPreview = () => {
  const { state, dispatch } = useCard();
  const { node, sort = [], activeID = '', components = [] } = state?.configs || {};

  /** 下一条 */
  const toNextDetail = (id: string) => {};

  /** 打开文档 */
  const toAsPreview = (data: any) => {};

  /** 排序 */
  const onChangeSort = (items: any) => {
    const sort = _.map(items, item => item.id);
    dispatch({ key: 'configs', data: { sort } });
  };

  /** 选中面板 */
  const onChangeActive = (id: string) => dispatch({ key: 'configs', data: { activeID: id } });

  /** 删除组件 */
  const onDeleteComponent = (id: string) => {
    let activeID = '0';
    _.forEach(sort, (item, index: number) => {
      if (item === id) activeID = sort[index - 1];
    });

    const newData: any = { activeID, components: _.filter(components, item => item.id !== id) };
    dispatch({ key: 'configs', data: newData });
  };

  /**
   * 构建假数据
   */
  const createMock = () => {
    return _.map(components, c => {
      if (c.type === KNOWLEDGE_CARD.ENTITY_INFO) {
        return {
          config: c,
          nodes: [node]
        };
      }
      if (c.type === KNOWLEDGE_CARD.RELATED_LABEL) {
        return {
          config: c,
          nodes: Array.from({ length: 9 }, (v, i) => {
            return {
              id: 'label' + i,
              color: '#126ee3',
              default_property: {
                name: 'name',
                value: intl.get('knowledgeCard.relatedItems'),
                alias: '名称'
              },
              properties: []
            };
          })
        };
      }
      return {
        config: c,
        nodes: Array.from({ length: 3 }, (v, i) => {
          return {
            id: 'document' + i,
            color: '#126ee3',
            default_property: {
              name: 'name',
              value: intl.get('knowledgeCard.relatedDocs'),
              alias: '名称'
            },
            properties: []
          };
        })
      };
    });
  };

  const knowledgeCardComponent = useComponents({
    mode: 'develop',
    configs: createMock(),
    skeleton: false,
    toNextDetail,
    toAsPreview
  });

  return (
    <div className="blockPreviewRoot kw-h-100">
      <DragContainer
        key={knowledgeCardComponent.key}
        className="cardDragRoot"
        activeID={activeID}
        source={knowledgeCardComponent.source}
        onChangeSort={onChangeSort}
        onChangeActive={onChangeActive}
        onDeleteComponent={onDeleteComponent}
      />
    </div>
  );
};

export default BlockPreview;
