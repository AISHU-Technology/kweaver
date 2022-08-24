import React, { memo, useEffect, useRef } from 'react';
import { Button, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import ScrollBar from '@/components/ScrollBar';
import { tipModalFunc } from '@/components/TipModal';
import { switchIcon, wrapperTitle, formatModel } from '@/utils/handleFunction';
import { dataSourceShow } from '../assistFunction';
import trashImg from '@/assets/images/Trash.svg';
import './style.less';

interface SourceListProps {
  data: any[];
  selectedSource: Record<string, any>;
  onAddClick: () => void;
  onRowClick: (rowData: Record<string, any>, index: number) => void;
  onDelete: (newData: any[], item: Record<string, any>, index: number) => void;
}

const SourceList: React.FC<SourceListProps> = props => {
  const { data, selectedSource, onAddClick, onRowClick, onDelete } = props;
  const listScrollRef = useRef<any>(); // 文件列表的滚动条ref

  useEffect(() => {
    listScrollRef.current?.scrollbars?.scrollToBottom();
  }, [data.length]);

  const handleDelete = async (item: Record<string, any>, index: number) => {
    const isOk = await tipModalFunc({
      closable: false,
      title: intl.get('workflow.information.isDeleteTitle'),
      content: intl.get('workflow.information.isDeleteText')
    });

    if (!isOk) return;

    const newData = data.filter((_, i) => i !== index);
    onDelete(newData, item, index);
  };

  return (
    <div className="info-extract-source-list">
      <h2 className="list-title">{intl.get('workflow.information.fileList')}</h2>
      <div className="select-source-btn-box">
        <Button
          className="select-source-btn"
          icon={<IconFont type="icon-Add" style={{ fontSize: 16, transform: 'translateY(1px)' }} />}
          onClick={onAddClick}
        >
          {intl.get('workflow.information.selectDs')}
        </Button>
      </div>
      <div className="ds-item-box">
        <ScrollBar color="rgb(184,184,184)" ref={listScrollRef} isshowx="false">
          <ul>
            {data.map((item, index: number) => {
              const { selfId, name, file_path, file_type, isDsError, errorTip, data_source, extract_model } = item;

              return (
                <li
                  className={classNames('ds-item', {
                    'ds-item-error': isDsError,
                    'ds-item-active': selectedSource.selfId === selfId
                  })}
                  key={selfId}
                  onClick={() => onRowClick(item, index)}
                >
                  <div className="ds-item-icon">
                    {file_type === 'dir'
                      ? switchIcon('dir', '', 34)
                      : data_source.includes('as')
                      ? switchIcon('file', name, 34)
                      : switchIcon('sheet', '', 34)}
                  </div>

                  <div className="ds-item-info">
                    <h3 className="ds-item-title" title={wrapperTitle(name)}>
                      {file_type === 'file' && name.split('.').length > 1 ? (
                        <>
                          <span className="ds-file-name ad-ellipsis">{name.split('.').slice(0, -1).join('')}</span>
                          <span className="ds-file-postfix">.{name.split('.').pop()}</span>
                        </>
                      ) : (
                        <span className="ds-sheet-name ad-ellipsis">{name}</span>
                      )}
                    </h3>
                    <div className="ds-other-info">
                      <div className="source-info">
                        <p className="ds-item-source ad-ellipsis" title={wrapperTitle(file_path)}>
                          {file_path}
                        </p>
                        <div className="tab-box">
                          <p className="ds-item-tag ad-ellipsis" title={dataSourceShow(data_source)}>
                            {dataSourceShow(data_source)}
                          </p>
                          {extract_model && (
                            <p className="ds-item-tag ad-ellipsis" title={formatModel(extract_model)}>
                              {formatModel(extract_model)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ds-right-bar">
                    <span className="trash-btn" onClick={() => handleDelete(item, index)}>
                      <img src={trashImg} alt="nodata" />
                    </span>

                    <div className={isDsError ? 'ds-warming-icon' : 'ds-warming-icon-none'}>
                      <Tooltip title={errorTip}>
                        <ExclamationCircleOutlined style={{ fontSize: 16, color: '#db0040', marginTop: 2 }} />
                      </Tooltip>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollBar>
      </div>
    </div>
  );
};

export default memo(SourceList);
