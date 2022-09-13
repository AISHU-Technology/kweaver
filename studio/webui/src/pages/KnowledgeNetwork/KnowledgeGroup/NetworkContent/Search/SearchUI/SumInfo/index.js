import React, { memo, useCallback, useMemo } from 'react';
import { Collapse } from 'antd';
import intl from 'react-intl-universal';
import { numToThousand } from '@/utils/handleFunction';
import emptyImg from '@/assets/images/empty.svg';
import In from '@/assets/images/in.svg';
import Out from '@/assets/images/out.svg';
import './style.less';

const { Panel } = Collapse;
const sumFunc = data => data.reduce((res, { count }) => res + parseInt(count), 0);

const SumInfo = props => {
  const { inE = [], outE = [] } = props.data;
  const inCounts = useMemo(() => numToThousand(sumFunc(inE)), [inE]); // 进边统计
  const outCounts = useMemo(() => numToThousand(sumFunc(outE)), [outE]); // 出边统计

  /**
   * 渲染列表
   * @param {Object} { data } 边数据
   */
  const RenderList = useCallback(({ data }) => {
    const { alias, count, color } = data;

    return (
      <div className="row">
        <span className="line ad-ellipsis" style={{ backgroundColor: color }} />
        <span className="e-name ad-ellipsis" title={alias || data.class}>
          {alias || data.class}
        </span>
        <span className="count ad-ellipsis" title={count}>
          {count}
        </span>
      </div>
    );
  }, []);

  const RenderEmpty = () => (
    <div className="nodata-box">
      <img src={emptyImg} alt="no data" />
      <p>{intl.get('createEntity.noData')}</p>
    </div>
  );

  return (
    <div className="search-res-sum-info">
      <Collapse
        className="coll"
        expandIconPosition={'right'}
        ghost
        defaultActiveKey={[!!inE.length && '1', !!outE.length && '2'].filter(Boolean)}
      >
        <Panel
          header={
            <div className="coll-head">
              <img src={In} alt="in" className="icon" />
              <span className="word">
                {intl.get('search.inEdge')}&nbsp;({inCounts})
              </span>
            </div>
          }
          key="1"
        >
          <div className="list-content">
            {inE.length ? inE.map((item, index) => <RenderList key={`${index}`} data={item} />) : <RenderEmpty />}
          </div>
        </Panel>
        <Panel
          header={
            <div className="coll-head">
              <img src={Out} alt="in" className="icon" />
              <span className="word">
                {intl.get('search.outEdge')}&nbsp;({outCounts})
              </span>
            </div>
          }
          key="2"
        >
          <div className="list-content">
            {outE.length ? outE.map((item, index) => <RenderList key={`${index}`} data={item} />) : <RenderEmpty />}
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

SumInfo.defaultProps = {
  data: {}
};

export default memo(SumInfo);
