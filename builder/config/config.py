# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import datetime
# 服务器日志路径
APP_LOG_PATH = "/var/log"

# ds_path as路径前缀定制
ds_path_diy = "AnyShare://"


public_key = '''-----BEGIN PUBLIC KEY-----
         MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC7JL0DcaMUHumSdhxXTxqiABBC
         DERhRJIsAPB++zx1INgSEKPGbexDt1ojcNAc0fI+G/yTuQcgH1EW8posgUni0mcT
         E6CnjkVbv8ILgCuhy+4eu+2lApDwQPD9Tr6J8k21Ruu2sWV5Z1VRuQFqGm/c5vaT
         OQE5VFOIXPVTaa25mQIDAQAB
         -----END PUBLIC KEY-----
         '''

token_id = "1"
as_url = "https://anyshare.eisoo.com"
as_post = 443

# 登錄
login_path = "/api/v1/auth1/getnew"
refresh_token_path = "/auth1/refreshtoken"
revoket_token = "/auth1/revoketoken"

# 文檔
entryDoc = "/api/v1/entrydoc2/get"
dirlist = "/api/v1/dir/list"
filedown = "/api/v1/file/osdownload"


# hive
hive_ip = "10.2.192.33"
hive_user = "es2hdfs"
hive_ps = "Eisoo.com123"
hive_port = 10000
hive_auth = "LDAP"
modeldir="./../unstructedmodel/"
# 本地目錄位置
# modeldir="/newdisk/model/"

PERMANENT_SESSION_LIFETIME = datetime.timedelta(seconds=30) # session有效时间

builder_ip = "0.0.0.0"
builder_port = 6475
builder_debug = False

# celery
CELERY_BROKER_URL = 'redis://10.4.81.11:6379/1'
# 要存储 Celery 任务的状态或运行结果时就必须要配置
CELERY_RESULT_BACKEND = 'redis://10.4.81.11:6379/2'


baseInfo_flag = False




local_testing = False

mongodb_host = "10.2.235.235"
mongodb_port = "27017"
redis_add = "10.4.128.208"
redis_port = "6379"