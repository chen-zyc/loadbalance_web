package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/zhangyuchen0411/loadbalance"
)

type scheduler interface {
	Next() *loadbalance.Node
}

type resp struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// JSON 返回d的json表示
func JSON(d interface{}) []byte {
	data, _ := json.Marshal(d)
	return data
}

func main() {
	fileHandler := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fileHandler))

	http.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		http.Redirect(w, req, "/static/index.html", http.StatusMovedPermanently)
	})

	http.HandleFunc("/api/nodes/load", func(w http.ResponseWriter, req *http.Request) {
		var err error
		defer func() {
			if err != nil {
				w.Write(JSON(resp{
					Code:    -1,
					Message: err.Error(),
				}))
			}
		}()
		req.ParseForm()
		nodeWeightStr := req.Form.Get("nodes")
		nodes := parseNodesStr(nodeWeightStr)
		if len(nodes) == 0 {
			err = errors.New("没有有效的节点")
			return
		}
		algorithm, err := strconv.Atoi(req.Form.Get("algorithm"))
		if err != nil {
			return
		}
		num, err := strconv.Atoi(req.Form.Get("num"))
		if num <= 0 {
			err = nil
			num = 10
		}
		var s scheduler
		if algorithm == 2 {
			s = loadbalance.NewNginxScheduler(nodes)
		} else {
			s = loadbalance.NewWeightedScheduler(nodes)
		}
		nodeNames := make([]string, len(nodes))
		for i, n := range nodes {
			nodeNames[i] = n.Data.(string)
		}
		nodesSelected := make([]string, num)
		for i := 0; i < num; i++ {
			nodesSelected[i] = s.Next().Data.(string)
		}
		w.Write(JSON(resp{
			Data: map[string]interface{}{
				"nodes":  nodeNames,
				"select": nodesSelected,
			},
		}))
	})

	http.ListenAndServe(":9090", nil)
}

func parseNodesStr(s string) []*loadbalance.Node {
	parts := strings.Split(s, ";")
	nodes := make([]*loadbalance.Node, 0, len(parts))
	for _, p := range parts {
		nameWeight := strings.SplitN(p, ":", 2)
		if len(nameWeight) != 2 {
			continue
		}
		weight, err := strconv.Atoi(strings.TrimSpace(nameWeight[1]))
		if err != nil {
			continue
		}
		name := strings.TrimSpace(nameWeight[0])
		if name == "" {
			continue
		}
		nodes = append(nodes, &loadbalance.Node{
			Data:   name,
			Weight: weight,
		})
	}
	return nodes
}
