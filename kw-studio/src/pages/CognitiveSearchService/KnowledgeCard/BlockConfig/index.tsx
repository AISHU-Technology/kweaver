import React, { useMemo } from 'react';
import _ from 'lodash';
import EntityInfo from './EntityInfo';
import RelatedLabel from './RelatedLabel';
import RelatedDocument from './RelatedDocument';
import KNOWLEDGE_CARD from '../enums';
import './style.less';

import { useCard } from '../useCard';

export interface BlockConfigProps {
  onViewOntology?: () => void;
}

const BlockConfig = (props: BlockConfigProps) => {
  const { onViewOntology } = props;
  const { state, dispatch } = useCard();
  const { configs, testOptions } = state;
  const component = useMemo(() => {
    if (!configs.activeID) return null;
    return _.find(configs.components, c => c.id === configs.activeID);
  }, [configs.activeID, configs.components]);

  /**
   * 配置变化
   * @param newConfigs 修改的配置
   */
  const onChange = (newConfigs: any) => {
    const newComponents = _.map(configs.components, c => {
      if (c.id === configs.activeID) {
        return { ...c, ...newConfigs };
      }
      return c;
    });
    dispatch({ key: 'configs', data: { components: newComponents } });
  };

  return (
    <div className="blockConfigRoot">
      {component?.type === KNOWLEDGE_CARD.ENTITY_INFO && (
        <EntityInfo node={configs.node} data={component} onChange={onChange} />
      )}
      {component?.type === KNOWLEDGE_CARD.RELATED_LABEL && (
        <RelatedLabel
          knwId={state.knwId}
          type={state.configType}
          node={configs.node}
          ontoData={state.selectedGraph}
          data={component}
          testOptions={testOptions}
          externalModel={state?.externalModel}
          onChange={onChange}
          onViewOntology={onViewOntology}
        />
      )}
      {_.includes([KNOWLEDGE_CARD.RELATED_DOCUMENT_1, KNOWLEDGE_CARD.RELATED_DOCUMENT_2], component?.type) && (
        <RelatedDocument
          knwId={state.knwId}
          type={state.configType}
          node={configs.node}
          ontoData={state.selectedGraph}
          data={component}
          testOptions={testOptions}
          externalModel={state?.externalModel}
          onChange={onChange}
          onViewOntology={onViewOntology}
        />
      )}
    </div>
  );
};

export default BlockConfig;
