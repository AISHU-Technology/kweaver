import { fuzzyMatch } from '@/utils/handleFunction';

export const promptProjectList = async (body: { page: number; size: number; name: string }) => {
  const { page, name, size } = body;
  const total = Array.from({ length: 9 }, (v, i) => {
    const id = String(i + 1);
    return {
      prompt_item_id: id,
      prompt_item_name: '提示词项目' + id,
      prompt_item_types: Array.from({ length: 5 }, (__, j) => ({ id: id + j, name: '分类' + id + j })),
      create_by: '创建人' + id,
      update_by: '修改人' + id,
      create_time: +new Date() - 1000 * 60 * i,
      update_time: +new Date() - 1000 * 60 * i
    };
  });

  const matchData = name ? total.filter(d => fuzzyMatch(name, d.prompt_item_name)) : total;

  return Promise.resolve({
    res: {
      total: total.length,
      searchTotal: matchData.length,
      data: matchData.slice((page - 1) * size, page * size)
    }
  });
};

export const getPromptList = async (body: any) => {
  const { page, name, size = 10 } = body;
  const total = Array.from({ length: 55 }, (v, i) => {
    const id = String(i + 1);
    return {
      prompt_item_id: 'project' + id,
      prompt_item_type_id: 'category' + id,
      prompt_id: id,
      icon: i % 10,
      prompt_type: i % 2 ? 'chat' : 'completion',
      prompt_name: '提示词名称' + id,
      prompt_desc: '描述描述我随手一打就是十个字我随手一打就是十个字我随手一打就是十个字我随手一打就是十个字' + id,
      prompt_deploy: !!(i % 2),
      model_series: i % 2 ? 'openai' : 'aishu-baichuan',
      model_name: 'aaaaaaaaaaaaaa',
      create_by: '创建人' + id,
      update_by: '修改人' + id,
      create_time: +new Date() - 1000 * 60 * i,
      update_time: +new Date() - 1000 * 60 * i
    };
  });

  const matchData = name ? total.filter(d => fuzzyMatch(name, d.prompt_name)) : total;

  return Promise.resolve({
    res: {
      total: matchData.length,
      data: matchData.slice((page - 1) * size, page * size)
    }
  });
};
