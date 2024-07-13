import React, { useState, useMemo } from 'react';
import { Radio } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import NoDataBox from '@/components/NoDataBox';
import _ from 'lodash';
import List from './List';
import './style.less';

export interface OntologiesListProps {
  className?: string;
  ontology: { entity?: any[]; edge?: any[] };
  isEditorFocused?: boolean;
  onAdd?: (text: string) => void;
}

const OntologiesList = (props: OntologiesListProps) => {
  const { className, ontology, isEditorFocused, onAdd } = props;
  const [activeKey, setActiveKey] = useState('node');
  const { nodes, edges } = useMemo(() => {
    const nodesMap = _.keyBy(ontology.entity, 'name');
    const edges = _.map(ontology.edge, e => {
      const [source, __, target] = e.relation || [];
      return { ...e, sourceNode: nodesMap[source], targetNode: nodesMap[target] };
    });
    return { nodes: ontology.entity || [], edges };
  }, [ontology]);

  return (
    <div className={classNames(className, 'cog-service-onto-list kw-flex-column kw-h-100')}>
      <div
        className="panel-buttons kw-flex kw-mt-5 kw-mb-5 kw-pl-6 kw-pr-6"
        onMouseDown={e => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <div className={classNames('title-btn', { active: activeKey === 'node' })} onClick={() => setActiveKey('node')}>
          {intl.get('global.entityClass')}
        </div>
        <div className={classNames('title-btn', { active: activeKey === 'edge' })} onClick={() => setActiveKey('edge')}>
          {intl.get('global.relationClass')}
        </div>
      </div>
      <div className="kw-flex-item-full-height">
        <div className="kw-h-100" style={{ overflow: 'auto', display: activeKey === 'node' ? undefined : 'none' }}>
          {nodes.length ? (
            <List type="node" data={nodes} isEditorFocused={isEditorFocused} onAdd={onAdd} />
          ) : (
            <NoDataBox type="NO_CONTENT" />
          )}
        </div>
        <div className="kw-h-100" style={{ overflow: 'auto', display: activeKey === 'edge' ? undefined : 'none' }}>
          {edges.length ? (
            <List type="edge" data={edges} isEditorFocused={isEditorFocused} onAdd={onAdd} />
          ) : (
            <NoDataBox type="NO_CONTENT" />
          )}
        </div>
      </div>
    </div>
  );
};

export default OntologiesList;
