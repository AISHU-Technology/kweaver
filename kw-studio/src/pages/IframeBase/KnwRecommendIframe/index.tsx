import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Popover } from 'antd';
import { CloseOutlined, LeftOutlined, EllipsisOutlined, LikeOutlined, DislikeOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import _ from 'lodash';
import { getParam } from '@/utils/handleFunction';
import KnowledgeCardComponent from '@/components/KnowledgeCard';
import FailImg from '@/assets/images/noResult.svg';
import './style.less';

import services from './services';
import { Options, Listener } from './types';
import { mockRes } from './mock';

export interface KnwRecommendIframeProps {
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
  previewFn: 'KWeaver:previewFn',
  onCloseDetails: 'KWeaver:onCloseDetails',
  onLike: 'KWeaver:onLike',
  onDislike: 'KWeaver:onDislike'
};

const KnwRecommendIframe = (props: KnwRecommendIframeProps) => {
  const { options, listener } = props;
  const {
    appid = 'NaQWVN7RMRk1kFgSSe-',
    serviceId = 'bd756ea1de3446b785e7d0e247af7475',
    gns,
    configName,
    title = '知识点',
    language,
    systemInfo,
    style
  } = options || getParam() || {};
  const [initLabel, setInitLabel] = useState<{ title: string; components: any[] }>({
    title,
    components: []
  });
  const [stack, setStack] = useState<{ current: number; data: any[] }>({ current: -1, data: [] });
  const [status, setStatus] = useState(''); // loading | ready | error
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingData = useMemo(() => getPlaceData(), []);

  useEffect(() => {
    // 清除数据
    setInitLabel({ title, components: [] });
    setStack({ current: -1, data: [] });

    init(gns);
  }, [gns]);

  /**
   * 初始化获取文档相关知识点
   * @param gns 文档id
   */
  const init = async (gns: string) => {
    setStatus('loading');
    try {
      const { res } = (await services.knowledgePointPost({ service_id: serviceId, gns }, { appid })) || {};
      setStatus('ready');
      if (res) {
        const components = createLabelsComponent(res);
        setInitLabel(pre => ({ ...pre, components }));
      }
    } catch {
      setStatus('error');
      const components = createLabelsComponent([
        {
          word: '爱数',
          kg_id: 10,
          vid: '123'
        },
        {
          word: '大数据基础设施',
          kg_id: 10,
          vid: '456'
        }
      ]);
      setInitLabel(pre => ({ ...pre, components }));
    }
  };

  /**
   * 知识点转换成标签组件
   * @param res
   */
  const createLabelsComponent = (res: any[]) => {
    if (!res?.[0]?.kg_id) return [];
    return [
      {
        kg_id: res[0].kg_id,
        config: {
          type: 'related_label',
          title: { [language || 'zh-CN']: title }
        },
        nodes: _.map(res, d => ({
          id: d.vid,
          color: '#126ee3',
          default_property: { name: 'name', value: d.word, alias: 'name' }
        }))
      }
    ];
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
      return components;
      // return .res.knowledge_card;
    } catch (err) {
      setStatus('error');
      return mockRes.res.knowledge_card;
    }
  };

  /**
   * 重试
   */
  const onRetry = async () => {
    if (stack.current === -1) {
      init(gns);
      return;
    }

    const { current, data } = stack;
    const { params } = data[current];
    const components = await getLabelDetail(params);
    setStack(pre => {
      const { current, data } = pre;
      const newData = [...data];
      newData[current] = { ...data[current], components: components || [], error: !components };
      return { current, data: newData };
    });
  };

  /**
   * 点击标签
   * @param node
   */
  const toNextLabel = async (node: any) => {
    emit('onViewDetails', node);
    if (status === 'loading') return;
    const nextCurrent = stack.current + 1;
    const params = { node };
    setStack({
      current: nextCurrent,
      data: [...stack.data, { title: title || node.default_property.value, params, components: getPlaceData() }]
    });
    const components = await getLabelDetail(params);
    setStack(pre => {
      const { data } = pre;
      const newData = [...data];
      newData[nextCurrent] = { ...data[nextCurrent], components: components || [], error: !components };
      return { ...pre, data: newData };
    });
  };

  /**
   * 查看文档
   * @param node
   */
  const toPrevDocument = (node: any) => {
    const gnsPro = _.find(node.properties?.[0]?.props, pro => pro.name === 'gns');
    const data = {
      functionid: systemInfo?.functionid,
      item: { docid: gnsPro?.value, name: node.default_property?.value, size: 0 }
    };
    emit('previewFn', data);
  };

  /**
   * 上一条
   */
  const onPrev = () => {
    setStack(pre => {
      if (pre.current < 0) return pre;
      const newData = { ...pre };
      newData.current -= 1;
      newData.data.pop();
      return newData;
    });
  };

  /**
   * 关闭导航条
   */
  const onClose = () => {
    emit('onCloseDetails', {});
    setStack({ current: -1, data: [] });
  };

  const onLike = () => {
    emit('onLike', true);
  };

  const onDislike = () => {
    emit('onDislike', true);
  };

  const renderData =
    stack.current === -1 ? initLabel.components : stack.data[stack.current]?.components || initLabel.components;

  return (
    <div className="testaaaa" style={style}>
      {/* <div style={style}> */}
      <div ref={containerRef} className="kw-knowledge-recommend-iframe kw-flex-column">
        {stack.current > -1 && (
          <div className="card-header kw-align-center">
            <div className="h-btn kw-pointer" onClick={onPrev}>
              <LeftOutlined className="kw-mr-2" />
              上一条
            </div>
            <div className="h-title kw-flex-item-full-width kw-ellipsis">{stack.data[stack.current]?.title}</div>
            <div className="h-btn close-icon kw-pointer" onClick={onClose}>
              <CloseOutlined />
            </div>
          </div>
        )}

        {renderData.length || status === 'loading' ? (
          <KnowledgeCardComponent
            data={status === 'loading' ? loadingData : renderData}
            language={language}
            loading={status === 'loading'}
            toPreview={toPrevDocument}
            toNextDetail={toNextLabel}
          />
        ) : (
          <div className="load-fail-box">
            {stack.current === -1 && (
              <div className="componentTitle kw-ellipsis" title={title}>
                {title}
              </div>
            )}
            <div className="kw-flex-column kw-center" style={{ padding: '16px 0' }}>
              <img src={FailImg} alt="fail" />
              <div>
                <span className="kw-c-subtext">加载失败，请稍后</span>
                <span className="kw-c-primary kw-pointer" onClick={onRetry}>
                  重试
                </span>
              </div>
            </div>
          </div>
        )}

        {status !== 'loading' && stack.current === -1 && (
          <Popover
            getPopupContainer={() => containerRef.current!}
            placement="top"
            overlayClassName="more-icon-popover"
            trigger={['click']}
            content={
              <div className="kw-flex">
                <LikeOutlined className={classNames('kw-mr-3 kw-pointer', { checked: true })} onClick={onLike} />
                <DislikeOutlined className={classNames('kw-pointer', { checked: false })} onClick={onDislike} />
              </div>
            }
          >
            <div className="more-icon-wrap kw-pointer">
              <EllipsisOutlined className="more-icon" />
            </div>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default KnwRecommendIframe;
