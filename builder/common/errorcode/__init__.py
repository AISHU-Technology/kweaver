from common.errorcode.errors.graph_error import errDict as graphErrors
from common.errorcode.errors.graphdb_error import errDict as graphdbErrors
from common.errorcode.errors.lexicon_error import errDict as lexiconErrors
from common.errorcode.errors.intelligence_error import errDict as intelligenceErrors



errDict = {}
errDict.update(graphErrors)
errDict.update(graphdbErrors)
errDict.update(lexiconErrors)
errDict.update(intelligenceErrors)
