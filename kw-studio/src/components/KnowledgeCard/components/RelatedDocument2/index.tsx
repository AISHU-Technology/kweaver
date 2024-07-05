import React, { useMemo, useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Space, Button, Skeleton } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import emptyImg from '@/assets/images/emptyFile.svg';
import './style.less';

import { RelatedDocumentProps } from '../../types';
import useCardLanguage from '../../useCardLanguage';
import { getTitle } from '../../utils';

type ComponentConfig = { title: string; documents: any };

const RelatedDocument2 = (props: RelatedDocumentProps) => {
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
      return {
        node: { ...node, kg_id: kg_id || config.kg_id },
        id: node.id,
        imageUrl: _.find(properties, pro => pro.name === config.imageUrl)?.value || '',
        endNodeProperty1:
          _.find(properties, pro => pro.name === config.endNodeProperty1)?.value ||
          intl.get('knowledgeCard.attrValue') + ' 1',
        endNodeProperty2:
          _.find(properties, pro => pro.name === config.endNodeProperty2)?.value ||
          intl.get('knowledgeCard.attrValue') + ' 2'
      };
    });
    const result: ComponentConfig = { title: '', documents };
    result.title = getTitle(config.title, language);

    if (!_.isEmpty(result?.documents)) setInnerLoading(false);
    return result;
  }, [nodes, config]);
  const { title, documents } = source || {};
  const [items, setItems] = useState<any>([]);
  const [failImg, setFailImg] = useState<string[]>([]);

  useEffect(() => {
    if (_.isEmpty(documents)) return;
    const _temp = documents.slice(0, 3);
    setFailImg([]);
    setItems(_temp);
  }, [JSON.stringify(documents)]);

  const onUnfold = () => {
    setItems(documents);
  };

  return (
    <div className="relatedDocument2Root" style={{ minHeight: skeletonLoading ? 180 : undefined }}>
      <Skeleton loading={skeletonLoading} active>
        <div className="componentTitle kw-ellipsis" title={title}>
          {title}
        </div>
        <Space className="documentSpace" style={{ width: '100%' }} direction="vertical">
          {_.map(items, (item: any, index) => {
            const { id, imageUrl = '', endNodeProperty1, endNodeProperty2 } = item;
            const unLoaded = !imageUrl || failImg.includes(id);
            return (
              <div className="documentItem" key={index} onClick={() => toAsPreview && toAsPreview(item)}>
                <div className="documentImage">
                  <img
                    src={unLoaded ? emptyImg : imageUrl}
                    style={unLoaded ? { width: 24, height: 'auto' } : { maxWidth: '100%', maxHeight: '100%' }}
                    onError={() => {
                      setFailImg(pre => [...pre, id]);
                    }}
                  />
                </div>
                <div className="documentTitle">
                  <span className="title1 kw-ellipsis" title={endNodeProperty1}>
                    {endNodeProperty1}
                  </span>
                  <span className="title2 kw-ellipsis" title={endNodeProperty2}>
                    {endNodeProperty2}
                  </span>
                </div>
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
  return <RelatedDocument2 {...other} />;
};
