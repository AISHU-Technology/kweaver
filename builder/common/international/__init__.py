import json
import os

from babel import negotiate_locale
from flask import request
from flask_babel import Babel
from flask_babel import gettext as _l

babel = Babel()

# 项目根路径
GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH', os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
# babel翻译的目录，默认是translations。这里可以修改成international
BABEL_TRANSLATION_DIRECTORIES = 'common/international'
BABEL_TRANSLATION_DIRECTORIES = GBUILDER_ROOT_PATH + '/' + BABEL_TRANSLATION_DIRECTORIES
# babel LC_MESSAGES下面的messages.mo文件名的配置
BABEL_DOMAIN = 'messages'
# babel默认的语言类型
BABEL_DEFAULT_LOCALE = 'en'
# babel 支持的语言类型
BABEL_LANS = ['en', 'zh']


@babel.localeselector
def get_locale():
    preferred = [x.replace('-', '_') for x in request.accept_languages.values()]
    return negotiate_locale(preferred, BABEL_LANS)


def pot_path():
    return "{0}/{1}.pot".format(BABEL_TRANSLATION_DIRECTORIES, BABEL_DOMAIN)

def po_path(locale):
    return "{}/{}/LC_MESSAGES/{}.po".format(BABEL_TRANSLATION_DIRECTORIES, locale, BABEL_DOMAIN)

def cfg_path():
    return "{}/babel.cfg".format(GBUILDER_ROOT_PATH)

"""
提取项目中所有需要翻译的文本，生成模板文件
"""
def extra_command():
    # pybabel extract -F babel.cfg -k _l -o messages.pot .
    return 'pybabel extract -F {} -k _l -o {} {}/.'.format(cfg_path(), pot_path(), GBUILDER_ROOT_PATH)
"""
初始化翻译语言文件夹，参数是语言缩写
"""
def init_command(locale):
    # pybabel init -i messages.pot -d app/translations -l zh
    return 'pybabel init -i {} -d {} -l {}'.format(pot_path(), BABEL_TRANSLATION_DIRECTORIES, locale)
"""
从指定的模板中更新msgid到po文件里面
"""
def update_command():
    return 'pybabel update -i {}/{}.pot -d {}'.format(BABEL_TRANSLATION_DIRECTORIES, BABEL_DOMAIN,
                                                      BABEL_TRANSLATION_DIRECTORIES)
"""
将所有语言的翻译编译下，编译后的文件查找更快
"""
def compile_command():
    return f'pybabel  compile -d {BABEL_TRANSLATION_DIRECTORIES} -f'


# 翻译字典数据
def tran_dict(d):
    # 如果是一个字符串且不为空，直接返回翻译
    if isinstance(d, str) and d:
        return _l(d)
    # 如果是一个字典
    if isinstance(d, dict):
        newDict = {}
        for key, value in d.items():
            # 递归调用
            newDict[key] = tran_dict(value)
        return newDict
    if isinstance(d, list):
        newList = []
        for value in d:
            # 递归调用
            newList.append(tran_dict(value))
        return newList
    # 不是字符串，不是字典，那就直接返回
    return d

# 翻译所有的数据
def translate(d):
    if isinstance(d, list):
        result = []
        for item in d:
            result.append(tran_dict(item))
        return result
    if isinstance(d, dict):
        return tran_dict(d)
    return d


"""
编译所有语言的翻译
"""


def compile_all():
    # 抽取标注的字段，生成翻译模板
    os.system(extra_command())
    # 根据模板生成所有语言翻译需要的文件夹
    for locale in BABEL_LANS:
        # 默认的语言类型不用翻译
        if locale == BABEL_DEFAULT_LOCALE:
            continue
        # 检查po文件
        poFilePath = po_path(locale)
        if not os.path.exists(poFilePath):
            # 创建po文件
            os.system(init_command(locale))
        else:
            # 更新翻译模板内容
            os.system(update_command())
    # 编译模板内容
    os.system(compile_command())

"""
开启国际化
"""


def bind_i18n(app):
    babel.init_app(app)

    global BABEL_TRANSLATION_DIRECTORIES
    BABEL_TRANSLATION_DIRECTORIES = app.config['BABEL_TRANSLATION_DIRECTORIES'] if 'BABEL_TRANSLATION_DIRECTORIES' in app.config.keys() else BABEL_TRANSLATION_DIRECTORIES
    app.config['BABEL_TRANSLATION_DIRECTORIES'] = BABEL_TRANSLATION_DIRECTORIES

    global BABEL_DOMAIN
    BABEL_DOMAIN = app.config['BABEL_DOMAIN'] if "BABEL_DOMAIN" in app.config.keys() else  BABEL_DOMAIN
    app.config['BABEL_DOMAIN'] = BABEL_DOMAIN

    global BABEL_LANS
    BABEL_LANS = app.config['BABEL_LANS'] if 'BABEL_LANS' in app.config.keys() else BABEL_LANS
    app.config['BABEL_LANS'] = BABEL_LANS

    global BABEL_DEFAULT_LOCALE
    BABEL_DEFAULT_LOCALE= app.config['BABEL_DEFAULT_LOCALE'] if 'BABEL_DEFAULT_LOCALE' in app.config.keys() else BABEL_DEFAULT_LOCALE
    app.config['BABEL_DEFAULT_LOCALE'] = BABEL_DEFAULT_LOCALE


    # 编译所有的模板翻译
    compile_all()

    """
    国际化中间件，将所有返回的json拦截并翻译
    """
    # 目前只翻译错误返回
    # 如果需要翻译所有的json返回则打开该装饰器
    # @app.after_request
    def translate_all(response):
        respData = response.get_json()
        try:
            jsonData = translate(respData)
        except Exception:
            return response

        indent = None
        separators = (",", ":")

        if app.config["JSONIFY_PRETTYPRINT_REGULAR"] or app.debug:
            indent = 2
            separators = (", ", ": ")

        response.set_data(json.dumps(jsonData, indent=indent, separators=separators) + "\n")
        return response