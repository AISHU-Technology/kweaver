import React, { useState, useEffect, useRef, useMemo } from 'react';
import { message } from 'antd';
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
import ScoreCard from './ScoreCard';
import { StatisticsData } from './types';
import './style.less';

interface StatisticsProps {
  isShow: boolean;
  graphBasicData: Record<string, any>;
}
interface DataRowProps {
  field: React.ReactNode;
  tip?: React.ReactNode;
  value?: number;
}

const { NORMAL, WAITING, RUNNING, FAIL, CONFIGURATION, STOP } = GRAPH_STATUS;
const KEY_INTL: Record<string, { field: string; tip?: React.ReactNode }> = {
  entity_count: { field: intl.get('graphList.entityCount') },
  edge_count: { field: intl.get('graphList.relationshipCount') },
  total_knowledge: { field: intl.get('intelligence.totalKnw'), tip: <ExplainTip.KNW_TOTAL_SOURCE /> }, // 总计知识量
  data_repeat_C1: { field: intl.get('intelligence.repeatRate'), tip: <ExplainTip.REPEAT_RATE /> }, // 重复率
  data_empty_C2: { field: intl.get('intelligence.missRate'), tip: <ExplainTip.MISSING /> } // 缺失率
};
const SOURCE_KEYS = ['entity_count', 'edge_count', 'total_knowledge'];
const QUALITY_KEYS = ['data_repeat_C1', 'data_empty_C2'];

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
  const { isShow, graphBasicData } = props;
  const timer = useRef<any>(null); // 轮询定时器
  const [errMsg, setErrMsg] = useState(''); // 错误信息
  const [loading, setLoading] = useState(false); // 计算loading
  const [detail, setDetail] = useState<StatisticsData>({} as StatisticsData); // 图谱智商详情

  /**
   * `正常` | `失败` 状态的图谱可计算
   * WARNING `失败` 的nebule图谱无法计算出点和边数量
   */
  const shouldCalculate = useMemo(() => {
    const { status, graphdb_type } = graphBasicData;
    const statusArr = [NORMAL, graphdb_type !== 'nebula' && FAIL].filter(Boolean);
    return statusArr.includes(status);
  }, [graphBasicData.status]);

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
      const { res, Description }: any = (await servicesIntelligence.intelligenceGetByGraph({ graph_id: id })) || {};
      if (res) {
        setDetail(res);
        const isFinish = res.calculate_status !== CALCULATE_STATUS.IN_CALCULATING;
        setLoading(!isFinish);
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
   * 无法计算时报错提示
   */
  const alertErr = () => {
    const { status, graphdb_type } = graphBasicData;
    switch (true) {
      case status === WAITING:
        return message.error(intl.get('intelligence.waitErr'));
      case status === RUNNING:
        return message.error(intl.get('intelligence.runErr'));
      case status === CONFIGURATION || status === STOP:
        return message.error(intl.get('intelligence.configErr'));
      case status === FAIL && graphdb_type === 'nebula':
        return message.error(intl.get('intelligence.failErr'));
      default:
        break;
    }
  };

  /**
   * 点击计算
   */
  const onCalculateClick = async () => {
    if (loading) return;
    if (!shouldCalculate) return alertErr();
    setErrMsg('');

    try {
      setLoading(true);
      const { res, Description } =
        (await servicesIntelligence.intelligenceCalculate({ graph_id: graphBasicData.id })) || {};
      if (res) return pollingDetail();
      Description && setErrMsg(Description);
      setLoading(false);
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
            className={classNames('compute-btn', 'ad-c-primary')}
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

        <ScoreCard
          color={{ r: 18, g: 110, b: 227 }}
          title={
            <>
              {intl.get('intelligence.knwSource')}
              <ExplainTip.KNW_SOURCE />
            </>
          }
          score={detail.data_quality_score}
          icon={<IconFont type="icon-zhishiliang" style={{ color: 'rgb(18,110,227)', fontSize: 16 }} />}
        >
          {SOURCE_KEYS.map(key => {
            const { field, tip } = KEY_INTL[key];
            return <DataRow key={key} field={field} value={detail[key]} tip={tip} />;
          })}
        </ScoreCard>

        <ScoreCard
          className="ad-mt-6"
          color={{ r: 0, g: 147, b: 144 }}
          title={
            <>
              {intl.get('intelligence.qualitySource')}
              <ExplainTip.QUALITY_SOURCE />
            </>
          }
          score={detail.data_quality_B}
          icon={<IconFont type="icon-shujuzhiliang" style={{ color: 'rgb(0,147,144)', fontSize: 16 }} />}
        >
          {QUALITY_KEYS.map(key => {
            const { field, tip } = KEY_INTL[key];
            return <DataRow key={key} field={field} value={detail[key]} tip={tip} />;
          })}
        </ScoreCard>
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
