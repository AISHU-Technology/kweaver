# -*- coding: utf-8 -*-
import time
from datetime import datetime

import docx
import re

import joblib

from contracrt_extract.title_classify.classify_run import classify
import json
from collections import OrderedDict
import yaml

from dao.otl_dao import otl_dao


class ExtractElements():
    def __init__(self, configYaml, model_path, stopwords_file, as7_json, version):
        """
        configYaml: 规则配置文件
        model_path: 标题分类模型
        stopwords_file: 停用词
        """
        print("load classify model from %s : " % model_path)
        self.model = joblib.load(model_path)
        self.ruleConfig = readYamlConfig(configYaml)
        self.stopwords_file = stopwords_file
        self.as7_json = as7_json
        self.version = version

    # 获取本地doc、docx文件内容
    def get_content_local(self, file):
        contents = get_docx(file)
        return contents

    # 获取AS文件内容
    def get_content_bydocid(self, docid):
        docid = docid[0]
        contents = []
        code, text = otl_dao.getinfofromas(self.as7_json, ["content"], docid, self.version)
        # p = re.compile("\[bookmark: _DV_[A-Z](\d{0,3})\]|\[bookmark: BKbody\]|\[bookmark: _Toc456551361\]")
        p = re.compile("\[bookmark: [_A-Za-z0-9 ]*\]")
        if code == 200:
            if "content" in text:
                content = text["content"]
                content = re.sub(p, "", content)
                if "\r\n" in content:
                    contents = content.split("\r\n")
                else:
                    # if "\r" in content:
                    #     contents = content.split("\r")
                    if "\n" in content:
                        contents = content.split("\n")
                    else:
                        contents = [content]
        contents = [con for con in contents if len(con.strip()) > 0]
        return contents


    # 章节划分
    def get_chapter_dict(self, content):
        chapter_dict = {}
        if len(content) > 0:
            chapter_dict = classify(content, model=self.model, stopwords_file=self.stopwords_file)
        return chapter_dict

    # 合同名称
    def get_contract_name(self, contents):
        contract_name = ""
        try:
            number_pattern = eval(self.ruleConfig.get("universal").get("contract_number"))
            name_pattern = eval(self.ruleConfig.get("universal").get("contract_name"))
            for i, line in enumerate(contents):
                if re.search(name_pattern, line):
                    names = contents[: i+1]
                    names = [name.replace("商密", "").replace("合同编号：", "").replace("工程编号：", "") for name in names]
                    names = [re.sub(number_pattern, "", str(name)) for name in names]
                    contract_name = "".join(names)
                    break
            return contract_name.replace("\t", "").replace("\n", "").strip()
        except Exception as e:
            print("ERROR: ", e)
            return contract_name

    # 合同编号
    def get_contract_number(self, contents):
        contract_number = ""
        try:
            pattern = eval(self.ruleConfig.get("universal").get("contract_number"))
            for i, line in enumerate(contents):
                if re.search(pattern, line):
                    contract_number = pattern.search(line).group()
                    break
            return contract_number
        except Exception as e:
            print("ERROR: ", e)
            return contract_number

    # 甲方,我方主体
    def get_owner_subject(self, contents):
        owner_subject = ""
        try:
            pattern_owner = eval(self.ruleConfig.get("universal").get("owner_subject"))
            ownerExtraCharacters = self.ruleConfig.get("universal").get("ownerExtraCharacters")
            pattern_subject = eval(self.ruleConfig.get("universal").get("subject"))
            pattern = re.compile("(.*?)([市区路])?(.*?)\d{1,4}(\s)*号|指在|约定")
            for i, line in enumerate(contents):
                if re.search(pattern_subject, line):
                    owner = re.search(pattern_subject, line).group(1).strip()
                    owner_subject = delete_extra_characters(owner, ownerExtraCharacters)
                    return owner_subject.split("\n")[0].split("\\n")[0].strip()
                elif re.search(pattern_owner, line) and not re.search(pattern, line):
                    owner = line.split(":")[-1].split("：")[-1]
                    if owner.strip().startswith("指"):
                        owner = owner.strip()[1:]
                    owner_subject = delete_extra_characters(owner, ownerExtraCharacters)
                    return owner_subject.split("\n")[0].split("\\n")[0].strip()
            return owner_subject.split("\n")[0].split("\\n")[0].strip()
        except Exception as e:
            print("ERROR: ", e)
            return owner_subject

    # 乙方，对方付主体
    def get_other_subject(self, contents):
        other_subjects = []
        try:
            pattern_other = eval(self.ruleConfig.get("universal").get("other_subject"))
            # pattern_company = eval(self.ruleConfig.get("universal").get("company_name"))
            otherrExtraCharacters = self.ruleConfig.get("universal").get("otherExtraCharacters")
            pattern_subject = eval(self.ruleConfig.get("universal").get("subject"))
            pattern = re.compile("(.*?)([市区路])?(.*?)\d{1,4}(\s)*号|指在|约定")
            for i, line in enumerate(contents):
                if re.search(pattern_subject, line):
                    other = re.search(pattern_subject, line).group(2).strip()
                    other = delete_extra_characters(other, otherrExtraCharacters)
                    if other not in other_subjects:
                        other_subjects.append(other.split("\n")[0].split("\\n")[0].strip())

                elif re.search(pattern_other, line) and not re.search(pattern, line):
                    other = line.split(":")[-1].split("：")[-1]
                    if other.strip().startswith("指"):
                        other = other.strip()[1:].split("\n")[0].split("\\n")[0].strip()
                    other = delete_extra_characters(other, otherrExtraCharacters)
                    if other not in other_subjects:
                        other_subjects.append(other.split("\n")[0].split("\\n")[0].strip())
            return other_subjects
        except Exception as e:
            print("ERROR: ", e)
            return other_subjects

    # 币种
    def get_contract_currency(self, contents):
        contract_currency = "人民币"
        contents = "\n".join(contents)
        if "￥" in contents or "人民币" in contents:
            contract_currency = "人民币"
        elif "$" in contents or "美元" in contents:
            contract_currency = "美元"
        return contract_currency

    # 签约日期
    def get_sign_date(self, contents):
        sign_date = None
        try:
            sign_pattern = eval(self.ruleConfig.get("universal").get("sign_date"))
            sign_date_words = eval(self.ruleConfig.get("universal").get("sign_date_words"))

            for line in contents:
                if sign_pattern.search(line):
                    if sign_date_words.search(line):
                        sign_date = sign_pattern.search(line).group()
                        sign_date = sign_date.replace(" ", "").replace("日", "").replace("年", "/").replace("月", "/")
                        if sign_date[-1] == "/":
                            sign_date = sign_date[:-1]
                        if len(sign_date.split("/")) == 2:
                            sign_date = datetime.strptime(sign_date, '%Y/%m')
                        if len(sign_date.split("/")) == 3:
                            sign_date = datetime.strptime(sign_date, '%Y/%m/%d')
                        break
            return sign_date
        except Exception as e:
            print("ERROR: ", e)
            return sign_date

    # 合同金额
    def get_contract_amount(self, contents):
        amount_capitals, amount_lowercases = [], []
        try:
            # 大写金额
            # pattern_capital = eval(self.ruleConfig.get("universal").get("amount_capital"))
            # 小写金额
            pattern_lowercase = eval(self.ruleConfig.get("universal").get("amount_lowercase"))
            pattern = re.compile("以上|以下|高于|低于|工程投资")
            for line in contents:
                if pattern_lowercase.search(line) and not pattern.search(line):
                    amount_lowercases.append(pattern_lowercase.search(line).group().replace("人民币", ""))
                # if pattern_capital.search(line) and not pattern.search(line):
                #     amount_capitals.append(pattern_capital.search(line).group())

            return amount_lowercases
        except Exception as e:
            print("ERROR: ", e)
            return amount_lowercases

    # 金额最大值为合同总金额
    def get_total_amount(self, contents):
        amount = None
        try:
            amount_lowercases = self.get_contract_amount(contents)
            if amount_lowercases:
                # lowercases = [float(num.replace("元", "").replace("圆", "").replace(",", "").replace("，", "")) for num in amount_lowercases]
                lowercases = [num.replace(" ", "").replace("\t", "").replace("元", "").replace("圆", "").replace(",", "").replace("，", "") for num in amount_lowercases]
                # print("lowercases: ", lowercases)
                for k in range(len(lowercases)):
                    if lowercases[k].endswith("万"):
                        lowercases[k] = float(lowercases[k].replace("万", "")) * 10000
                    elif lowercases[k].endswith("亿"):
                        lowercases[k] = float(lowercases[k].replace("亿", "")) * 100000000
                    else:
                        lowercases[k] = float(lowercases[k])
                amount = max(lowercases)

            return amount
        except Exception as e:
            print("ERROR: ", e)
            return amount

    # 银行开户行
    def get_bank(self, contents):
        bank_name = ""
        try:
            pattern = eval(self.ruleConfig.get("universal").get("bank_name"))
            for i, line in enumerate(contents):
                if pattern.search(line.lstrip()):
                    bank_name = line.split(":")[-1].split("：")[-1]
                    break
        except Exception as e:
            print("ERROR: ", e)
            return bank_name
        return bank_name

    # 账户名称
    def get_account_name(self, contents):
        account_name = ""
        try:
            pattern = eval(self.ruleConfig.get("universal").get("account_name"))
            for i, line in enumerate(contents):
                if pattern.search(line.lstrip()):
                    account_name = line.split(":")[-1].split("：")[-1].strip()
                    break
            return account_name
        except Exception as e:
            print("ERROR: ", e)
            return account_name

    # 银行账号
    def get_bank_number(self, contents):
        bank_number = ""
        try:
            pattern = eval(self.ruleConfig.get("universal").get("bank_number"))
            for i, line in enumerate(contents):
                if pattern.search(line.lstrip()):
                    bank_number = line.split(":")[-1].split("：")[-1]
                    break
            return bank_number
        except Exception as e:
            print("ERROR: ", e)
            return bank_number

    # 税率
    def get_tax_rate(self, contents):
        tax_rate = ""
        try:
            pattern = eval(self.ruleConfig.get("universal").get("tax_rate"))
            pattern1 = re.compile("\d{1,2}(\s)*[%％]")
            for i, line in enumerate(contents):
                if pattern.search(line):
                    tax_rate = pattern1.search(line).group()
                    break
            return tax_rate
        except Exception as e:
            print("ERROR: ", e)
            return tax_rate

    # 违约责任
    def get_liability_breach_contract(self, contents, chapter_dict):
        word = "违约"
        liability_breach = []
        try:
            for title, content in chapter_dict.items():
                if word in title:
                    liability_breach = content
            if len(liability_breach) == 0:
                for line in contents:
                    if word in line:
                        liability_breach.append(line)
            return liability_breach
        except Exception as e:
            print("ERROR: ", e)
            return liability_breach

    # 争议解决
    def get_dispute_resolution(self, contents, chapter_dict):
        word = "争议"
        keywords = "解决争议"
        dispute_resolution = []
        try:
            for title, content in chapter_dict.items():
                if word in title:
                    dispute_resolution = content
            if len(dispute_resolution) == 0:
                for line in contents:
                    if keywords in line:
                        dispute_resolution.append(line)
            return dispute_resolution
        except Exception as e:
            print("ERROR: ", e)
            return dispute_resolution

    # 不含税金额
    def amount_without_tax(self, contents):
        lower = None
        # capital = ""
        try:
            pattern1 = eval(self.ruleConfig.get("universal").get("amount_without_tax1"))
            pattern2 = eval(self.ruleConfig.get("universal").get("amount_without_tax2"))
            # pattern_amount_captial = eval(self.ruleConfig.get("universal").get("amount_capital"))
            pattern_amount_lower = eval(self.ruleConfig.get("universal").get("amount_lowercase"))
            for i, line in enumerate(contents):
                line = line.replace(" ", "").strip()
                if pattern1.search(line):
                    sent = pattern1.search(line).group()
                    if pattern_amount_lower.search(sent):
                        lower = pattern_amount_lower.search(sent).group().replace("人民币", "").replace("元", "")
                    # if pattern_amount_captial.search(sent):
                    #     capital = pattern_amount_captial.search(sent).group()
                if pattern2.search(line):
                    pattern2.search(line).group()
                    # if pattern_amount_captial.search(sent1):
                    #     capital = pattern_amount_captial.search(sent1).group()
                    if pattern_amount_lower.search(contents[i + 1]):
                        lower = pattern_amount_lower.search(contents[i + 1]).group().replace("人民币", "").replace("元", "")
            if lower:
                lower = lower.replace("，", "").replace(",", "")
                lower = float(lower)
            return lower
        except Exception as e:
            print("ERROR: ", e)
            return lower

    # 税额
    def get_tax_amount(self, contents):
        tax_amount_lower = None
        # tax_amount_capital = ""
        try:
            # pattern_amount_captial = eval(self.ruleConfig.get("universal").get("amount_capital"))
            pattern_amount_lower = eval(self.ruleConfig.get("universal").get("amount_lowercase"))
            pattern1 = eval(self.ruleConfig.get("universal").get("tax_amount1"))
            pattern2 = eval(self.ruleConfig.get("universal").get("tax_amount2"))

            for i, line in enumerate(contents):
                line = line.replace(" ", "").strip()
                if pattern1.search(line):
                    sent = pattern1.search(line).group()
                    # print(sent)
                    if pattern_amount_lower.search(sent):
                        tax_amount_lower = pattern_amount_lower.search(sent).group().replace("人民币", "").replace("元", "")
                    # if pattern_amount_captial.search(sent):
                    #     tax_amount_capital = pattern_amount_captial.search(sent).group()
                if pattern2.search(line):
                    pattern2.search(line).group()
                    # if pattern_amount_captial.search(sent1):
                    #     tax_amount_capital = pattern_amount_captial.search(sent1).group()
                    if pattern_amount_lower.search(contents[i + 1]):
                        tax_amount_lower = pattern_amount_lower.search(contents[i + 1]).group().replace("人民币", "").replace("元", "")
            if tax_amount_lower:
                tax_amount_lower = tax_amount_lower.replace("，", "").replace(",", "")
                tax_amount_lower = float(tax_amount_lower)
            return tax_amount_lower
        except Exception as e:
            print("ERROR: ", e)
            return tax_amount_lower

    # 付款条款
    def get_paymemnt_term(self):
        pass

    # 提取所有要素
    def get_element(self, docid):
        # contents = self.get_content_local(file)
        contents = self.get_content_bydocid(docid)
        chapter_dict = self.get_chapter_dict(contents)
        elements = {}
        # id
        elements["id"] = str(time.time()).replace(".", "")
        # 合同名称
        elements["name"] = self.get_contract_name(contents)
        # 合同编号
        elements["number"] = self.get_contract_number(contents)
        # 我方主体
        elements["owner_subject"] = self.get_owner_subject(contents)
        # 对方主体
        elements["other_subject"] = self.get_other_subject(contents)
        # 币种
        elements["currency"] = self.get_contract_currency(contents)

        # 签约日期
        elements["sign_date"] = self.get_sign_date(contents)
        # 合同金额
        elements["amount"] = self.get_total_amount(contents)

        # 开户行
        elements["bank"] = self.get_bank(contents)
        # 账户名称
        elements["account_name"] = self.get_account_name(contents)
        # 账户号码
        elements["bank_number"] = self.get_bank_number(contents)
        # 税率
        elements["tax_rate"] = self.get_tax_rate(contents)
        # 违约责任
        # elements["liability_breach_contract"] = self.get_liability_breach_contract(contents, chapter_dict)
        # 争议解决
        # elements["dispute_resolution"] = self.get_dispute_resolution(contents, chapter_dict)
        # 税额
        elements["tax_amount"] = self.get_tax_amount(contents)
        # 不含税金额
        elements["amount_without_tax"] = self.amount_without_tax(contents)

        # 1、提取一级标题，根据一级标题划分内容
        # res = classify(content)
        # temp = {}
        # for t, c in content_dict.items():
        #     temp[t] = "\t".join(c)
        punctuation = """!"#$%&'*+,-./;<=>?@[\]^_`{|}~“”？，！【】、。；’‘……￥·"""
        try:
            chapter = OrderedDict()
            p1 = re.compile("[0-9]+$")
            for k, v in chapter_dict.items():
                if v:
                    if v[-1] in punctuation:
                        v = v[:-1]
                    k = p1.sub("", k)
                    chapter[k] = "\n".join(v)
        except Exception:
            chapter = chapter_dict

        # with open('chapter_dict.json', 'w', encoding="utf-8") as f:
        #     json.dump(chapter, f, ensure_ascii=False, indent=4)
        #     f.write("\n")

        # # 2、根据标题匹配，找出付款条款所在章节
        # payment_content = chapter_match(self.chapter_dict)
        # # print(payment_content)
        # with open('payment_content_dict.json', 'w', encoding="utf-8") as f:
        #     json.dump(payment_content, f, ensure_ascii=False, indent=4)
        #     f.write("\n")
        # #
        # # 3、在付款内容中，根据付款阶段换分小块（每一个阶段一块）
        # payment_stage = paymentStage_match(payment_content)
        #
        # if not payment_stage:
        #     sentences = get_payment_term_no_stage(payment_content)
        #     if sentences:
        #         payment_stage = get_contents_no_stage(sentences[0])
        # # print("payment_stage: ", payment_stage)
        #
        # with open('payment_stage_dict.json', 'w', encoding="utf-8") as f:
        #     json.dump(payment_stage, f, ensure_ascii=False, indent=4)
        #     f.write("\n")
        # # 4、在小块中查找具体的付款金额、付款条件
        # payment_term = get_payment_term(payment_stage, self.contents)
        # # print("payment_term: ", payment_term)
        # with open('payment.json', 'w', encoding="utf-8") as f:
        #     json.dump(payment_term, f, ensure_ascii=False, indent=4)
        #     f.write("\n")
        #
        # elements["payment_clause"] = payment_term
        elements["clause"] = chapter
        return ele_filter(elements)

# 对提取的要素进一步过滤，因为提取非合同文本时，会出现个别不应该有等内容
def ele_filter(elements):
    if len(elements.get("name", "").strip()) == 0:
        res = {}
        res["clause"] = elements.get("clause", {})
        res["owner_subject"] = elements.get("owner_subject", "")
        res["other_subject"] = elements.get("other_subject", [])
        return res
    return elements


# 删除字符串中多余的字符
def delete_extra_characters(line, characters):
    """
    line: 待处理的字符串
    chapters:删除的字符，list
    """
    for char in characters:
        if char in line:
            line = line.replace(char, "")
    return line.strip()

def readYamlConfig(yaml_path, name=None):
    with open(yaml_path, 'r', encoding="utf-8") as f:
        data = yaml.load(f)
    if name:
        return data.get(name)
    else:
        return data

# 获取本地docx
def get_docx(path):
    file = docx.Document(path)
    content = []
    # 输出每一段的内容
    for para in file.paragraphs:
        if len(para.text.strip()) > 0:
            content.append(para.text)
    return content
