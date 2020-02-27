var Chart = {};

Chart.coxcomb = function () {
    var parameters = {
        area: function (d) {
            return [d.y];
        },
        angle: function (d) { return d.x; },
        radiusScale: d3.scaleLinear(),
        angleScale: d3.scaleLinear().range([Math.PI, 3 * Math.PI]),
        domain: [0, 1],
        label: function (d) { return d.label; },
    };

    var legend = ["disease", "wounds", "other"];
    var legendTitle = ["Zymotic diseases", "Wounds & injuries", "All other causes"];
    var delay = 0;
    var duration = 500;
    var height = 600;
    var width = 600;
    var margin = { 'top': 10, 'right': 10, 'bottom': 10, 'left': 10 };
    var canvas, graph, centerX, centerY, numWedges, wedgeGroups, wedges;

    var arc = d3.arc()
        .innerRadius(0)
        .outerRadius(function (d, i) { return parameters.radiusScale(d.radius); })
        .startAngle(function (d, i) { return parameters.angleScale(d.angle); });

    function chart(selection) {
        selection.each(function (data) {
            numWedges = data.length;
            data = formatData(data);
            updateParams();
            createBase(this);
            createWedges(data);
        });
    };

    function formatData(data) {
        data = data.map(function (d, i) {
            return {
                'angle': parameters.angle.call(data, d, i),
                'area': parameters.area.call(data, d, i),
                'label': parameters.label.call(data, d, i)
            };
        });
        return data.map(function (d, i) {
            return {
                'angle': d.angle,
                'label': d.label,
                'radius': d.area.map(function (area) {
                    return Math.sqrt(area * numWedges / Math.PI);
                })
            }
        })
    };

    function updateParams() {
        arc.endAngle(function (d, i) {
            return parameters.angleScale(d.angle) + (Math.PI / (numWedges / 2));
        });
        centerX = (width - margin.left - margin.right) / 2;
        centerY = (height - margin.top - margin.bottom) / 2;

        parameters.radiusScale.domain(parameters.domain)
            .range([0, d3.min([centerX, centerY])]);

        parameters.angleScale.domain([0, numWedges]);
    };

    function createBase(selection) {
        canvas = d3.select(selection).append('svg:svg')
            .attr('width', width)
            .attr('height', height)
            .attr('class', 'canvas');

        graph = canvas.append('svg:g')
            .attr('class', 'graph')
            .attr('transform', 'translate(' + (centerX + margin.left) + ','
                + (centerY + margin.top) + ')');
    };

    function createWedges(data) {
        wedgeGroups = graph.selectAll('.wedgeGroup')
            .data(data)
            .enter().append('svg:g')
            .attr('class', 'wedgeGroup')
            .attr('transform', 'scale(0, 0)');

        wedges = wedgeGroups.selectAll('.wedge')
            .data(function (d) {
                var ids = d3.range(0, legend.length);

                ids.sort(function (a, b) { return d.radius[b] - d.radius[a]; });

                return ids.map(function (i) {
                    return {
                        'legend': legend[i],
                        'radius': d.radius[i],
                        'angle': d.angle,
                        'legendTitle': legendTitle[i]
                    };
                });
            })
            .enter().append('svg:path')
            .attr('class', function (d) { return 'wedge ' + d.legend; })
            .attr('d', arc);

        // wedges.append('svg:title')
        //     .text(function (d) {
        //         return d.legendTitle + ': '
        //             + Math.floor(Math.pow(d.radius, 2) * Math.PI / numWedges);
        //     });

        wedges.on("mouseover", function (d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(d.legendTitle + ':  ' + Math.floor(Math.pow(d.radius, 2) * Math.PI / numWedges))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
            .on("mouseout", function (d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        wedgeGroups.transition()
            .delay(delay)
            .duration(function (d, i) {
                return duration * i;
            })
            .attr('transform', 'scale(1, 1)');

        var numLabels = d3.selectAll('.label-path').size();

        wedgeGroups.selectAll('.label-path')
            .data(function (d, i) {
                return [{
                    'index': i,
                    'angle': d.angle,
                    'radius': d3.max(d.radius.concat([23]))
                }];
            })
            .enter().append('svg:path')
            .attr('class', 'label-path')
            .attr('id', function (d) {
                return 'label-path' + (d.index + numLabels);
            })
            .attr('d', arc)
            .attr('fill', 'none')
            .attr('stroke', 'none');

        wedgeGroups.selectAll('.label')
            .data(function (d, i) {
                return [{
                    'index': i,
                    'label': d.label
                }];
            })
            .enter().append('svg:text')
            .attr('class', 'label')
            .attr('text-anchor', 'start')
            .attr('x', 5)
            .attr('dy', '-.71em')
            .attr('text-align', 'center')
            .append('textPath')
            .attr('xlink:href', function (d, i) {
                return '#label-path' + (d.index + numLabels);
            })
            .text(function (d) { return d.label; });

    };

    chart.setParameter = function (param, value) {
        if (!_.isEmpty(param)) {
            _.set(parameters, param, value);
            return chart;
        }
    };

    return chart;
};

