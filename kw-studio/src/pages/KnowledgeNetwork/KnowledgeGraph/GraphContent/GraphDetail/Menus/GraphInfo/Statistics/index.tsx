import React, { useState, useEffect, useRef, useMemo } from 'react';
import { message } from 'antd';
import { ExclamationCircleFilled, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import { CALCULATE_STATUS } from '@/enums';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import ExplainTip from '@/components/ExplainTip';
import { formatIQNumber } from '@/utils/handleFunction';
import servicesIntelligence from '@/services/intelligence';
import ScoreCard from './ScoreCard';
import { StatisticsData } from './types';
import './style.less';

interface StatisticsProps {
  isShow: boolean;
  graphBasicData: Record<string, any>;
  closeDrawer?: () => void;
}

interface DataRowProps {
  field: React.ReactNode;
  tip?: React.ReactNode;
  value?: number;
}

const KEY_INTL: Record<string, { field: string; tip?: React.ReactNode }> = {
  entity_count: { field: intl.get('graphList.entityCount') },
  edge_count: { field: intl.get('graphList.relationshipCount') },
  total_knowledge: { field: intl.get('intelligence.totalKnw'), tip: <ExplainTip type="KNW_TOTAL_SOURCE" /> }, // 总计知识量
  data_repeat_C1: { field: intl.get('intelligence.repeatRate'), tip: <ExplainTip type="REPEAT_RATE" /> }, // 重复率
  data_empty_C2: { field: intl.get('intelligence.missRate'), tip: <ExplainTip type="MISSING" /> } // 缺失率
};
const SOURCE_KEYS = ['entity_count', 'edge_count', 'total_knowledge'];
const QUALITY_KEYS = ['data_repeat_C1', 'data_empty_C2'];

const DataRow = ({ field, tip, value }: DataRowProps) => {
  return (
    <div className="kw-space-between data-row">
      <div>
        {field}
        {tip}
      </div>
      <div>{formatIQNumber(value)}</div>
    </div>
  );
};

const Statistics = (props: StatisticsProps) => {
  const { isShow, graphBasicData, closeDrawer } = props;
  const timer = useRef<any>(null); // 轮询定时器
  const [errMsg, setErrMsg] = useState(''); // 错误信息
  const [loading, setLoading] = useState(false); // 计算loading
  const [detail, setDetail] = useState<StatisticsData>({} as StatisticsData); // 图谱智商详情

  useEffect(() => {
    const { id } = graphBasicData;
    if (!id) return;
    pollingDetail(false);
    return () => clearTimeout(timer.current);
  }, [graphBasicData]); // 监听整个对象，确保响应 `刷新` 按钮触发的交互

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
        const { calculate_status, last_task_message } = res;
        setDetail(res);
        calculate_status === CALCULATE_STATUS.CALCULATE_FAIL && setErrMsg(last_task_message);
        const isFinish = calculate_status !== CALCULATE_STATUS.IN_CALCULATING;
        setLoading(!isFinish);
        return isFinish;
      }

      setLoading(false);
      Description && message.error(Description);
    } catch {
      setLoading(false);
    }

    return true;
  };

  /**
   * 轮询智商统计量
   */
  const pollingDetail = async (needLoading = true) => {
    const isFinish = await getDetail(graphBasicData.id, needLoading);
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
    if (loading) return;
    setErrMsg('');

    try {
      setLoading(true);
      const { res, Description } =
        (await servicesIntelligence.intelligenceCalculate({ graph_id: graphBasicData.id })) || {};
      if (res) return pollingDetail();
      Description && message.error(Description);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="kw-flex-column kg-graph-info-statistics" style={{ display: !isShow ? 'none' : undefined }}>
      {errMsg && (
        <div className="kw-align-center error-tip">
          <ExclamationCircleFilled className="error-icon" />
          <div className="error-text">{errMsg}</div>
          <CloseOutlined className="close-icon" onClick={() => setErrMsg('')} />
        </div>
      )}

      <div className="content">
        <div className="header kw-space-between kw-pb-2">
          <Format.Title level={22}>
            {intl.get('graphDetail.knGraphIQ')}
            <ExplainTip title={intl.get('intelligence.statisticsTip')} />
          </Format.Title>

          <div
            className={classNames('compute-btn kw-align-center', 'kw-c-primary')}
            style={{ cursor: loading ? 'default' : undefined }}
          >
            {loading ? (
              <>
                <LoadingOutlined className="kw-mr-1" />
                <span className="kw-c-text">{intl.get('intelligence.calculating')}</span>
              </>
            ) : (
              <span className="compute-btn-wrapper" onClick={onCalculateClick}>
                {intl.get('intelligence.calculate')}
              </span>
            )}
            <Format.Button
              onClick={closeDrawer}
              className="kw-c-text kw-ml-1"
              size="small"
              tip={intl.get('global.close')}
              type="icon"
            >
              <IconFont type="icon-guanbiquxiao" />
            </Format.Button>
          </div>
        </div>

        <ScoreCard
          className="kw-mt-5"
          color={{ r: 18, g: 110, b: 227 }}
          title={
            <>
              {intl.get('intelligence.knwSource')}
              <ExplainTip type="KNW_SOURCE" />
            </>
          }
          score={detail.data_quality_B}
          icon={<IconFont type="icon-zhishiliang" style={{ color: 'rgb(18,110,227)', fontSize: 16 }} />}
        >
          {SOURCE_KEYS.map(key => {
            const { field, tip } = KEY_INTL[key];
            return <DataRow key={key} field={field} value={detail[key]} tip={tip} />;
          })}
        </ScoreCard>

        <ScoreCard
          className="kw-mt-5"
          color={{ r: 0, g: 147, b: 144 }}
          title={
            <>
              {intl.get('intelligence.qualitySource')}
              <ExplainTip type="QUALITY_SOURCE" />
            </>
          }
          score={detail.data_quality_score}
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
