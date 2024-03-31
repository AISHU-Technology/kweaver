package handler

import (
	"github.com/zeromicro/go-zero/rest"
	"kw-system/internal/handler/dict"
	"kw-system/internal/handler/eventLog"
	health "kw-system/internal/handler/health"
	"kw-system/internal/handler/menu"
	"kw-system/internal/svc"
	"net/http"
)

func RegisterHandlers(server *rest.Server, serverCtx *svc.ServiceContext) {
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/getHomeEventList/:modType",
				Handler: eventLog.GetHomeEventList(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/add",
				Handler: eventLog.AddEvent(serverCtx),
			},
		},
		rest.WithPrefix("/api/eventStats/v1/event_log"),
	)
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/ready",
				Handler: health.Ready(),
			},
			{
				Method:  http.MethodGet,
				Path:    "/alive",
				Handler: health.Alive(),
			},
		},
		rest.WithPrefix("/api/eventStats/v1/health"),
	)
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/list",
				Handler: dict.GetDictList(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "",
				Handler: dict.GetDict(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/add",
				Handler: dict.AddDict(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/update",
				Handler: dict.UpdateDict(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/delete",
				Handler: dict.DeleteDict(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/itemList",
				Handler: dict.GetDictItemList(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/item",
				Handler: dict.GetDictItem(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/addItem",
				Handler: dict.AddDictItem(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/updateItem",
				Handler: dict.UpdateDictItem(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/deleteItem",
				Handler: dict.DeleteDictItem(serverCtx),
			},
		},
		rest.WithPrefix("/api/eventStats/v1/dict"),
	)
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/list",
				Handler: menu.GetMenuList(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "",
				Handler: menu.GetMenu(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/add",
				Handler: menu.AddMenu(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/update",
				Handler: menu.UpdateMenu(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/delete",
				Handler: menu.DeleteMenu(serverCtx),
			},
		},
		rest.WithPrefix("/api/eventStats/v1/menu"),
	)
}
