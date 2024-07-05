import { useEffect, useMemo, useState } from 'react';
import { type ColumnOriginType, type ColumnsStateType } from '../useAntdResizableHeader';
import { useGetDataIndexColumns } from './useGetDataIndexColumns';
import { useMemoizedFn } from './useMemoizedFn';
import { isString } from '.';

interface LocalColumnsProp<T> {
  columnsState?: ColumnsStateType;
  resizableColumns?: T[];
  columns?: T[];
}

function mergeColumns<T extends any[]>(src: T, target: T, mergeKey: string): T {
  const res = src;

  if (Array.isArray(res) && Array.isArray(target)) {
    res.forEach((t, i: number) => {
      if (t?.children) {
        mergeColumns(t.children, target[i]?.children, mergeKey);
      } else {
        res[i][mergeKey] = target.find(x => x.dataIndex === res[i].dataIndex)?.[mergeKey] || res[i][mergeKey];
      }
    });
  }

  return res;
}

function useLocalColumns<T extends ColumnOriginType<T>>({
  columnsState,
  resizableColumns,
  columns
}: LocalColumnsProp<T>) {
  const columnsProp = useGetDataIndexColumns(columns);

  const initLocalColumns = useMemoizedFn(() => {
    const { persistenceType, persistenceKey } = columnsState || {};

    if (!persistenceKey || !persistenceType) {
      return columnsProp;
    }
    if (typeof window === 'undefined') return columnsProp;

    const storage = window[persistenceType];

    try {
      const localResizableColumns = JSON.parse(storage?.getItem(persistenceKey) || '{}')?.resizableColumns;
      return mergeColumns<T[]>(columnsProp || [], localResizableColumns, 'width');
    } catch (error) {
      console.error(error);
    }
  });

  const [localColumns, setLocalColumns] = useState<T[] | undefined>(initLocalColumns);

  useEffect(() => {
    setLocalColumns(initLocalColumns());
  }, [columnsProp]);

  useEffect(() => {
    const { persistenceType, persistenceKey } = columnsState || {};

    if (!persistenceKey || !persistenceType || !resizableColumns?.length) {
      return;
    }
    if (typeof window === 'undefined') return;
    const storage = window[persistenceType];

    try {
      storage.setItem(
        persistenceKey,
        JSON.stringify({
          ...JSON.parse(storage?.getItem(persistenceKey) || '{}'),
          resizableColumns: resizableColumns.map(col => {
            const localCol: ColumnOriginType<T> = {
              dataIndex: col.dataIndex,
              key: col.key,
              width: col.width,
              children: col.children
            };

            if (isString(col.title)) {
              localCol.title = col.title;
            }
            return localCol;
          })
        })
      );
    } catch (error) {
      console.error(error);
    }
  }, [resizableColumns]);

  const resetLocalColumns = useMemoizedFn(() => {
    setLocalColumns([...(columnsProp || [])]);
  });

  return {
    localColumns: useMemo(() => localColumns, [localColumns]),
    resetLocalColumns
  };
}

export { useLocalColumns };
