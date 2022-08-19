from common.errorcode.errors.graph_error import errDict as graphErrors
from common.errorcode.errors.graphdb_error import errDict as graphdbErrors


errDict = {}
errDict.update(graphErrors)
errDict.update(graphdbErrors)

