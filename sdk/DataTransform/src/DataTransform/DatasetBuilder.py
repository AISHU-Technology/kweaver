from datasets.builder import DatasetBuilder, GeneratorBasedBuilder
from dataclasses import dataclass
import datasets

logger = datasets.logging.get_logger(__name__)

_DESCRIPTION = """Get Data from anyshare"""
_CITATION = """\
@article{2016arXiv160605250R,
       author = {{Rajpurkar}, Pranav and {Zhang}, Jian and {Lopyrev},
                 Konstantin and {Liang}, Percy},
        title = "{SQuAD: 100,000+ Questions for Machine Comprehension of Text}",
      journal = {arXiv e-prints},
         year = 2016,
          eid = {arXiv:1606.05250},
        pages = {arXiv:1606.05250},
archivePrefix = {arXiv},
       eprint = {1606.05250},
}
"""


@dataclass
class AsConfig(datasets.BuilderConfig):
    """BuilderConfig for SQUAD."""
    ip: str = None
    port: str = None
    postfix: str = None
    file_list: list = None


class DataflowDatasetBuilder(DatasetBuilder):
    pass


class AnyShareDatasetBuilder(GeneratorBasedBuilder):
    """SQUAD: The Stanford Question Answering Dataset. Version 1.1."""
    BUILDER_CONFIG_CLASS = AsConfig
    ## 确定参数的默认值，由于没有默认值，所以这里是随意写的
    BUILDER_CONFIGS = [
        AsConfig(
            ip="0",
            port="0",
            postfix="all",
            file_list=[]

        ),
    ]

    ## 确定dataset的feature
    def _info(self):
        return datasets.DatasetInfo(
            description=_DESCRIPTION,
            features=datasets.Features(
                {
                    "gensid": datasets.Value("string"),
                    "content": datasets.Value("string"),
                }
            ),
            # No default supervised_keys (as we have to pass both question
            # and context as input).
            supervised_keys=None,
            # homepage="https://rajpurkar.github.io/SQuAD-explorer/",
            citation=_CITATION,
            # task_templates=[
            #     QuestionAnsweringExtractive(
            #         question_column="question", context_column="context", answers_column="answers"
            #     )
            # ],
        )

    def _split_generators(self, dl_manager):
        # downloaded_files = dl_manager.download_and_extract(_URLS)

        # return [
        #     datasets.SplitGenerator(name=datasets.Split.TRAIN, gen_kwargs={"filepath": downloaded_files["train"]}),
        #     datasets.SplitGenerator(name=datasets.Split.VALIDATION, gen_kwargs={"filepath": downloaded_files["dev"]}),
        # ]
        return [
            datasets.SplitGenerator(name=datasets.Split.ALL)
            # datasets.SplitGenerator(name=datasets.Split.VALIDATION),
        ]

    def _generate_examples(self):
        from DataTransform.Utils import Get_AS_DATA
        """This function returns the examples in the raw (text) form."""
        logger.info("generating examples")
        key = 0
        retry = 10
        wrong = False
        import time
        ## AS数据获取类实例化
        As_Data = Get_AS_DATA(self.config.ip, self.config.port, self.config.file_list, self.config.postfix)
        # ## 客户端凭证注册（AS提供的API）
        client_id, client_secret = As_Data.get_client_id()
        # ## 通过client_id 和client_secret 获取token（AS提供的API）
        acc_token = As_Data.get_acc_token(client_id, client_secret)
        start_time = time.time()
        # ## 通过入口文件夹的gensid获取所有的文件夹下所有的文件的gensid
        newtable_list = As_Data.get_gens_list(acc_token)
        # import ast
        # with open("newtable_list.txt","r",encoding="utf-8") as f:
        # #     f.write(str(newtable_list))
        #     newtable_list = ast.literal_eval(f.read())
        ## 遍历文件的gensid获取数据
        for gens in newtable_list:
            ## acctoken 1个小时会过期
            ## 防止acctoken过期 随用随取
            end_time = time.time()
            if end_time - start_time >= 55 * 60:
                acc_token = As_Data.get_acc_token(client_id, client_secret)
                start_time = time.time()
            ## 防止 有些gensid获取不到content，所以设置重试
            ## 获取成功则返回，获取失败则重试，重试10次后还是失败则扔掉这个数据
            for i in range(retry):
                try:
                    ## 获取文件相关信息
                    gensid, content = As_Data.get_text(gens, acc_token)
                    wrong = False
                    yield key, {
                        "gensid": gensid,
                        "content": content,
                    }
                    key += 1
                    break
                except Exception as e:
                    wrong = True
                    continue
            if wrong == True:
                pass
