import React from 'react'
import intl from 'react-intl-universal';
import './style.less';

interface PathExploreProps {
  count: number;
  setStartNodeProperty: (type: number, direction: string) => void;
}
// 路径方向，正向、反向、全部
const DIRECTION = [{ dir: 'searchGraph.forward', value: 'positive' }, { dir: 'searchGraph.reverse', value: 'reverse' }, { dir: 'searchGraph.allDirection', value: 'bidirect' }];
const PathExplore: React.FC<PathExploreProps> = props => {
  const { setStartNodeProperty } = props;

  return (
    <div className="path-explore-box" id="pathExploreTab">
      <div>
        <div className="title">{intl.get('searchGraph.shortPath')}</div>
        {DIRECTION.map((item, index) => {
          return (
            <div
              className="dire-item"
              key={index}
              onClick={() => {
                setStartNodeProperty(1, item.value)
              }
              }
            >
              <span>{intl.get(item.dir)}</span>
            </div>
          )
        })}
      </div>
      <div className="line"></div>
      <div>
        <div className="title">{intl.get('searchGraph.allPath')}</div>
        {DIRECTION.map((item, index) => {
          return (
            <div
              className="dire-item"
              key={index}
              onClick={() => {
                setStartNodeProperty(0, item.value)
              }
              }
            >
              <span>{intl.get(item.dir)}</span>
            </div>
          )
        })}
      </div>
    </div>
  );
}
export default PathExplore;