import React, { useEffect, useMemo, useState } from 'react';
import { Select } from 'antd';
import { Edge, Graph } from '@antv/x6';
import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';
import intl from 'react-intl-universal';

interface X6LabelSelectProps {
  edge?: Edge.Metadata;
  graphX6?: Graph;
  onChange?: (value: string, edge?: Edge<Edge.Properties>, graph?: Graph) => void;
  value?: string;
  disabled?: boolean;
}

const X6LabelSelect: React.FC<X6LabelSelectProps> = ({ value, edge, graphX6, onChange, disabled }) => {
  const [selectValue, setSelectValue] = useState('等于');
  const [open, setOpen] = useState(false);
  const prefixLocale = 'workflow.knowledge';
  useDeepCompareEffect(() => {
    const labelValue = edge?.labelValue ?? '等于';
    setSelectValue(labelValue);
    const targetEdge = graphX6?.getEdges().find(item => item.toJSON().id === edge?.id);
    const targetEdgeData = targetEdge?.toJSON();
    if (targetEdgeData?.target?.cell) {
      onChange?.(labelValue, targetEdge, graphX6);
    }
  }, [edge]);

  const relationOptions = useMemo(() => {
    if (edge?.targetToDataFileEdge) {
      return [
        {
          label: intl.get(`${prefixLocale}.equal`),
          value: '等于'
        },
        {
          label: intl.get(`${prefixLocale}.Included`),
          value: '被包含'
        }
      ];
    }
    return [
      {
        label: intl.get(`${prefixLocale}.equal`),
        value: '等于'
      },
      {
        label: intl.get(`${prefixLocale}.contain`),
        value: '包含'
      },
      {
        label: intl.get(`${prefixLocale}.Included`),
        value: '被包含'
      }
    ];
  }, [edge]);
  return (
    <Select
      value={selectValue}
      onChange={value => {
        const targetEdge = graphX6?.getEdges().find(item => item.toJSON().id === edge?.id);
        setSelectValue(value);
        setOpen(false);
        onChange?.(value, targetEdge, graphX6);
      }}
      options={relationOptions}
      size="small"
      open={open}
      onFocus={() => {
        setOpen(true);
      }}
      onBlur={() => {
        setOpen(false);
      }}
      dropdownMatchSelectWidth={false}
      disabled={disabled}
    />
  );
};

export default X6LabelSelect;
