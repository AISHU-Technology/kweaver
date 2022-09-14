# -*- coding: utf-8 -*-
import io

from pdfminer.pdfpage import PDFPage, PDFParser, PDFTextExtractionNotAllowed
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfinterp import PDFResourceManager
from pdfminer.pdfinterp import PDFPageInterpreter
from pdfminer.converter import PDFPageAggregator, TextConverter
from pdfminer.layout import *
import pdfminer

from ARModel.utils.util import *


class PDFParse():
    def __init__(self, db):
        self.db = db

    def parse(self, pdf_path, length):
        all_content = self.extract_text_from_pdf(pdf_path)
        file_name = pdf_path.split("data/docs/dev/")[-1]  # 文档名

        if all_content:
            # 分页符分割
            for content in all_content.split("\f"):
                head = ""

                # 按规则切分出标题
                text_arrs = split_text_by_header(content)

                for line in text_arrs:
                    res = dict()
                    line = line.strip()

                    if parse_head(line):
                        head = line
                        continue

                    # 长度截取
                    if len(line) > length:
                        text_arr = split_text(line, length)
                        for text in text_arr:
                            text = text.strip()
                            if len(text) == 0:
                                continue

                            res["text"] = text
                            res["head"] = head
                            res["name"] = file_name
                            self.db.insert(res)
                            res = {}
                    else:
                        if len(line) == 0:
                            continue

                        res["text"] = line
                        res["head"] = head
                        res["name"] = file_name
                        self.db.insert(res)

    def extract_text_from_pdf(self, pdf_path):
        """
        This function extracts text from pdf file and return text as string.
        :param pdf_path: path to pdf file.
        :return: text string containing text of pdf.
        """
        resource_manager = PDFResourceManager(caching=False)
        fake_file_handle = io.StringIO(initial_value='\n', newline=None)
        # 创建一个PDF设备对象
        # laparams = LAParams()
        # converter = TextConverter(resource_manager, fake_file_handle, codec='utf-8', laparams=laparams, imagewriter=None)
        converter = TextConverter(resource_manager, fake_file_handle, codec='utf-8', imagewriter=None)
        page_interpreter = PDFPageInterpreter(resource_manager, converter)

        with open(pdf_path, 'rb') as fh:
            for page in PDFPage.get_pages(fh, caching=True, check_extractable=True):
                page_interpreter.process_page(page)

            text = fake_file_handle.getvalue()

        # close open handles
        converter.close()
        fake_file_handle.close()

        return text

    # def createPDFDoc(self, pdf_path):
    #     fp = open(pdf_path, 'rb')
    #     parser = PDFParser(fp)
    #     document = PDFDocument(parser, password='')
    #     # Check if the document allows text extraction. If not, abort.
    #     if not document.is_extractable:
    #         raise ("Not extractable")
    #     else:
    #         return document
    #
    # def createDeviceInterpreter(self,):
    #     rsrcmgr = PDFResourceManager()
    #     laparams = LAParams()
    #     device = PDFPageAggregator(rsrcmgr, laparams=laparams)
    #     interpreter = PDFPageInterpreter(rsrcmgr, device)
    #     return device, interpreter
    #
    # def parse_obj(self, objs):
    #     for obj in objs:
    #         if isinstance(obj, pdfminer.layout.LTTextBox):
    #             for o in obj._objs:
    #                 if isinstance(o, pdfminer.layout.LTTextLine):
    #                     text = o.get_text()
    #                     if text.strip():
    #                         for c in o._objs:
    #                             if isinstance(c, pdfminer.layout.LTChar):
    #                                 print ("fontname %s" % c.fontname)
    #                                 print ("fontname %s" % c.size)
    #         # if it's a container, recurse
    #         elif isinstance(obj, pdfminer.layout.LTFigure):
    #             self.parse_obj(obj._objs)
    #         else:
    #             pass
    #
    # def parse11(self, pdf_path):
    #     document = self.createPDFDoc(pdf_path)
    #     device, interpreter = self.createDeviceInterpreter()
    #     pages = PDFPage.create_pages(document)
    #     for page in pages:
    #         interpreter.process_page(page)
    #         layout = device.get_result()
    #
    #         self.parse_obj(layout._objs)