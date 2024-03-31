import { fuzzyMatch } from '@/utils/handleFunction';

export const llmModelList = async (body: {
  page: number;
  size: number;
  order: 'desc' | 'asc' | string;
  name: string;
  rule: string;
  series: string;
}) => {
  const { page, name, size = 10 } = body;
  const total = Array.from({ length: 55 }, (v, i) => {
    const id = String(i + 1);
    return {
      model_id: id,
      model_series: i % 2 ? 'openai' : 'aishu-baichuan',
      model_name: '模型名称' + id,
      model: (i % 2 ? 'OpenAI' : 'aishu-baichuan') + '啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊',
      model_api: '',
      create_by: '创建人' + id,
      update_by: '修改人' + id,
      create_time: +new Date() - 1000 * 60 * i,
      update_time: +new Date() - 1000 * 60 * i
    };
  });

  const matchData = name ? total.filter(d => fuzzyMatch(name, d.model_name)) : total;

  return Promise.resolve({
    res: {
      total: matchData.length,
      data: matchData.slice((page - 1) * size, page * size)
    }
  });
};
