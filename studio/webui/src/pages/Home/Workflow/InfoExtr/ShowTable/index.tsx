import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Input, Tree, message } from 'antd';

import servicesCreateEntity from '@/services/createEntity';
import { switchIcon } from '@/utils/handleFunction';

import emptyImg from '@/assets/images/empty.svg';
import unSupportImg from '@/assets/images/bz.png';
import './style.less';

const ShowTable = (props: any) => {
  const { selfKey, viewType, preData, area } = props;
  const [treeData, setTreeData] = useState<any[]>([]);

  useEffect(() => {
    if (viewType === 'dir' && preData.data) setTreeData(() => createTree(preData.data));
  }, [viewType, preData]);

  const createTree = (output: any[]) => {
    const tree = [];
    let eachData = {};

    if (output?.length > 0) {
      for (let i = 0; i < output.length; i++) {
        const { name, type, docid } = output[i];
        eachData = {
          icon: switchIcon(type, name, 16),
          title: <span className="board-file-name">{name}</span>,
          key: docid,
          isLeaf: type === 'file',
          selectable: false
        };
        tree.push(eachData);
      }
    }

    return tree;
  };

  const updateTree: Function = (origin: any[], key: string, children: any[]) => {
    return _.map(origin || [], node => {
      if (node.key === key) {
        return { ...node, children };
      } else if (node.children) {
        return { ...node, children: updateTree(node.children, key, children) };
      }
      return node;
    });
  };

  const onLoadData = ({ key, children }: { key: string; children: any[] }) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async resolve => {
      if (children) return resolve(true);

      try {
        const params = { docid: key, ds_id: preData.ds_id, postfix: 'all' };
        const { res = {}, Code = '' } = await servicesCreateEntity.getChildrenFile(params);

        setTimeout(() => {
          if (!_.isEmpty(res)) setTreeData(origin => updateTree(origin, key, createTree(res?.output)));
          if (Code === 500013) message.error(intl.get('workflow.information.as7BeOver'));
          resolve(true);
        }, 500);
      } catch (error) {
        //
      }
    });
  };

  const mapNoJsonData = (viewType: string, preData: any) => {
    return (
      <div className="extract-table" style={area === 'modal' ? { overflowX: 'auto', overflowY: 'hidden' } : undefined}>
        {_.map(preData || [], (item, index: number) => {
          return (
            <div
              key={`row${index}`}
              className={viewType === 'model' ? (index === 0 ? 'row-title' : 'model-row') : 'row'}
              style={viewType === 'non-json' ? { width: item.length * 197 } : undefined}
            >
              {viewType === 'model' ? (
                index === 0 ? (
                  <React.Fragment>
                    <div className="column">
                      <span key={index.toString()}>{intl.get('workflow.information.tableTitle1')}</span>
                    </div>
                    <div className="column">
                      <span key={index.toString()}>{intl.get('workflow.information.tableTitle2')}</span>
                    </div>
                    <div className="column">
                      <span key={index.toString()}>{intl.get('workflow.information.tableTitle3')}</span>
                    </div>
                  </React.Fragment>
                ) : (
                  _.map(item || [], (childItem, childIndex) => {
                    return (
                      <div className="column-un" key={`${index}-${childIndex}`}>
                        <div className="name" title={childItem.alias ? childItem.alias : ''}>
                          {childItem.alias ? childItem.alias : '--'}
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                _.map(item || [], (childItem, childIndex) => {
                  return (
                    <div className="column" key={`${index}-${childIndex}`} title={childItem}>
                      {childItem}
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const mapJsonData = (preData: any) => {
    return (
      <div className="json-text-area">
        <Input.TextArea value={preData} autoSize={true} disabled={true} />
      </div>
    );
  };

  const mapDir = () => {
    return (
      <div className="file-tree">
        <Tree.DirectoryTree key={preData.docid} blockNode treeData={treeData} loadData={onLoadData as any} />
      </div>
    );
  };

  const switchShowTable = (viewType: string, preData: any) => {
    switch (viewType) {
      case 'non-json':
        return preData instanceof Array ? mapNoJsonData(viewType, preData) : null;
      case 'json':
        return mapJsonData(preData);
      case 'dir':
        return mapDir();
      case 'model':
        return preData instanceof Array ? mapNoJsonData(viewType, preData) : null;
      default:
        return null;
    }
  };

  return (
    <div key={selfKey} className="show-table">
      {(area === 'work' && preData instanceof Array && preData.length === 0) ||
      (area === 'work' && typeof preData === 'string' && preData.replace(/[\s\r\n]/g, '').length === 0) ||
      (area === 'work' && preData.data && preData.data.length === 0) ? (
        <div className="no-pre">
          <img
            className={`no-pre-icon ${viewType === 'unSupported' && 'big'}`}
            src={viewType === 'unSupported' ? unSupportImg : emptyImg}
            alt="noData"
          />

          <p className="word">
            {viewType === 'unSupported' ? intl.get('searchGraph.err') : intl.get('workflow.information.no-pre')}
          </p>
        </div>
      ) : (
        switchShowTable(viewType, preData)
      )}
    </div>
  );
};

export default ShowTable;
