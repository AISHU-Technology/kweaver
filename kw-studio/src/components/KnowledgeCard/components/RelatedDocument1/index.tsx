import React, { useMemo, useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Space, Button, Skeleton } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import FileIcon from '@/components/FileIcon';
import './style.less';

import FileNameFix from '../FileNameFix';
import { RelatedDocumentProps } from '../../types';
import useCardLanguage from '../../useCardLanguage';
import { getTitle } from '../../utils';

type ComponentConfig = { title: string; documents: any };

const RelatedDocument1 = (props: RelatedDocumentProps) => {
  const language = useCardLanguage(props);
  const { componentConfig, skeleton, loading } = props;
  const { kg_id, nodes, config } = componentConfig;
  const { toAsPreview } = props;
  const [innerLoading, setInnerLoading] = useState(true);
  const skeletonLoading = skeleton === false ? false : innerLoading;

  useEffect(() => setInnerLoading(!!loading), [loading]);

  const source = useMemo(() => {
    const documents = _.slice(nodes, 0, config.limit).map(node => {
      const properties = _.flattenDeep(_.map(node.properties, p => p.props));
      const title =
        _.find(properties, pro => pro.name === config.endNodeProperty1)?.value || node.default_property?.value;
      return {
        node: { ...node, kg_id: kg_id || config.kg_id },
        title
      };
    });
    const result: ComponentConfig = { title: '', documents };
    result.title = getTitle(config.title, language);
    if (!_.isEmpty(result?.documents)) setInnerLoading(false);
    return result;
  }, [nodes, config]);
  const { title, documents } = source || {};

  const [items, setItems] = useState<any>([]);
  useEffect(() => {
    if (_.isEmpty(documents)) return;
    const _temp = documents.slice(0, 3);
    setItems(_temp);
  }, [JSON.stringify(documents)]);

  const onUnfold = () => {
    setItems(documents);
  };

  return (
    <div className="relatedDocument1Root" style={{ minHeight: skeletonLoading ? 180 : undefined }}>
      <Skeleton loading={skeletonLoading} active>
        <div className="componentTitle kw-ellipsis" title={title}>
          {title}
        </div>
        <Space className="documentSpace" style={{ width: '100%' }} direction="vertical">
          {_.map(items, (item: any, index: number) => {
            const { title, node } = item;
            return (
              <div key={index} className="documentItem" onClick={() => toAsPreview && toAsPreview(node)}>
                <FileIcon name={title} style={{ marginRight: 12, transform: 'translateY(-2px)' }} />
                <FileNameFix name={title} />
              </div>
            );
          })}
        </Space>
        {documents?.length > 3 && items?.length !== documents?.length && (
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

export default (props: RelatedDocumentProps & { visible?: boolean }) => {
  const { visible = true, ...other } = props;
  if (!visible) return null;
  return <RelatedDocument1 {...other} />;
};
