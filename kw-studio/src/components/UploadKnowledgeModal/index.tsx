/**
 * 上传知识网络弹窗
 */

import React, { memo, useState, useEffect, useRef } from 'react';
import { ConfigProvider, Modal, Button, Form, Select, Checkbox, message, Empty, Input, Tooltip } from 'antd';
import { LoadingOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import VirtualList from 'rc-virtual-list';
import SearchInput from '@/components/SearchInput';
import IconFont from '@/components/IconFont';
import serviceUploadKnowledge from '@/services/uploadKnowledge';
import serverKnowledgeNetwork from '@/services/knowledgeNetwork';
import kongImg from '@/assets/images/kong.svg';
import noResult from '@/assets/images/noResult.svg';
import './style.less';
import _ from 'lodash';

export interface UploadKnowledgeModalProps {
  kgData: Record<string, any>; // 上传的知识网络
  visible: boolean; // 弹窗是否可见
  onOk?: Function; // 点击确定后的回调
  onCancel: Function; // 关闭弹窗
}

const FormItem = Form.Item;
const { Option } = Select;
const MAX_SIZE = 3000; // 一次性拿取数据
const defaultIpParams = { page: 1, keyword: '', order: 'created', reverse: 1 }; // 获取所有ip地址
const defaultGraphParams = { page: 1, order: 'desc', rule: 'update', filter: 'upload' }; // 获取所有图谱
let requestId = 0; // 标记网络请求

const ModalContent: React.FC<UploadKnowledgeModalProps & { graphData: any[]; setGraphData: Function }> = ({
  kgData,
  onOk,
  onCancel,
  graphData,
  setGraphData
}) => {
  const listRef = useRef<any>(); // 图谱列表
  const searchInputRef = useRef<any>(); // 搜索框
  const [form] = Form.useForm();
  const [ipData, setIpData] = useState<any[]>([]); // ip地址列表
  const [selectedTarget, setSelectedTarget] = useState<any>({}); // 选择的目标地址数据
  const [selectedGraph, setSelectedGraph] = useState<any[]>([]); // 选择的图谱
  // const [ellipsisDesc, setEllipsisDesc] = useState(''); // 描述折叠时显示的文本
  const [descBtnStatus, setDescBtnStatus] = useState<null | { isOpen: boolean }>(null); // 描述多行展开按钮
  const [ipLoading, setIpLoading] = useState(false); // 加载ip地址
  const [graphLoading, setGraphLoading] = useState(false); // 加载图谱
  const [virtualHeight, setVirtualHeight] = useState(0); // 虚拟列表高度
  const [keyword, setKeyword] = useState(''); // 搜索关键字

  const ERROR_CODE: Record<string, string> = {
    'DataIO.Common.KgNotFoundException': intl.get('uploadService.graphNotFount'),
    'DataIO.Common.UploadUnsupportedException': intl.get('uploadService.abnormalGraph')
  };

  useEffect(() => {
    getIpList();
    initDesc(kgData.knw_description);
  }, [kgData]);

  // 描述展开收起时重新设置虚拟列表高度
  useEffect(() => {
    setVirtualHeight(listRef.current?.clientHeight);
  }, [descBtnStatus]);

  /**
   * 初始化描述
   */
  const initDesc = (desc = '') => {
    const expectLen = countText(desc);

    // 原样展示
    if (expectLen === desc.length) return;

    // setEllipsisDesc(desc.slice(0, expectLen));
    setDescBtnStatus({ isOpen: false });
  };

  /**
   * 计算描述是否过长, 内容过长则截断
   * @param text 描述文字
   * @returns 截断的索引
   */
  const countText = (text = '') => {
    let curText = text;
    const node = document.createElement('p');

    node.style.cssText = 'position: absolute;visibility: hidden; width: 480px;font-size: 14px;line-height: 22px;';
    node.innerHTML = text;
    document.body.appendChild(node);

    // 两行足够显示
    if (node.clientHeight / 22 <= 2) {
      node.remove();

      return text.length;
    }

    // 逐个减少字数计算
    while (node.clientHeight / 22 > 2) {
      curText = curText.slice(0, -1);
      node.innerHTML = `${curText}...<span>${intl.get('global.expand')}</span>`;
    }

    node.remove();

    return curText.length;
  };

  /**
   * 获取所有地址数据
   */
  const getIpList: Function = async (size: number = MAX_SIZE) => {
    setIpLoading(true);

    const params = { ...defaultIpParams, size };
    const { res }: any = (await serviceUploadKnowledge.uploadServiceGet(params)) || {};

    if (res) {
      const { data, total } = res;

      if (total > size) {
        return getIpList(total);
      }

      setIpData(data);

      // 只有一个地址时直接选中
      if (total === 1) {
        setSelectedTarget(data[0]);
        form.setFieldsValue({ ip: data[0].ip });
      }
    }
    setIpLoading(false);
  };

  /**
   * 获取图谱
   * @param name 搜索名称
   * @param size 返回数量
   */
  const getGraph: Function = async (name: '', size = MAX_SIZE) => {
    setGraphLoading(true);
    setKeyword(name);

    const signId = ++requestId;
    const params = { ...defaultGraphParams, knw_id: kgData.id, size, name };
    const { res } = (await serverKnowledgeNetwork.graphGetByKnw(params)) || {};

    if (signId < requestId) return;

    if (res) {
      if (res.count > size) {
        return getGraph(name, res.count);
      }

      setGraphData(res.df);
    }

    setGraphLoading(false);
  };

  // 选择上传地址回调
  const onIpChange = (value: string, option: any) => {
    setSelectedTarget(option.data);
  };

  /**
   * 选择图谱
   * @param graph 图谱
   */
  const onCheck = (graph: any) => {
    selectedGraph.includes(graph.kgconfid)
      ? setSelectedGraph(pre => pre.filter(id => id !== graph.kgconfid))
      : setSelectedGraph(pre => [...pre, graph.kgconfid]);
  };

  /**
   * 全选
   * @param e
   */
  const onCheckAll = (e: any) => {
    const { checked } = e.target;

    checked ? setSelectedGraph(graphData.map(item => item.kgconfid)) : setSelectedGraph([]);
  };

  // 上传
  const onUpload = async (values: any) => {
    if (!selectedGraph.length) {
      message.error(intl.get('uploadService.tipSelectGraph'));

      return;
    }

    const { res, Description, ErrorCode } =
      (await serviceUploadKnowledge.uploadKnowledge({
        knId: kgData.id,
        ip: values.ip,
        token: selectedTarget.token,
        graphIds: selectedGraph,
        identifyId: kgData.identify_id
      })) || {};

    if (res) {
      message.success(intl.get('uploadService.uploadingTip'));
      onCancel(false);
      onOk?.();
    }
    if (ErrorCode) {
      ERROR_CODE[ErrorCode] ? message.error(ERROR_CODE[ErrorCode]) : message.error(Description);
    }
  };

  // 点击上传
  const onHandleOk = (e: React.MouseEvent) => {
    form
      .validateFields()
      .then((values: any) => {
        onUpload(values);
      })
      .catch((err: any) => {});
  };

  const onSearchChange = (e: any) => {
    getGraph(e?.target?.value);
  };

  return (
    <div>
      <div className="m-title">
        <h1>{intl.get('uploadService.uploadKg')}</h1>
      </div>

      <div className="main">
        {/* 地址选择 */}
        <div className="addr-selector">
          <Form layout="vertical" form={form}>
            {/* ||  */}
            <FormItem label={intl.get('graphList.tablename')}>
              <Select
                labelInValue
                value={{
                  label: (
                    <div className="kw-ellipsis" title={kgData?.knw_name}>
                      {kgData?.knw_name}
                    </div>
                  )
                }}
                disabled
              ></Select>
            </FormItem>
            <div className="form-row">
              <FormItem
                label={<span className="form-label">{intl.get('uploadService.targetIp')}</span>}
                name="ip"
                validateFirst={true}
                rules={[
                  {
                    required: true,
                    message: intl.get('uploadService.tiSelectIp')
                  }
                ]}
              >
                <Select
                  placeholder={intl.get('uploadService.tiSelectIp')}
                  onChange={onIpChange}
                  getPopupContainer={triggerNode => triggerNode.parentElement}
                  notFoundContent={
                    ipLoading ? (
                      <div className="loading-wrap">
                        <LoadingOutlined className="loading-icon" />
                      </div>
                    ) : (
                      <div className="select-empty">
                        <Empty image={kongImg} description={intl.get('global.noData')} />
                      </div>
                    )
                  }
                >
                  {ipData.map((item: any) => (
                    <Option key={item.id} value={item.ip} data={item}>
                      {item.ip}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </div>
          </Form>
        </div>

        <div className="flex-box">
          {/* 图谱 */}
          <div className="g-box">
            <div>
              <span className="kw-c-error">*</span>
              {intl.get('uploadService.selectKnow')}
              <Tooltip
                getPopupContainer={triggerNode => triggerNode!}
                placement="top"
                title={intl.get('uploadService.selectKnowTip')}
              >
                <QuestionCircleOutlined className="kw-c-watermark kw-ml-2 kw-pointer" />
              </Tooltip>
            </div>
            <SearchInput
              ref={searchInputRef}
              className="s-input"
              placeholder={intl.get('uploadService.inputGraph')}
              onChange={onSearchChange}
              debounce
            />

            <Checkbox
              checked={!!graphData.length && selectedGraph.length === graphData.length}
              indeterminate={!!selectedGraph.length && selectedGraph.length < graphData.length}
              disabled={!graphData.length}
              onChange={onCheckAll}
            >
              {intl.get('global.all')}
            </Checkbox>

            <div className="scroll-wrap" ref={listRef}>
              {graphData.length ? (
                <VirtualList className="v-list" data={graphData} itemKey="id" height={virtualHeight} itemHeight={48}>
                  {(item, index) => {
                    const { kgconfid, name, kgDesc } = item;

                    return (
                      <div key={kgconfid} className="li-item kw-align-center">
                        <div className="g-check">
                          <Checkbox checked={selectedGraph.includes(kgconfid)} onChange={() => onCheck(item)} />
                        </div>

                        <div className="kw-align-center">
                          <div className="img kw-center kw-border">
                            <IconFont type="icon-zhishiwangluo" className="icon"></IconFont>
                          </div>
                          <div className="kw-ml-3">
                            <div className="kw-ellipsis kw-c-text" style={{ width: 500 }} title={name}>
                              {name}
                            </div>
                            <div className="kw-ellipsis kw-c-subtext" style={{ width: 500 }} title={kgDesc}>
                              {kgDesc || '- -'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </VirtualList>
              ) : (
                <>
                  {!graphLoading && (
                    <div className="nodata-box">
                      <img className="nodata-img" src={keyword ? noResult : kongImg} alt="no data" />
                      <p className="nodata-text">
                        {keyword ? intl.get('global.noResult2') : intl.get('global.noData')}
                      </p>
                    </div>
                  )}
                </>
              )}

              {graphLoading && (
                <div className="g-loading">
                  <LoadingOutlined className="l-icon" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="m-footer">
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button className="ant-btn-default cancel-btn" onClick={() => onCancel(false)}>
            {intl.get('global.cancel')}
          </Button>
          <Button type="primary" className="create-btn" onClick={onHandleOk}>
            {intl.get('uploadService.upload')}
          </Button>
        </ConfigProvider>
      </div>
    </div>
  );
};

const UploadKnowledgeModal: React.FC<UploadKnowledgeModalProps> = props => {
  const { visible, onCancel, kgData } = props;
  const [graphData, setGraphData] = useState<any[]>([]); // 全部图谱
  const [selfVisible, setSelfVisible] = useState(false); // 内部弹窗控制

  // 先判断图谱数量, 图谱为空不打开弹窗
  useEffect(() => {
    if (!visible || !kgData.id) {
      !visible && setSelfVisible(false);

      return;
    }

    const init: Function = async (size = MAX_SIZE) => {
      const params = { ...defaultGraphParams, knw_id: kgData.id, size, name: '' };
      const { res } = (await serverKnowledgeNetwork.graphGetByKnw(params)) || {};

      if (res) {
        if (res.count > size) {
          return init(res.count);
        }

        if (res.df.length) {
          setGraphData(res.df);
          setSelfVisible(true);

          return;
        }
      }

      message.error(intl.get('uploadService.unSupport'));
      onCancel(false);
    };

    init();
  }, [visible, kgData]);

  return (
    <Modal
      className="upload-knowledge-network-modal"
      visible={visible && selfVisible}
      focusTriggerAfterClose={false}
      destroyOnClose
      maskClosable={false}
      onCancel={() => onCancel(false)}
      width={640}
      footer={null}
    >
      <ModalContent {...props} graphData={graphData} setGraphData={setGraphData} />
    </Modal>
  );
};

export default memo(UploadKnowledgeModal);
