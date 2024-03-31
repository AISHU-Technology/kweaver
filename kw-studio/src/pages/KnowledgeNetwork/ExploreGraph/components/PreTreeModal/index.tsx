import React, { useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Modal, Select, message, Button } from 'antd';
import UniversalModal from '@/components/UniversalModal';

import HELPER from '@/utils/helper';
import { GRAPH_LAYOUT, GRAPH_CONFIG } from '@/enums';
import PreGraph from './PreGraph';

import './style.less';

const PreTreeModal = (props: any) => {
  const { config = {}, selectedItem } = props;
  const { onOk, onCancel } = props;
  const graph = selectedItem?.graph?.current;

  const [source, setSource] = useState<any>({});
  const onChangeRoot = (key: any) => {
    const model = graph.findById(key).getModel();
    if (!model) return;

    const DATA = _.cloneDeep(selectedItem?.graphData);
    _.forEach(DATA?.nodes, item => {
      delete item?.isRoot;
      delete item?.children;
    });
    const result = model?._sourceData;
    delete result?.children;
    const nodes: any = [{ ...model?._sourceData, isRoot: true }];
    const edges: any = [];
    const existNodeIds = [key];
    const nodeKv = _.keyBy(DATA?.nodes, 'id');
    let getOriginalTree: any = (_data: any) => {
      const getDagre = (father: any) => {
        if (_.isEmpty(father.children)) {
          let hasChildren = false;
          _.forEach(DATA?.edges, item => {
            item.source = item?.relation?.[0];
            item.target = item?.relation?.[2];
            if (item.source === father.id) {
              const target: any = nodeKv?.[item?.target];
              if (_.includes(existNodeIds, target.id)) return;

              existNodeIds.push(target.id);
              hasChildren = true;
              if (father.children) {
                father.children.push(target);
              } else {
                father.children = [target];
              }
              nodes.push(target);
              edges.push(item);
            }
          });
          if (hasChildren) getOriginalTree(_data);
        } else {
          _.forEach(father.children, item => getOriginalTree(item));
        }
      };
      getDagre(_data);
    };
    getOriginalTree(result);

    _.forEach(nodes, item => delete item.children);
    getOriginalTree = null;
    setSource({ nodes, edges });
  };

  const graphShapes = selectedItem?.apis?.getGraphShapes();
  const selectOptions: any = _.map(graphShapes?.nodes, item => {
    const model = item.getModel();
    if (!model) return;
    const showLabels = model._sourceData.showLabels;
    const label = HELPER.getLabelFromShowLabels(showLabels, 1000);
    return { value: model?.id, label: label || model?.default_property?.value || model?.alias || model?.label };
  });

  const onHandleOk = () => {
    if (_.isEmpty(source)) return message.warning(intl.get('exploreGraph.layout.selectStartingEntityTree'));
    source.nodes = _.map(source.nodes, item => ({ ...item, isLock: false }));
    onOk(source);
  };

  const backColor = GRAPH_CONFIG.BACKGROUND_COLOR?.[selectedItem?.graphConfig?.color];
  const backImage = GRAPH_CONFIG.BACKGROUND_IMAGE?.[selectedItem?.graphConfig?.image];

  return (
    <UniversalModal
      className="preTreeModalRoot"
      title={intl.get('exploreGraph.layout.treeLayoutSettings')}
      width={1872}
      zIndex={1052}
      visible={true}
      footer={null}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: onHandleOk }
      ]}
    >
      <div className="header">
        <div className="kw-mb-2">
          <span style={{ color: 'red', marginRight: 4 }}>*</span>
          {intl.get('exploreGraph.layout.selectStartingEntityTree')}
        </div>
        <Select
          showSearch
          filterOption={(input, option: any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          placeholder={intl.get('exploreGraph.layout.selectRootNode')}
          style={{ width: '100%' }}
          options={selectOptions}
          onChange={onChangeRoot}
        />
        <div className="kw-mt-4">{intl.get('exploreGraph.layout.note')}</div>
        <div className="kw-mt-1">{intl.get('exploreGraph.layout.note1')}</div>
        <div className="kw-mt-1">{intl.get('exploreGraph.layout.note2')}</div>
      </div>
      <div
        className="preContent"
        style={{
          ...(backImage ? { backgroundImage: `url(${backImage})` } : {}),
          backgroundColor: backColor
        }}
      >
        {!_.isEmpty(source) && <PreGraph config={config[GRAPH_LAYOUT.TREE]} source={source} />}
      </div>
      {/* <div className="footer">
        <Button className="kw-mr-6" onClick={onCancel}>
          {intl.get('global.cancel')}
        </Button>
        <Button type="primary" onClick={onHandleOk}>
          {intl.get('global.ok')}
        </Button>
      </div> */}
    </UniversalModal>
  );
};

export default PreTreeModal;
