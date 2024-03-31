package handler

import (
	"github.com/zeromicro/go-zero/rest"
	"kw-graph/internal/handler/canvas"
	graphsearchbasic "kw-graph/internal/handler/graphsearch/basic"
	graphsearchcustom "kw-graph/internal/handler/graphsearch/custom"
	graphsearchexplore "kw-graph/internal/handler/graphsearch/explore"
	"kw-graph/internal/handler/health"
	"kw-graph/internal/svc"
	"net/http"
)

func RegisterHandlers(server *rest.Server, serverCtx *svc.ServiceContext) {
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/ready",
				Handler: health.CheckReadyHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/alive",
				Handler: health.CheckAliveHandler(serverCtx),
			},
		},
		rest.WithPrefix("/api/engine/v1/health"),
	)

	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodPost,
				Path:    "/full-text",
				Handler: graphsearchbasic.FullTextSearchHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/vids",
				Handler: graphsearchbasic.VidsSearchHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/edges",
				Handler: graphsearchbasic.EdgesSearchHandler(serverCtx),
			},
		},
		rest.WithPrefix("/api/engine/v1/basic-search/kgs/:kg_id"),
	)

	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodPost,
				Path:    "/kgs/:kg_id",
				Handler: graphsearchcustom.CustomSearchHandler(serverCtx),
			},
		},
		rest.WithPrefix("/api/engine/v1/custom-search"),
	)

	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodPost,
				Path:    "/paths",
				Handler: graphsearchexplore.PathsExploreHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/neighbors",
				Handler: graphsearchexplore.NeighborsSearchHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/expandv",
				Handler: graphsearchexplore.ExpandVHandler(serverCtx),
			},
		},
		rest.WithPrefix("/api/engine/v1/graph-explore/kgs/:kg_id"),
	)

	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodPost,
				Path:    "/",
				Handler: canvas.CreateCanvasHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/:c_id/delete",
				Handler: canvas.DeleteCanvasHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/:c_id/update",
				Handler: canvas.UpdateCanvasHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/delete",
				Handler: canvas.BatchDeleteCanvasesHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/knws/:knw_id",
				Handler: canvas.GetCanvasesListHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/delete_by_kg",
				Handler: canvas.BatchDeleteCanvasesByKgIdsHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/kg_ids",
				Handler: canvas.GetKgIDsByCIDHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/:c_id",
				Handler: canvas.GetCanvasInfoByCIDHandler(serverCtx),
			},
		},
		rest.WithPrefix("/api/alg-server/v1/canvases"),
	)
}
