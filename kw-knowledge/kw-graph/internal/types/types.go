package types

type ClassFilterProperties struct {
	Name      string `json:"name"`
	Operation string `json:"operation"`
	OpValue   string `json:"op_value"`
}

type SearchConfig struct {
	Tag        string                   `json:"tag"`
	Properties []*ClassFilterProperties `json:"properties,optional"`
}

type VidsRequest struct {
	KgID         string          `path:"kg_id"`
	Page         int64           `json:"page,range=(0:]"`
	Size         int64           `json:"size,range=[0:]"`
	SearchConfig []*SearchConfig `json:"search_config,optional"`
	Vids         []string        `json:"vids"`
}

type Filter struct {
	EFilters []*EFilter `json:"e_filters,optional"`
	VFilters []*VFilter `json:"v_filters,optional"`
}

type EFilter struct {
	Relation        string            `json:"relation"`
	Type            string            `json:"type"`
	EdgeClass       string            `json:"edge_class"`
	PropertyFilters []*PropertyFilter `json:"property_filters,optional"`
}

type VFilter struct {
	Relation        string            `json:"relation"`
	Type            string            `json:"type"`
	Tag             string            `json:"tag"`
	PropertyFilters []*PropertyFilter `json:"property_filters,optional"`
}

type PropertyFilter struct {
	Name      string `json:"name"`
	Operation string `json:"operation"`
	OpValue   string `json:"op_value"`
}

type FullTextRequest struct {
	KgID         string          `path:"kg_id"`
	MatchingRule string          `json:"matching_rule,options=[completeness,portion]"`
	MatchingNum  int64           `json:"matching_num,range=(0:]"`
	Query        string          `json:"query"`
	Page         int64           `json:"page,range=(0:]"`
	Size         int64           `json:"size,range=[0:]"`
	SearchConfig []*SearchConfig `json:"search_config,optional"`
}

type EdgesRequest struct {
	KgID  string     `path:"kg_id"`
	Edges []*EdgeReq `json:"edges,optional"`
	Eids  []string   `json:"eids,optional"`
}

type EdgeReq struct {
	SrcID string `json:"src_id"`
	DstID string `json:"dst_id"`
	Type  string `json:"type"`
	Rank  int64  `json:"rank,optional"`
}

type UnitiveProps struct {
	Key      string `json:"name"`
	Value    string `json:"value"`
	Alias    string `json:"alias"`
	Type     string `json:"type"`
	Disabled bool   `json:"disabled"`
	Checked  bool   `json:"checked"`
}

type UnitiveDefaultProperty struct {
	Name  string `json:"name"`
	Value string `json:"value"`
	Alias string `json:"alias"`
}

type UnitiveProperties struct {
	Tag   string          `json:"tag"`
	Props []*UnitiveProps `json:"props"`
}

type Nodes struct {
	ID              string                  `json:"id"`
	Alias           string                  `json:"alias"`
	Color           string                  `json:"color"`
	ClassName       string                  `json:"class_name"`
	Icon            string                  `json:"icon"`
	DefaultProperty *UnitiveDefaultProperty `json:"default_property"`
	Tags            []string                `json:"tags"`
	Properties      []*UnitiveProperties    `json:"properties"`
	Number          int                     `json:"-"`
}

type Edges struct {
	ID         string          `json:"id"`
	Alias      string          `json:"alias"`
	Color      string          `json:"color"`
	ClassName  string          `json:"class_name"`
	Source     string          `json:"source"`
	Target     string          `json:"target"`
	Properties []*UnitiveProps `json:"properties"`
	Number     int             `json:"-"`
}

type ErrDetails struct {
	Detail string `json:"detail"`
}

type Error struct {
	ErrorCode    string        `json:"ErrorCode"`
	Description  string        `json:"Description"`
	Solution     string        `json:"Solution"`
	ErrorDetails []*ErrDetails `json:"ErrorDetails"`
}

type TextRowInfo struct {
	Column string `json:"column"`
	Value  string `json:"value"`
	Type   string `json:"type"`
}

type Texts struct {
	Columns []*TextRowInfo `json:"columns"`
}

type PathSimpleInfo struct {
	Nodes []string `json:"nodes"`
	Edges []string `json:"edges"`
}

type GraphSearchResponse struct {
	NodesCount  int64             `json:"nodes_count,omitempty"`
	EdgesCount  int64             `json:"edges_count,omitempty"`
	Nodes       []*Nodes          `json:"nodes"`
	Edges       []*Edges          `json:"edges"`
	Paths       []*PathSimpleInfo `json:"paths,omitempty"`
	NodesDetail map[string]*Nodes `json:"nodes_detail,omitempty"`
	Texts       []*Texts          `json:"texts,omitempty"`
	Statement   string            `json:"statement,omitempty"`
	Error       *Error            `json:"error,omitempty"`
}

type UnitiveResponse struct {
	Res *GraphSearchResponse `json:"res"`
}

type CustomSearchRequest struct {
	KgID       string   `path:"kg_id"`
	GivenJson  bool     `json:"given_json,optional,default=false"`
	Statements []string `json:"statements"`
}

type CustomSearchV1Response struct {
	Res []*GraphSearchResponse `json:"res"`
}

type CreateCanvasRequest struct {
	KnwID         int64  `json:"knw_id,range=(0:)"`
	KgID          int64  `json:"kg_id,range=(0:)"`
	CanvasName    string `json:"canvas_name" validate:"min=1,max=50"`
	CanvasInfo    string `json:"canvas_info,optional" validate:"min=1,max=255"`
	CanvasBody    string `json:"canvas_body,optional"`
	UserName      string `header:"username,optional"`
	UserID        string `header:"userId,optional"`
	UserAgent     string `header:"User_Agent,optional"`
	XForwardedFor string `header:"X_Forwarded_For,optional"`
}

type CanvasIDRequestOnPath struct {
	CID           int64  `path:"c_id"`
	UserName      string `header:"username,optional"`
	UserID        string `header:"userId,optional"`
	UserAgent     string `header:"User_Agent,optional"`
	XForwardedFor string `header:"X_Forwarded_For,optional"`
}

type UpdateCanvasRequest struct {
	CID           int64  `path:"c_id,range=(0:)"`
	KnwID         int64  `json:"knw_id,optional,range=(0:)"`
	KgID          int64  `json:"kg_id,optional,range=(0:)"`
	CanvasName    string `json:"canvas_name,optional" validate:"min=1,max=50"`
	CanvasInfo    string `json:"canvas_info,optional" validate:"min=1,max==255"`
	CanvasBody    string `json:"canvas_body,optional"`
	UserName      string `header:"username,optional"`
	UserID        string `header:"userId,optional"`
	UserAgent     string `header:"User_Agent,optional"`
	XForwardedFor string `header:"X_Forwarded_For,optional"`
}

type KnowledgeGraph struct {
	KgID int64  `json:"kg_id"`
	Name string `json:"name"`
}

type User struct {
	UserID   string `json:"user_id"`
	UserName string `json:"user_name"`
}

type GetCanvasInfoResponse struct {
	Canvas Canvas `json:"res"`
}

type Canvas struct {
	CID        int64          `json:"c_id"`
	KnwID      int64          `json:"knw_id"`
	CanvasName string         `json:"canvas_name"`
	CanvasInfo string         `json:"canvas_info"`
	Kg         KnowledgeGraph `json:"kg"`
	CreateUser User           `json:"create_user"`
	CreateTime string         `json:"create_time"`
	UpdateUser User           `json:"update_user"`
	UpdateTime string         `json:"update_time"`
	CanvasBody string         `json:"canvas_body"`
}

type BatchDeleteCanvasesRequest struct {
	CIDs          []int64 `json:"c_ids"`
	KnwID         int64   `path:"knw_id,range=(0:),optional"`
	UserName      string  `header:"username,optional"`
	UserID        string  `header:"userId,optional"`
	UserAgent     string  `header:"User_Agent,optional"`
	XForwardedFor string  `header:"X_Forwarded_For,optional"`
}

type GetCanvasesListRequest struct {
	KnwID      int64  `path:"knw_id,optional,range=(0:)"`
	KgID       int64  `form:"kg_id,range=(0:)"`
	OrderField string `form:"order_field,optional,default=update_time"`
	OrderType  string `form:"order_type,optional,default=desc"`
	Page       int64  `form:"page,optional,default=1,range=(0:)"`
	Size       int64  `form:"size,optional,default=20,range=(0:)"`
	Query      string `form:"query,optional"`
}

type BatchDeleteCanvasesByKgIdsRequest struct {
	KgIds []int64 `json:"kg_ids"`
}

type GetKgidsByCIDRequest struct {
	CIDs string `form:"c_ids"`
}

type CanvasesInfo struct {
	Count    int64    `json:"count"`
	Canvases []Canvas `json:"canvases"`
}

type GetCanvasesListResponse struct {
	Res CanvasesInfo `json:"res"`
}

type ReturnResIntListResponse struct {
	Res []int64 `json:"res"`
}

type ReturnResIntResponse struct {
	Res int64 `json:"res"`
}

type PathRequest struct {
	KgID         string    `path:"kg_id"`
	Source       string    `json:"source"`
	Target       string    `json:"target"`
	Direction    string    `json:"direction"`
	PathType     int64     `json:"path_type"`
	PathDecision string    `json:"path_decision,optional"`
	Edges        string    `json:"edges,optional"`
	Property     string    `json:"property,optional"`
	DefaultValue string    `json:"default_value,optional"`
	Steps        int64     `json:"steps,optional"`
	Limit        int64     `json:"limit,optional"`
	Filters      []*Filter `json:"filters,optional"`
}

type NeighborsRequest struct {
	KgID      string    `path:"kg_id"`
	Vids      []string  `json:"vids"`
	Direction string    `json:"direction,optional"`
	Page      int       `json:"page,optional"`
	Size      int       `json:"size,optional"`
	Steps     int       `json:"steps,optional"`
	Filters   []*Filter `json:"filters,optional"`
	FinalStep bool      `json:"final_step,optional,default=false"`
}

type ExpandVResponse struct {
	Res *ExpandVGroup `json:"res"`
}

type ExpandVGroup struct {
	ID   string         `json:"id"`
	OutE []*ExpandVEdge `json:"out_e"`
	InE  []*ExpandVEdge `json:"in_e"`
}

type ExpandVEdge struct {
	EdgeClass string `json:"edge_class"`
	Count     int64  `json:"count"`
	Color     string `json:"color"`
	Alias     string `json:"alias"`
}

type ExpandVRequest struct {
	KgID string `path:"kg_id"`
	Vid  string `form:"vid"`
}
