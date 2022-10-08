import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ExclamationCircleFilled, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import { GRAPH_STATUS, CALCULATE_STATUS } from '@/enums';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import ExplainTip from '@/components/ExplainTip';
import { numToThousand } from '@/utils/handleFunction';
import servicesIntelligence from '@/services/intelligence';
import SourceCard from './SourceCard';
import { StatisticsData } from './types';
import { intelligenceCalculate, intelligenceGetByGraph } from './__tests__/mockData';
import './style.less';

interface StatisticsProps {
  isShow: boolean;
  graphBasicData: Record<string, any>;
  graphCount: Record<string, any>;
}
interface DataRowProps {
  field: React.ReactNode;
  tip?: React.ReactNode;
  value?: number;
}

const { NORMAL, FAIL } = GRAPH_STATUS;
const KEY_INTL: Record<string, string> = {
  nodeCount: intl.get('graphList.entityCount'),
  nodeProCount: intl.get('graphList.entityProCount'),
  edgeCount: intl.get('graphList.relationshipCount'),
  edgeProCount: intl.get('graphList.relationshipProCount'),
  totalKnw: intl.get('intelligence.totalKnw'), // 总计知识量
  data_repeat_C1: intl.get('intelligence.repeatRate'), // 重复率
  data_missing_C2: intl.get('intelligence.missRate') // 缺失率
};

const SOURCE_KEYS = ['nodeCount', 'nodeProCount', 'edgeCount', 'edgeProCount', 'totalKnw'];
const QUALITY_KEYS = ['data_repeat_C1', 'data_missing_C2'];
const DataRow = ({ field, tip, value }: DataRowProps) => {
  return (
    <div className="ad-space-between data-row">
      <div>
        {field}
        {tip}
      </div>
      <div>{value !== undefined && value >= 0 ? numToThousand(value) : '--'}</div>
    </div>
  );
};

const Statistics = (props: StatisticsProps) => {
  const { isShow, graphBasicData, graphCount } = props;
  const timer = useRef<any>(null); // 轮询定时器
  const [errMsg, setErrMsg] = useState(''); // 错误信息
  const [loading, setLoading] = useState(false); // 计算loading
  const [detail, setDetail] = useState<StatisticsData>({} as StatisticsData); // 图谱智商详情

  /**
   * `正常` | `失败` 状态的图谱可计算
   */
  const shouldCalculate = useMemo(() => {
    const { status, graphdb_type } = graphBasicData;
    // WARNING `失败` 的nebule图谱无法计算出点和边数量
    const statusArr = [NORMAL, graphdb_type !== 'nebula' && FAIL].filter(Boolean);
    return statusArr.includes(status);
  }, [graphBasicData.status]);

  /**
   * 整合 实体、关系数量
   */
  const counter: Record<string, number> = useMemo(() => {
    const { nodes = [], edges = [], nodeCount = 0, edgeCount = 0 } = graphCount;
    const nodeProCount = nodes.reduce((res: number, item: any) => res + item.count, 0);
    const edgeProCount = edges.reduce((res: number, item: any) => res + item.count, 0);
    const totalKnw = nodeCount + edgeCount + nodeProCount + edgeProCount;
    return { nodeProCount, edgeProCount, nodeCount, edgeCount, totalKnw };
  }, [graphCount]);

  useEffect(() => {
    const { id } = graphBasicData;
    if (!id || !shouldCalculate) return;
    getDetail(id);
    return () => clearTimeout(timer.current);
  }, [graphBasicData.id]);

  /**
   * 获取智商详情
   * @param id 图谱id
   * @param needLoading 是否需要loading
   * @return isFinish 是否计算完成
   */
  const getDetail = async (id: number, needLoading = false): Promise<boolean> => {
    try {
      needLoading && setLoading(true);
      // const { res, Description }: any = (await intelligenceGetByGraph({ graph_id: id })) || {};
      const { res, Description }: any = (await servicesIntelligence.intelligenceGetByGraph({ graph_id: id })) || {};
      if (res) {
        setDetail(res);
        const isFinish = res.calculate_status !== CALCULATE_STATUS.IN_CALCULATING;
        needLoading && setLoading(!isFinish);
        return isFinish;
      }

      setLoading(false);
      Description && setErrMsg(Description);
    } catch {
      setLoading(false);
    }

    return true;
  };

  /**
   * 轮询智商统计量
   */
  const pollingDetail = async () => {
    const isFinish = await getDetail(graphBasicData.id, true);
    if (isFinish) return;
    timer.current = setTimeout(() => {
      clearTimeout(timer.current);
      timer.current = null;
      pollingDetail();
    }, 5000);
  };

  /**
   * 点击计算
   */
  const onCalculateClick = async () => {
    if (!shouldCalculate || loading) return;
    setErrMsg('');

    try {
      setLoading(true);
      // const { res, Description }: any = (await intelligenceCalculate({ graph_id: graphBasicData.id })) || {};
      const { res, Description }: any =
        (await servicesIntelligence.intelligenceCalculate({ graph_id: graphBasicData.id })) || {};
      Description && setErrMsg(Description);
      res && pollingDetail();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="ad-flex-column kg-graph-info-statistics" style={{ display: !isShow ? 'none' : undefined }}>
      {errMsg && (
        <div className="ad-align-center error-tip">
          <ExclamationCircleFilled className="error-icon" />
          <div className="error-text">{errMsg}</div>
          <CloseOutlined className="close-icon" onClick={() => setErrMsg('')} />
        </div>
      )}

      <div className="content ad-p-5 ad-pt-4">
        <div className="header ad-space-between ad-pb-2 ad-mb-3">
          <Format.Title level={22}>
            {intl.get('graphList.statistics')}
            <ExplainTip title={intl.get('intelligence.statisticsTip')} />
          </Format.Title>

          <div
            className={classNames('compute-btn', 'ad-c-primary', { disabled: !shouldCalculate })}
            style={{ cursor: loading ? 'default' : undefined }}
            onClick={onCalculateClick}
          >
            {loading ? (
              <>
                <LoadingOutlined className="ad-mr-1" />
                <span className="ad-c-text">{intl.get('intelligence.calculating')}</span>
              </>
            ) : (
              intl.get('intelligence.calculate')
            )}
          </div>
        </div>

        <SourceCard
          color={{ r: 18, g: 110, b: 227 }}
          title={
            <>
              {intl.get('intelligence.knwSource')}
              <ExplainTip.KNW_SOURCE />
            </>
          }
          source={detail.data_quality_score}
          icon={<IconFont type="icon-zhishiliang" style={{ color: 'rgb(18,110,227)', fontSize: 16 }} />}
        >
          {SOURCE_KEYS.map(key => (
            <DataRow
              key={key}
              field={KEY_INTL[key]}
              value={counter[key]}
              tip={key === 'totalKnw' ? <ExplainTip.KNW_TOTAL_SOURCE /> : undefined}
            />
          ))}
        </SourceCard>

        <SourceCard
          className="ad-mt-6"
          color={{ r: 0, g: 147, b: 144 }}
          title={
            <>
              {intl.get('intelligence.qualitySource')}
              <ExplainTip.QUALITY_SOURCE />
            </>
          }
          source={detail.data_quality_B}
          icon={<IconFont type="icon-shujuzhiliang" style={{ color: 'rgb(0,147,144)', fontSize: 16 }} />}
        >
          {QUALITY_KEYS.map(key => (
            <DataRow key={key} field={KEY_INTL[key]} value={detail[key]} />
          ))}
        </SourceCard>
      </div>
    </div>
  );
};

export default (props: StatisticsProps) => {
  const isMounted = useRef(false);

  // 首次render不挂载组件, 第一次show之后再挂载并用display控制显隐
  if (!props.isShow && !isMounted.current) return null;
  isMounted.current = true;
  return <Statistics {...props} />;
};
