import React, { useEffect, useRef } from 'react';
import ADGraph from '../ADGraph';

export const mock = {
  res: {
    kgqa: {
      data: [
        {
          kg_id: 3,
          answer: '北京车易付科技股份有限公司(车易付)：id是1，short_form是车易付，name是北京车易付科技股份有限公司。',
          subgraph: [
            {
              vertices: Array.from({ length: 3 }, (v, i) => ({
                vid: '0bbc1e75357c4d65fde107ce814f1541' + i,
                tags: ['enterprise'],
                properties: [{ name: 'name', value: '北京车易付科技股份有限公司', alias: 'name', type: 'string' }],
                type: 'vertex',
                color: 'rgba(217,112,76,1)',
                icon: 'empty',
                alias: '企业' + i,
                default_property: { n: 'name', v: '北京车易付科技股份有限公司', a: 'name' }
              })),
              edges: []
            }
          ]
        }
      ]
    }
  }
};

const Demo = () => {
  const container = useRef<HTMLDivElement>(null);
  const graphInstance = useRef<ADGraph | null>(null);
  useEffect(() => {
    graphInstance.current = new ADGraph({
      container: container.current!,
      location: {
        origin: 'http://localhost:81',
        pathname: '/iframe/graph-demo',
        search: '?appid=NdDaCHtAaIttoDGqoH1&analysis_id=369825396db34a2a93679ef997346f5e&kg_id=3'
      }
    });

    // 添加监听事件
    graphInstance.current.on('node:click', (data: any) => {});
    graphInstance.current.on('canvas:click', (data: any) => {});
  }, []);

  const onAdd = () => {
    graphInstance.current?.iframe?.contentWindow?.postMessage(
      { key: 'KWeaver:graph:subgraph', data: mock.res.kgqa.data[0].subgraph },
      '*'
    );
  };

  return (
    <div ref={container}>
      <button onClick={onAdd}>添加数据</button>
    </div>
  );
};
