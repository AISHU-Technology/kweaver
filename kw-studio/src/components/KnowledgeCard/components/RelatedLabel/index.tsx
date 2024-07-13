import React, { useRef, useMemo, useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classnames from 'classnames';
import { Space, Button, Skeleton } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import HELPER from '@/utils/helper';
import { RelatedLabelProps } from '../../types';
import useCardLanguage from '../../useCardLanguage';
import { getTitle } from '../../utils';

import './style.less';

type Label = { id: string; name: string; [key: string]: any };
type ComponentConfig = { title: string; labels: Label[] };

const RelatedLabel = (props: RelatedLabelProps) => {
  const language = useCardLanguage(props);
  const { componentConfig, skeleton, loading } = props;
  const { kg_id, nodes, config } = componentConfig;
  const { toNextDetail } = props;
  const spaceRef = useRef<any>(null);

  const [innerLoading, setInnerLoading] = useState(true);
  const skeletonLoading = skeleton === false ? false : innerLoading;

  useEffect(() => setInnerLoading(!!loading), [loading]);

  const source = useMemo(() => {
    const labels = _.slice(nodes, 0, config.limit).map(node => {
      return {
        node: { ...node, kg_id: kg_id || config.kg_id },
        id: node.id,
        name: node.default_property?.value,
        color: config?.labelColor === 'inherit' ? node.color : config?.labelColor || '#126ee3'
      };
    });

    const result: ComponentConfig = { title: '', labels };
    result.title = getTitle(config.title, language);

    if (!_.isEmpty(result?.labels)) setInnerLoading(false);
    return result;
  }, [nodes, config]);
  const { title, labels } = source || {};

  const [limit, setLimit] = useState(0);
  const [items, setItems] = useState<any>([]);
  useEffect(() => {
    if (!spaceRef.current || _.isEmpty(labels)) return;
    const offset = 24;
    let row = 1;
    let rowWidth = 0;
    const maxRowWidth = spaceRef.current.clientWidth;
    _.forEach(labels, (item, index: number) => {
      const strLen = HELPER.getLengthFromString(`#${item?.name}`) + offset;
      rowWidth += strLen;
      if (rowWidth > maxRowWidth) {
        row += 1;
        rowWidth = strLen;
      }
      if (row > 3) {
        setLimit(index);
        return false;
      }
    });
    row <= 3 && setLimit(labels.length);
  }, [spaceRef.current, JSON.stringify(labels)]);

  useEffect(() => {
    setItems(labels.slice(0, limit));
  }, [limit, JSON.stringify(labels)]);

  const onUnfold = () => {
    setItems(labels);
  };

  return (
    <div className="relatedLabelRoot" style={{ minHeight: skeletonLoading ? 180 : undefined }}>
      <Skeleton loading={skeletonLoading} active>
        <div className="componentTitle kw-ellipsis" title={title}>
          {title}
        </div>
        <div ref={spaceRef}>
          <Space className="mainProductSpace" style={{ width: '100%' }} wrap size={8}>
            {_.map(items, (item: Label, index) => {
              const { id, name, color, node } = item;
              return (
                <div
                  key={id || index}
                  className={classnames('mainProductItem', 'kw-ellipsis')}
                  title={name}
                  style={{ color, backgroundColor: HELPER.hexToRgba(color, 0.1) }}
                  onClick={() => id && toNextDetail && toNextDetail(node)}
                >{`#${name}`}</div>
              );
            })}
          </Space>
        </div>
        {labels?.length > limit && items?.length !== labels?.length && (
          <div className="moreProduce">
            <Button className="moreButton" type="link" onClick={onUnfold}>
              {intl.get('knowledgeCard.viewMore')}
              <DownOutlined style={{ fontSize: 10 }} />
            </Button>
          </div>
        )}
      </Skeleton>
    </div>
  );
};

export default (props: RelatedLabelProps & { visible?: boolean }) => {
  const { visible = true, ...other } = props;
  if (!visible) return null;
  return <RelatedLabel {...other} />;
};
