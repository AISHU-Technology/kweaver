import React, { useState } from 'react';
import { message } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';
import cognitiveSearchService from '@/services/cognitiveSearch';
import Format from '@/components/Format';
import NoDataBox from '@/components/NoDataBox';
import useComponents from '@/components/KnowledgeCard/useComponents';
import Header from '../Header';
import EntitySelector from '../EntitySelector';
import './style.less';

import { RelatedLabelType, RelatedDocumentType1, RelatedDocumentType2 } from '../../../types';

type ConfigFields = RelatedLabelType & RelatedDocumentType1 & RelatedDocumentType2;

export interface TestPanelProps {
  className?: string;
  type: string;
  visible: boolean;
  id: string;
  graphId: number;
  startNode: Record<string, any>;
  configData: ConfigFields;
  onClose?: () => void;
}

const TestPanel = (props: TestPanelProps) => {
  const { className, type, id, graphId, startNode, configData, onClose } = props;
  const [value, setValue] = useState<any>({});
  const [status, setStatus] = useState(''); // loading | ready
  const [result, setResult] = useState<any[]>([]);

  /**
   * 选择起点实体
   * @param data
   */
  const onChange = (data: { input?: string; node?: any }) => {
    setValue(data.node);
    data.node?.id && getResults(data.node.id);
  };

  /**
   * 获取测试数据
   * @param vid 实体vid
   */
  const getResults = async (vid: string) => {
    const params = {
      service_id: id,
      full_resource: true,
      page: 1,
      size: 20,
      query_text: '',
      vertices: [
        {
          kg_id: graphId,
          vid
        }
      ]
    };

    try {
      setResult(() => [{ nodes: [], config: { type: configData.type } }]);
      setStatus('loading');
      const { res } = await cognitiveSearchService.searchTest(params);
      setStatus('ready');
      if (!res) return setResult(() => []);
      const data = type === 'card' ? res.knowledge_card : res.related_knowledge;
      const component = _.filter(data, d => d.config?.type === configData.type);
      component?.[0]?.nodes?.length && setResult(() => component);
    } catch (err) {
      setStatus('');
      const errMsg = err?.ErrorDetails?.[0]?.detail;
      errMsg && message.error(errMsg);
    }
  };

  const knowledgeCardComponent = useComponents({
    configs: result,
    loading: status === 'loading'
  });

  return (
    <div className={classNames(className, 'knw-card-test-panel')}>
      <Header title={intl.get('knowledgeCard.componentTest')} allowClose onClose={onClose} />
      <div className="kw-p-6">
        <Format.Title className="kw-mb-2" strong={4}>
          {intl.get('cognitiveService.neighbors.startPoint')}
        </Format.Title>
        <EntitySelector
          graphId={graphId}
          tags={[startNode.name]}
          placeholder={intl.get('global.pleaseSE')}
          value={value}
          onChange={onChange}
        />

        {(status === 'ready' && result?.[0]?.nodes?.length) || status === 'loading' ? (
          <div
            className="kw-mt-8"
            style={{
              display: status ? undefined : 'none',
              border: result.length ? '1px solid #d9d9d9' : undefined,
              borderRadius: 3
            }}
          >
            {_.map(knowledgeCardComponent.source, c => c.dom)}
          </div>
        ) : null}

        {status === 'ready' && !result?.[0]?.nodes?.length && <NoDataBox.NO_RESULT />}
      </div>
    </div>
  );
};

export default (props: TestPanelProps) => (props.visible ? <TestPanel {...props} /> : null);
