import re
from typing import Iterable, Dict


def clean_and_format_querys(string: str) -> Iterable:
    '''Clean the query column and split.'''
    # TODO 明飞
    pass


def tokenize(string: str, tokenizer, new_column_name) -> Dict:
    '''Tokenize'''
    return {new_column_name: [token for token in tokenizer(string)]}


def segmentation(string: str, segment_tagger, new_column_name) -> Dict:
    '''Segmentation.'''
    seg_result = [word + '/' + flag for word, flag in segment_tagger(string)]
    return {new_column_name: seg_result}


def query_pattern_expend(string: str) -> Iterable:
    '''Expend query to multiple different but similar queries'''
    return [string] * 5


def synonym_expend(string: str) -> Iterable:
    '''Query synonym augmentation expend'''
    # TODO
    pass


def synonym_aug(string: str) -> str:
    '''Synonym augmentation'''
    # TODO
    pass


def wrong_character_substitute_aug(string: str) -> str:
    '''Wrong character substitute augmentation'''
    # TODO
    pass


def character_swap_aug(string: str) -> str:
    '''Character swap augmentation'''
    # TODO
    pass


def character_delete_aug(string: str) -> str:
    '''Character delete augmentation'''
    # TODO
    pass


def calc_logits(string: str, side_input: Dict, new_column_name: str = 'logits'):
    tokenizer = side_input['tokenizer']
    model = side_input['model']
    input = tokenizer(string, return_tensors="pt")
    outputs = model(**input).logits
    return {new_column_name: outputs}


def passage_parse(document, length=500, **kwargs) -> Dict:
    """
    passage parse
    :param document: document path
    :param length: passage length
    :return:
    """
    import os
    passage_dict = {}
    document_type = os.path.splitext(document)[-1]
    if document_type == ".docx":
        passage_dict.update(_docx_parse(document, length))
    elif document_type == ".pdf":
        passage_dict.update(_pdf_parse(document, length))
    elif document_type == ".txt":
        passage_dict.update(_txt_parse(document, length))
    else:
        raise ValueError('''document %s type error, it's not .docx .pdf .txt''' % (document))

    # define result return
    result_dict = {
        'passages': passage_dict[document]
    }
    return result_dict


def _docx_parse(document, length) -> Dict:
    """.docx parse"""

    from docx import Document

    parse_res = {document: []}
    doc = Document(document)

    for index, p in enumerate(doc.paragraphs):
        if len(p.text.strip()) == 0:
            continue
        if p.style.name.startswith("Normal"):
            text = p.text.strip().encode('utf-8', 'ignore').decode('utf-8')
            if len(text) > length:
                text_arr = split_text(text, length)
                for t in text_arr:
                    t.strip()
                    if len(t.strip()) == 0:
                        continue
                    passage = t.strip()
                    parse_res[document].append(passage)
            else:
                passage = text
                parse_res[document].append(passage)

    return parse_res


def _pdf_parse(document, length) -> Dict:
    """.pdf parse"""

    import io
    from pdfminer.pdfpage import PDFPage
    from pdfminer.pdfinterp import PDFResourceManager
    from pdfminer.pdfinterp import PDFPageInterpreter
    from pdfminer.converter import TextConverter

    def extract_content_from_pdf(document):
        """
        This function extracts text from pdf file and return text as string.
        :param pdf_path: path to pdf file.
        :return: text string containing text of pdf.
        """
        resource_manager = PDFResourceManager(caching=False)
        fake_file_handle = io.StringIO(initial_value='\n', newline=None)
        converter = TextConverter(resource_manager, fake_file_handle, codec='utf-8', imagewriter=None)
        page_interpreter = PDFPageInterpreter(resource_manager, converter)

        with open(document, 'rb') as fh:
            for page in PDFPage.get_pages(fh, caching=True, check_extractable=True):
                page_interpreter.process_page(page)

            text = fake_file_handle.getvalue()
        # close open handles
        converter.close()
        fake_file_handle.close()

        return text

    all_content = extract_content_from_pdf(document)
    passage_res = {document: []}

    if all_content:
        for content in all_content.split("\f"):
            content = content.strip().encode('utf-8', 'ignore').decode('utf-8')
            if len(content) > length:
                text_arr = split_text(content, length)
                for text in text_arr:
                    text = text.strip()
                    if len(text) == 0:
                        continue
                    passage = text
                    passage_res[document].append(passage)
            else:
                if len(content) == 0:
                    continue
                passage = content
                passage_res[document].append(passage)

    return passage_res


def _txt_parse(document, length) -> Dict:
    """.txt parse"""

    f = open(document, "r", encoding="utf-8")
    passage_res = {document: []}

    for line in f.readlines():
        line = line.strip().encode('utf-8', 'ignore').decode('utf-8')
        if len(line) > length:
            text_arr = split_text(line, length)
            for text in text_arr:
                text = text.strip()
                if len(text) == 0:
                    continue
                passage = text
                passage_res[document].append(passage)
        else:
            if len(line) == 0:
                continue
            passage = line
            passage_res[document].append(passage)
    f.close()

    return passage_res


def split_text(string: str, length) -> Iterable:
    """Split by length and end with specified punctuation"""
    res = []

    text_arr = re.split(r'([，；。！？ ,;!?])', string)
    text_arr.append("")
    text_arr = ["".join(i) for i in zip(text_arr[0::2], text_arr[1::2])]

    context = ""
    for index, text in enumerate(text_arr):
        context += text
        if len(context) == length:
            res.append(context)
        elif len(context) > length:
            for i in range(0, len(context), length):
                res.append(context[i:i + length])
            context = ""
        elif index == len(text_arr) - 1:
            res.append(context.strip())

    return res


def string_split_expend(string: str, spliter: str) -> Iterable[str]:
    if string is None:
        return []
    else:
        return string.split(spliter)
