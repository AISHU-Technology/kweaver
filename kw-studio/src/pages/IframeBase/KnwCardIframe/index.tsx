import React, { useState, useEffect, useRef, useMemo } from 'react';
import _ from 'lodash';
import { getParam } from '@/utils/handleFunction';
import services from '../KnwRecommendIframe/services';
import KnowledgeCardComponent from '@/components/KnowledgeCard';
import './style.less';
import { Options, Listener } from './types';
// import { mockRes } from '../KnwRecommendIframe/mock';
import ADGraph from '../ADGraph';

export interface KnwCardIframeProps {
  systemInfo: any; // 乾坤注入的参数???
  style: React.CSSProperties; // 最外层div样式
  options?: Options; // 各种参数
  listener?: Listener; // 事件
}

// 占位数据, 用于渲染骨架屏
const getPlaceData = () => [{ nodes: [], config: { type: 'entity_info' } }];
const globalThis = window;
const postMessage = (key: string, data: any) => {
  globalThis.parent.postMessage({ key, data }, '*');
};
const LISTENER_KEYS = {
  onViewDetails: 'KWeaver:onViewDetails',
  previewFn: 'KWeaver:previewFn'
};

const KnwCardIframe = (props: KnwCardIframeProps) => {
  const { options, listener } = props;
  const {
    appid,
    serviceId,
    // appid = 'NaQWVN7RMRk1kFgSSe-',
    // serviceId = 'bd756ea1de3446b785e7d0e247af7475',
    query,
    language
  } = options || getParam() || {};
  const [result, setResult] = useState<any[]>([]);
  const [status, setStatus] = useState(''); // loading | ready | error
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingData = useMemo(() => getPlaceData(), []);

  useEffect(() => {
    init({ query });
  }, [query]);

  /**
   * 初始化
   */
  const init = async (data: { query?: string; node?: any }) => {
    // 触发骨架屏
    const components = (await getLabelDetail(data)) || [];
    // const components = (await getLabelDetail(data)) || mockRes.res.knowledge_card;
    setResult(components);
  };

  /**
   * 发送事件
   * @param key 事件名
   * @param data 数据
   */
  const emit = (key: keyof typeof LISTENER_KEYS, data: any) => {
    listener?.[key]?.(data);
    postMessage(LISTENER_KEYS[key], data);
  };

  /**
   * 获取标签详情数据
   * @param vid 实体vid
   */
  const getLabelDetail = async (data: { query?: string; node?: any }) => {
    const { query = '', node } = data;
    const params: any = {
      service_id: serviceId,
      full_resource: true,
      page: 1,
      size: 20,
      query_text: query
    };
    if (node) {
      params.vertices = [
        {
          kg_id: node.kg_id,
          vid: node.id
        }
      ];
    }

    try {
      setStatus('loading');
      const { res } = await services.searchTest(params, { appid });
      if (!res?.knowledge_card && !res?.related_knowledge) {
        setStatus('error');
        return;
      }
      setStatus('ready');
      const components = [...res.knowledge_card, ...res.related_knowledge];
      return _.filter(components, d => d.nodes?.length);
      // return mockRes.res.knowledge_card;
    } catch (err) {
      setStatus('error');
      // return mockRes.res.knowledge_card;
    }
  };

  /**
   * 点击标签
   * @param node
   */
  const toNextLabel = async (node: any) => {
    emit('onViewDetails', node);
  };

  /**
   * 查看文档
   * @param node
   */
  const toPrevDocument = (node: any) => {
    emit('previewFn', node);
  };

  const mock = {
    res: {
      kgqa: {
        data: [
          {
            kg_id: 3,
            answer: '北京车易付科技股份有限公司(车易付)：id是1，short_form是车易付，name是北京车易付科技股份有限公司。',
            subgraph: {
              nodes: Array.from({ length: 3 }, (v, i) => ({
                id: '0bbc1e75357c4d65fde107ce814f1541' + i,
                tags: ['enterprise'],
                properties: [
                  {
                    tag: 'enterprise',
                    props: [{ name: 'name', value: '北京车易付科技股份有限公司', alias: 'name', type: 'string' }]
                  }
                ],
                color: 'rgba(217,112,76,1)',
                icon: 'empty',
                alias: '企业' + i,
                default_property: { name: 'name', value: '北京车易付科技股份有限公司', alias: 'name' }
              })),
              edges: []
            }
          }
        ]
      }
    }
  };
  const container = useRef<HTMLDivElement>(null);
  const graphInstance = useRef<ADGraph | null>(null);
  useEffect(() => {
    graphInstance.current = new ADGraph({
      container: container.current!,
      location: {
        origin: 'https://10.4.128.109:8444',
        pathname: '/iframe/subgraph',
        search: '?appid=NhyHQIYeiPN_kQ-EYV6&kg_id=1'
      }
    });
  }, []);

  const onAdd = () => {
    graphInstance.current?.iframe?.contentWindow?.postMessage(
      { key: 'KWeaver:graph:subgraph', data: mock.res.kgqa.data[0].subgraph },
      '*'
    );
  };

  return (
    <div ref={containerRef} className="kw-knowledge-card-iframe kw-flex-column">
      {!!result.length || status === 'loading' ? (
        <KnowledgeCardComponent
          data={status === 'loading' ? loadingData : result}
          language={language}
          loading={status === 'loading'}
          toPreview={toPrevDocument}
          toNextDetail={toNextLabel}
        />
      ) : null}

      <div ref={container} style={{ height: 600 }}>
        <button onClick={onAdd}>添加数据</button>
      </div>
    </div>
  );
};

export default KnwCardIframe;
