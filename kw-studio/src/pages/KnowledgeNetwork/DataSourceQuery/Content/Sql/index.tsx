import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import { message, Divider } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import HOOKS from '@/hooks';
import servicesDataSource from '@/services/dataSource';

import ParamCodeEditor from '@/components/ParamCodeEditor';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import DragLine from '@/components/DragLine';
import ExplainTip from '@/components/ExplainTip';

import MyTable from '../Table';
import { getImage } from '../../assistant';

import empty from '@/assets/images/empty.svg';
import error from '@/assets/images/ImportError.svg';
import './style.less';

const INITHEIGHT = 380;
const MIN = 232;
const Sql = (props: any, ref: any) => {
  const { selectedData, fromDbapi, options } = props;
  const [editorHeight, setEditorHeight] = useState<number>(INITHEIGHT); // 编辑框的高度
  const [showTable, setShowTable] = useState<boolean>(false); // 展示表格
  const [tableData, setTableData] = useState<any[]>([]); // sql查询的数据
  const [tableTitle, setTableTitle] = useState<string[]>([]); // 表头
  const [sql, setSql] = useState<string>(''); // sql语句
  const [loading, setLoading] = useState<boolean>(false); // 加载
  const [errorMsg, setErrorMsg] = useState<string>(''); // 报错缺醒
  const editorRef = useRef<any>();
  const containerRef = useRef<any>();
  const forceUpdate = HOOKS.useForceUpdate();
  const { height: widHeight } = HOOKS.useWindowSize();

  const { sourceImg, dsname } = useMemo(() => {
    const sourceImg = getImage(selectedData?.origin);
    const dsname = selectedData?.origin?.dsname;

    return { sourceImg, dsname };
  }, [selectedData]);

  useImperativeHandle(ref, () => ({ onInsert }));

  useEffect(() => {
    const contianerHeight = containerRef?.current?.offsetHeight - 40;
    const height = showTable ? INITHEIGHT : fromDbapi ? contianerHeight : widHeight - 52 - 39 - 32;
    setEditorHeight(height);
  }, [widHeight, showTable]);

  /** 编辑内容 */
  const onChange = (value: string) => {
    setSql(value);
  };

  /** 查询 */
  const onSqlQuery = async (refresh = false) => {
    if (_.isEmpty(sql)) return;

    try {
      setShowTable(true);
      setLoading(true);
      setErrorMsg('');
      setTableTitle([]);
      const param = { ds_id: selectedData?.origin?.id, sql };
      const { res, ErrorDetails } = await servicesDataSource.dataSourceSql(param);
      if (res?.content) {
        const columns = res.content?.[0];
        const tableData = _.map(res.content?.slice(1), (item, index: number) => {
          const obj: any = { rowId: index };

          _.forEach(item, (value, index) => {
            obj[columns[index]] = value;
          });
          return obj;
        });
        refresh && message.success(intl.get('domainData.refreshSuccess'));

        setTableTitle(columns);
        setTableData(tableData);
      }

      // if (Description) {
      if (ErrorDetails) {
        setTableData([]);
        setErrorMsg(ErrorDetails);
        // setErrorMsg(Description);
      }
      setLoading(false);
    } catch (err) {
      //
    }
  };

  /**
   * 拉伸高度
   */
  const onHeightDrag = (xOffset: number, yOffset: number) => {
    const y = editorHeight + yOffset;
    const max = widHeight - 52 - 48 - 32 - 232;
    const curHeight = y > max ? max : y < MIN ? MIN : y;
    setEditorHeight(curHeight);
  };

  /** 重置 */
  const onReset = () => {
    setEditorHeight(INITHEIGHT - 2);
    setTimeout(() => {
      setEditorHeight(INITHEIGHT);
    }, 10);

    forceUpdate();
  };

  /**
   * 插入
   */
  const onInsert = (value: any) => {
    editorRef?.current?.insertText(value);
  };

  return (
    <div className="dataSourceSqlquery kw-border" ref={containerRef}>
      <div className="kw-w-100 kw-flex-column" style={{ height: editorHeight, position: 'relative' }}>
        <div className="sqlTitle kw-space-between">
          <div className="kw-align-center">
            <img src={sourceImg} style={{ width: 14, height: 14, margin: '0 8px 0 2px' }} />
            <div style={{ maxWidth: 200 }} title={dsname}>
              <span className="kw-ellipsis">{dsname}</span>
            </div>
            <Divider type="vertical" />
            <Format.Button
              disabled={_.isEmpty(sql)}
              tip={intl.get('domainData.run')}
              type="icon"
              onClick={() => onSqlQuery()}
            >
              <IconFont
                type="icon-qidong"
                className={classNames(' kw-c-primary', { 'kw-opacity-35': _.isEmpty(sql) })}
              />
            </Format.Button>
            <Format.Button
              type="icon"
              disabled={_.isEmpty(sql)}
              tip={intl.get('domainData.clear')}
              onClick={() => {
                if (_.isEmpty(sql)) return;
                editorRef.current?.initMark('', []);
              }}
            >
              <IconFont type="icon-quanbuyichu" className={classNames({ 'kw-c-watermark': _.isEmpty(sql) })} />
            </Format.Button>
          </div>
          <div>
            <ExclamationCircleFilled className="kw-c-primary kw-mr-2" />
            <Format.Text className="kw-c-text">{intl.get('domainData.sqlTip')}</Format.Text>
          </div>
        </div>
        <ParamCodeEditor
          className="editor kw-flex-item-full-height"
          ref={editorRef}
          height={`${editorHeight - 40}`}
          onChange={onChange}
          options={options}
        />
        {showTable && <IconFont type="icon-tuozhuai" className="collapseIcon" onClick={onReset} />}
        {showTable && <DragLine className="height-drag-line" style={{ top: editorHeight }} onChange={onHeightDrag} />}
      </div>

      {showTable && (
        <div style={{ height: `calc(100% - ${editorHeight + 5}px)` }}>
          <div className="kw-space-between resultTop">
            <Format.Text className="kw-ellipase">{intl.get('domainData.searchResult')}</Format.Text>
            <span>
              <ExclamationCircleFilled className="kw-c-warning kw-mr-2" />
              <Format.Text className="kw-c-subtext">{intl.get('domainData.showTop500')}</Format.Text>
              <ExplainTip title={intl.get('global.refresh')}>
                <IconFont
                  type="icon-tongyishuaxin"
                  className="kw-ml-5 kw-mr-2 kw-pointer"
                  onClick={() => onSqlQuery(true)}
                />
              </ExplainTip>
              <ExplainTip title={intl.get('global.close')}>
                <IconFont type="icon-guanbiquxiao" className="kw-pointer" onClick={() => setShowTable(false)} />
              </ExplainTip>
            </span>
          </div>
          {_.isEmpty(tableTitle) && !loading ? (
            <div className="emptyBox">
              <img src={errorMsg ? error : empty} />
              <div>{errorMsg || intl.get('domainData.dataEmpty')}</div>
            </div>
          ) : (
            <MyTable className="sqlTable" loading={loading} tableData={tableData} tableTitle={tableTitle} />
          )}
        </div>
      )}
    </div>
  );
};
export default forwardRef(Sql);
