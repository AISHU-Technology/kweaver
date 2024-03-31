export const mockChat = Array.from({ length: 3 }, (v, i) => {
  return {
    id: i + 1,
    status: 'normal',
    role: i % 2 ? 'human' : 'ai',
    content:
      i % 2
        ? '我想让你充当前端开发专家。我将提供一些关于Js、Node等前端代码问题的具体信息，而你的工作就是想出为我解决问题的策略。这可能包括建议代码、代码逻辑思路策略。我的第一个请求是“我需要能够动态监听某个元素节点距离当前电脑设备屏幕的左上角的X和Y轴，通过拖拽移动位置浏览器窗口和改变大小浏览器窗口。”'
        : '你好，请给我一个软件包或相关文档，我来帮你'.repeat((i + 2) ** i)
  };
});

export const mockPrompt = Array.from({ length: 17 }, (v, i) => {
  return {
    id: i + 1,
    title: '阅读理解备份' + i,
    desc: '利用LLM对证监会对违规企业的处罚通告文件进行抽取，提取其中违规的企业对象、违规行为、违反的政策和条款等信息。',
    prompt:
      '我希望你假定自己是雅思写作考官，根据雅思评判标准，按我给你的雅思考题和对应答案给我评分，并且按照雅思写作评分细则给出打分依据。此外，请给我详细的修改意见并写出满分范文。第一个问题是：It is sometimes argued that too many students go to university, while others claim that a university education should be a universal right.Discuss both sides of the argument and give your own opinion.对于这个问题，我的答案是：In some advanced countries, it is not unusual for more than 50% of young adults to attend college or university. Critics, however, claim that many university courses are worthless and young people would be better off gaining skills in the workplace. In this essay, I will examine both sides of this argument and try to reach a conclusion.There are several reasons why young people today believe they have the right to a university education. First, growing prosperity in many parts of the world has increased the number of families with money to invest in their children’s future. At the same time, falling birthrates mean that one- or two-child families have become common, increasing the level of investment in each child. It is hardly surprising, therefore, that young people are willing to let their families support them until the age of 21 or 22. Furthermore, millions of new jobs have been created in knowledge industries, and these jobs are typically open only to university graduates.However, it often appears that graduates end up in occupations unrelated to their university studies. It is not uncommon for an English literature major to end up working in sales, or an engineering graduate to retrain as a teacher, for example. Some critics have suggested that young people are just delaying their entry into the workplace, rather than developing professional skills.请依次给到我以下内容：具体分数及其评分依据、文章修改意见、满分范文。'
  };
});

export const mockVariables = Array.from({ length: 3 }, (v, i) => {
  const id = i + 1;
  return {
    id,
    name: 'vv'.repeat(id),
    alias: '名称' + id,
    optional: !!(i % 2),
    type: ['text', 'textarea', 'options'][i % 3]
  };
});

export const fetchModelTemplates = async () => {
  const res = {
    total: 2,
    data: [
      {
        prompt_id: '1234567890123455556789',
        prompt_name: '这是一个名称',
        prompt_type: 'chat',
        prompt_desc: '这是一个描述',
        icon: '2',
        model_id: '55465456451223',
        model_name: 'gpt-35-turbo-16k',
        model_para: {
          temperature: '1',
          top_p: '1',
          presence_penaly: '0',
          frequency_penaly: '0',
          max_tokens: '16'
        },
        messages: '你是谁{{var1}}--{{var2}}--{{var3}}--{{var4}}',
        variables: [
          {
            var_name: 'var1',
            field_name: 'xxx',
            optional: false,
            field_type: 'text',
            max_len: 48
          },
          {
            var_name: 'var2',
            field_name: 'xxx',
            optional: true,
            field_type: 'textarea'
          },
          {
            var_name: 'var3',
            field_name: 'xxx',
            optional: true,
            field_type: 'selector',
            options: ['学问', '问题']
          },
          {
            var_name: 'var4',
            field_name: 'xxx',
            optional: true,
            field_type: 'number',
            value_type: 'i',
            range: [0, 10]
          }
        ],
        input: {
          var1: '变量值1',
          var2: '变量值2',
          var3: '变量值3',
          var4: '变量值4'
        },
        result: '这是结果',
        opening_remarks: '你好'
      },
      {
        prompt_id: '1234567890123456789',
        prompt_name: '这是一个名称',
        prompt_type: 'completion',
        model_id: '55465456451223',
        model_name: 'gpt-35-turbo-16k',
        prompt_desc: '这是一个描述',
        icon: '3',
        model_para: {
          temperature: '1',
          top_p: '1',
          presence_penaly: '0',
          frequency_penaly: '0',
          max_tokens: '16'
        },
        messages: 'aaaaaaaaaaaaaaaaa{{var1}}gggggggggggggggg{{var2}}',
        variables: [
          {
            var_name: 'var1',
            field_name: 'xxx',
            optional: false,
            field_type: 'text',
            max_len: 48
          },
          {
            var_name: 'var2',
            field_name: 'xxx',
            optional: true,
            field_type: 'textarea'
          },
          {
            var_name: 'var3',
            field_name: 'xxx',
            optional: true,
            field_type: 'selector',
            options: ['学问', '问题']
          },
          {
            var_name: 'var4',
            field_name: 'xxx',
            optional: true,
            field_type: 'number',
            value_type: 'f',
            range: [0, 10]
          }
        ],
        input: {
          var1: '变量值1',
          var2: '变量值2',
          var3: '变量值3',
          var4: '变量值4'
        },
        result: '这是结果',
        opening_remarks: '你好'
      }
    ]
  };
  return Promise.resolve({ res });
};

export const promptLLMList = async () => {
  const MODEL_LIST = [
    // {
    //   model_id: '1724639729225437184',
    //   key: 'Text-ada-001',
    //   label: 'Text-ada-001',
    //   type: 'openai'
    // },
    {
      model_id: '1724778992067809280',
      key: 'gpt-35-turbo-16k',
      label: 'gpt-35-turbo-16k',
      type: 'openai'
    },
    {
      model_id: '1724778992080392192',
      key: 'text-davinci-002',
      label: 'text-davinci-002',
      type: 'openai'
    },
    {
      model_id: '1724639729225437184',
      key: 'baichuan2',
      label: 'baichuan2',
      type: 'aishu-baichuan'
    }
  ];
  const res = {
    total: MODEL_LIST.length,
    data: MODEL_LIST.map((item, index) => {
      return {
        model_id: item.model_id,
        model_name: item.label,
        model: item.key,
        model_series: item.type,
        model_type: index % 2 ? 'chat' : 'completion',
        model_config: {
          api_base: 'http://10.4.29.18:8301/v1',
          api_type: item.type,
          api_model: item.key,
          api_key: 'aaaaaaaaaaa'
        },
        model_para: {
          temperature: [0, 2, 1],
          top_p: [0, 1, 1],
          presence_penalty: [-2, 2, 0],
          frequency_penalty: [-2, 2, 0],
          max_tokens: [10, 4096 * (index + 1), 16]
        }
      };
    })
  };

  return Promise.resolve({ res });
};

export const promptDetail = (body: any) => {
  const res = {
    prompt_name: '这是一个名称',
    model_name: 'gpt-35-turbo-16k',
    model_id: '1724778992067809280',
    model_para: {
      temperature: 1,
      top_p: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      max_tokens: 16
    },
    messages:
      '我想让你充当前端开发专家。我将提供一些关于Js、Node等前端代码问题的具体信息，而你的工作就是想出为我解决问题的策略。这可能包括建议代码、代码逻辑思路策略。我的第一个请求是“我需要能够动态监听某个元素节点距离当前电脑设备屏幕的左上角的X和Y轴，通过拖拽移动位置浏览器窗口和改变大小浏览器窗口。”',
    variables: [
      {
        var_name: 'var1',
        field_name: 'xxx',
        optional: false,
        field_type: 'text',
        max_len: 48
      },
      {
        var_name: 'var2',
        field_name: 'xxx',
        optional: true,
        field_type: 'textarea'
      }
    ],
    opening_remarks: '你好'
  };

  return Promise.resolve({ res });
};

export const promptManageList = () => ({
  data: [
    {
      create_by: 'test',
      create_time: '2024-01-17 14:30:40',
      prompt_item_id: '172309482305435',
      prompt_item_name: '提示词更换里',
      prompt_item_types: [
        {
          id: '172399082305435',
          name: '分组1'
        }
      ],
      update_by: 'conftest_KnowledgeUser_token_display',
      update_time: '2024-01-23 10:20:09'
    },
    {
      create_by: 'test',
      create_time: '2024-01-18 14:30:40',
      prompt_item_id: '172309482390435',
      prompt_item_name: '提示词',
      prompt_item_types: [
        {
          id: '172399082305785',
          name: '分组2'
        }
      ],
      update_by: 'conftest_KnowledgeUser_token_display',
      update_time: '2024-01-24 10:20:09'
    }
  ],
  searchTotal: 2,
  total: 2
});
