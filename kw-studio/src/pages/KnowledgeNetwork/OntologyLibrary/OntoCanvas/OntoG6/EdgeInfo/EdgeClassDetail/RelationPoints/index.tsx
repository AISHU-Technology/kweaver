import React from 'react';
import { Select, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import IconFont from '@/components/IconFont';
import './style.less';

const { Option } = Select;

const RelationPoints = (props: any) => {
  const { readOnly, edges, nodes, onDelete, onChange } = props;

  /**
   * 选择起点终点
   */
  const handleChange = (edge: any, type: 'source' | 'target', option: Record<string, any>) => {
    onChange?.({ ...edge, [type]: option.value, [type === 'source' ? 'startName' : 'endName']: option.label });
  };

  /**
   * 调换起点终点
   */
  const onSwap = (edge: any) => {
    const [source, target] = [edge.target, edge.source];
    onChange?.({ ...edge, source, target });
  };

  return (
    <div className="onto-edge-relation-points">
      <div className={readOnly ? 'point-th-readonly kw-flex kw-mb-1' : 'point-th kw-flex kw-mb-1'}>
        <div className="kw-c-subtext">{intl.get('ontoLib.canvasEdge.detailStartClassName')}</div>
        <div className="kw-c-subtext">{intl.get('ontoLib.canvasEdge.detailEndClassName')}</div>
      </div>
      {_.map(edges, edge => {
        return (
          <div key={edge.uid} className="point-row kw-flex kw-mb-3">
            <div
              className={classNames('del-icon kw-mr-2 kw-pointer', { disabled: readOnly })}
              onClick={() => !readOnly && onDelete?.(edge)}
            >
              <IconFont type="icon-del" />
            </div>
            <div className={readOnly ? 'point-selector-readonly' : 'point-selector'}>
              <Select
                className={classNames('kw-w-100', { 'error-border': edge.sourceErr })}
                placeholder={intl.get('createEntity.startPointPlace1')}
                disabled={readOnly}
                value={edge.source}
                onChange={(v, option: any) => handleChange(edge, 'source', option)}
              >
                {_.map(nodes, node => (
                  <Option key={node.uid} label={node.name}>
                    {node.alias}
                  </Option>
                ))}
              </Select>
              {edge.sourceErr && <div className="err-msg">{edge.sourceErr}</div>}
            </div>
            <Tooltip placement="top" title={intl.get('ontoLib.canvasEdge.clickF')}>
              <div
                className={classNames('swap-icon kw-pointer', { disabled: readOnly })}
                onClick={() => !readOnly && onSwap?.(edge)}
              >
                <IconFont type="icon-change" />
              </div>
            </Tooltip>
            <div className={readOnly ? 'point-selector-readonly' : 'point-selector'}>
              <Select
                className={classNames('kw-w-100', { 'error-border': edge.targetErr })}
                placeholder={intl.get('createEntity.endPointPlace1')}
                disabled={readOnly}
                value={edge.target}
                onChange={(v, option: any) => handleChange(edge, 'target', option)}
              >
                {_.map(nodes, node => (
                  <Option key={node.uid} label={node.name}>
                    {node.alias}
                  </Option>
                ))}
              </Select>
              {edge.targetErr && <div className="err-msg">{edge.targetErr}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RelationPoints;
