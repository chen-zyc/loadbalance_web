/**
 * Created by zhangyuchen on 16/12/22.
 */

/** 格式化输入字符串**/
//用法: "hello{0}".format('world')；返回'hello world'
String.prototype.format = function () {
	var args = arguments;
	return this.replace(/\{(\d+)\}/g, function (s, i) {
		return args[i];
	});
};

$(function () {
	$('#node-list').trigger('autoresize');
	// Select
	$('select').material_select();

	$('#add-node').click(function () {
		AddOneNode();
	});

	$('#node-list tbody').delegate('.del-node', 'click', function () {
		$(this).parent().parent().remove();
	});

	$('#show-chart').click(function () {
		var nodeList = nodeNameAndWeight();
		var algorithm = $('#algorithm').val();
		var num = $('#num').val();
		// console.log(nodeList, algorithm, num);
		$.getJSON('/api/nodes/load', {
			'nodes': nodeList,
			'algorithm': algorithm,
			'num': num
		}, function (resp) {
			// console.log(resp);
			if (resp.code != 0) {
				alert(resp.message);
				return;
			}
			var data = resp.data;
			var m = {};
			for (var j = 0; j < data.nodes.length; j++) {
				m[data.nodes[j]] = j
			}
			for (var i = 0; i < data.select.length; i++) {
				data.select[i] = [i + 1, m[data.select[i]]];
			}
			renderData(data);
		});
	});
});

function nodeNameAndWeight() {
	var rows = $('#node-list tbody tr');
	var val = [];
	rows.each(function (i, node) {
		var nodeName = $(node).find('.node-name').val();
		var nodeWeight = $(node).find('.node-weight').val();
		if (nodeName && nodeWeight) {
			val.push(nodeName + ":" + nodeWeight);
		}
	});
	return val.join(";");
}

function AddOneNode(name, weight) {
	if (!name) {
		name = '';
	}
	if (!weight) {
		weight = 1
	}
	var tpl = '\
					<tr>\
                        <td>\
                            <div class="input-field inline">\
                                <input type="text" class="validate node-name" value="{0}"/>\
                            </div>\
                        </td>\
                        <td>\
                            <div class="input-field inline">\
                                <input type="text" class="validate node-weight" value="{1}"/>\
                            </div>\
                        </td>\
                        <td>\
                            <a class="waves-effect waves-teal btn del-node">删除</a>\
                        </td>\
                    </tr>\
		';
	$('#add-node').parent().parent().before(tpl.format(name, weight));
}

function renderData(data) {
	var opt = {
		id: '#chart',
		title: '各节点命中图',
		subtitle: '',
		xtitle: '次数',
		ytitle: '命中者',
		categories: data.nodes,
		series: [{
			// name: '命中次数',
			// color: 'rgba(223, 83, 83, .7)',
			data: data.select
		}]
	};
	scatterAndBubble(opt);
}

function scatterAndBubble(opt) {
	var id = opt.id, title = opt.title, subtitle = opt.subtitle, xtitle = opt.xtitle, ytitle = opt.ytitle,
		series = opt.series, categories = opt.categories;
	$(id).highcharts({
		chart: {
			type: 'scatter',
			zoomType: 'xy'
		},
		title: {
			text: title
		},
		subtitle: {
			text: subtitle
		},
		xAxis: {
			title: {
				enabled: true,
				text: xtitle
			},
			startOnTick: true,
			endOnTick: true,
			showLastLabel: true
		},
		yAxis: {
			type: 'category',
			categories: categories,
			title: {
				text: ytitle
			}
		},
		plotOptions: {
			scatter: {
				marker: {
					radius: 3,
					states: {
						hover: {
							enabled: true,
							lineColor: 'rgb(100,100,100)'
						}
					}
				},
				states: {
					hover: {
						marker: {
							enabled: false
						}
					}
				}
			}
		},
		series: series
	});
}