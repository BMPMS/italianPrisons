"use client"; // This marks the component to run on the client

import type { FC } from 'react';
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {ChartData, CircleData, D3ChartProps, PrisonLine} from "@/app/components/D3Chart_types";
import {flipLabelArc, formatData, getPercentageArcData, getPrisonLines, getPrisonPath, wrap} from "@/app/components/D3Chart_functions";

export const COLORS = {background: "#24242e", darkGrey: "#484751", lightGrey:"#ababba", red: "#cc0e0e"}

const D3Chart: FC<D3ChartProps> = ({ containerClass,chartData, regionData }) => {
    const ref = useRef(null);

    useEffect(() => {
        // svgs and sizing
        const svg: d3.Selection<any, unknown, null, undefined> = d3.select(ref.current);
        const svgNode = svg.node();
        if (!svgNode) return;

        const containerNode = d3.select<Element, unknown>(`.${containerClass}Container`).node();
        if (!containerNode) return;
        const {  clientHeight } = containerNode;
        const svgHeight: number = clientHeight;
        // maintain proportions from static viz
        const svgWidth = svgHeight/1.4;
        const height = 1000;
        const width = height/1.4;
        const circleRadius = 0.378 * width;

        const arcWidth = 10;
        const margin = {left: 10, right: 10, top: 15, bottom: 20};

        svg.attr("viewBox", [0, 0, width, height])
            .attr('width', svgWidth)
            .attr('height', svgHeight);

        svg.select(".chartTitle")
            .attr("font-size",30)
            .attr("font-weight",500)
            .attr("transform", `translate(0,45)`)
            .attr("fill","white")
            .text("The dramatic conditions of Italian prisons, focus 2024")
            .call(wrap, width * 0.55);

        svg.select(".chartInfo")
            .attr("font-size",10)
            .attr("transform", `translate(0,110)`)
            .attr("fill","white")
            .text("In 2024, the Italian prison system faced a severe crisis due to overcrowding. Out of 188 penitentiary institutions, 138 exceeded their official capacity, highlighting increasing pressure on both facilities and staff. The analysis focuses on 100 of these 138 overcrowded prisons in the twenty regions of Italy, starting from the North, providing a representative overview of the most critical issues: suicides, attempted suicides and self-harm cases are not uncommon and are often strictly connected to overcrowding. The severe shortage of prison staff is another crucial problem: the disparity between the planned number of correctional officers and the actual workforce is often striking, leading to increased stress, safety concerns, and management difficulties within the facilities. The project Liberiamoli tutti! for the campaign #DatiBeneComune has provided valuable data for this analysis, revealing the significant gap between the official capacity and the actual number of inmates in many facilities. Can we change the narrative when we are aware of the issues?")
            .call(wrap, width * 0.6);





        const drawPie = (pieData:  d3.PieArcDatum<CircleData>[], pieClass: string, transformX: number, transformY: number) => {

            const circleDiameter = circleRadius * 2;
            // trial and error to line both circles up exactly
            const scaleHeight = (margin.top + circleDiameter - arcWidth) - (height - margin.bottom - circleDiameter + arcWidth) - (arcWidth * 2) - 7.2;

            const scaleStart = circleRadius - arcWidth - scaleHeight;
            const scaleEnd = circleRadius - arcWidth;
            const arcScale = d3.scaleLinear<number>()
                .domain([0,1])
                .range(pieClass === "top" ? [scaleStart,scaleEnd] : [scaleEnd,scaleStart]);

            const innerArcHeight = arcScale(1) - arcScale(0.9);

            const backgroundArc = d3.arc< d3.PieArcDatum<CircleData>>()
                .outerRadius(circleRadius)
                .innerRadius(circleRadius - arcWidth);

            // overall circle pie group join
            const pieGroup = svg.select(".arcGroup")
                .selectAll<SVGGElement, d3.PieArcDatum<CircleData>>(`.pieGroup${pieClass}`)
                .data(pieData)
                .join((group) => {
                    const enter = group.append("g").attr("class", `pieGroup${pieClass}`);
                    enter.append("path").attr("class", "backgroundArc");
                    enter.append("path").attr("class", "labelArc");
                    enter.append("text").attr("class", "labelText").append("textPath")
                        .attr("class", "labelTextPath");
                    enter.append("g").attr("class", "prisonsGroup");
                    return enter;
                });

            pieGroup.attr("transform",`translate(${transformX },${transformY})`)

            pieGroup.select(".backgroundArc")
                .attr("fill", (d) => d.data.pieOrder % 2 === 0 ? COLORS.lightGrey : COLORS.darkGrey)
                .attr("d",backgroundArc);

            pieGroup.select(".labelArc")
                .attr("id",(d,i) => `labelPath${pieClass}${i}`)
                .attr("fill", "transparent") // flips label if bottom half
                .attr("d",(d) => flipLabelArc(d,arcWidth,circleRadius));

            pieGroup.select(".labelText")
                .attr("dy",0.5)
                .attr("fill", (d) => d.data.pieOrder % 2 === 0 ? COLORS.darkGrey : COLORS.lightGrey)
                .attr("dominant-baseline","middle");

            pieGroup
                .select(".labelTextPath") // different offset depending on whether label flipped
                .attr("startOffset", (d) => d.startAngle >= (Math.PI/2) && d.startAngle <= (Math.PI * 1.5) ? "50%" : "25%")
                .attr("font-size", 6)
                .attr("text-anchor", "middle")
                .attr("xlink:href", (d,i) => `#labelPath${pieClass}${i}`)
                .text((d) => d.data.name.toUpperCase());

            // background rect behind scale to mimic Valerie's 'straightening off' of the curve at the start
            svg.select(".scaleBackgroundRect")
                .attr("fill",COLORS.background)
                .attr("x",width - circleRadius + 12)
                .attr("y",margin.top)
                .attr("width",15)
                .attr("height",scaleHeight + (arcWidth * 2));

           const percentageArcData = getPercentageArcData(pieData,arcScale,pieClass);

           // percentage arc join (nb group is below others in order)
           const percentageArcGroup = svg.select(".scaleGroup")
                .selectAll<SVGGElement, d3.PieArcDatum<CircleData>>(`.percentageArcGroup${pieClass}`)
                .data(percentageArcData)
                .join((group) => {
                    const enter = group.append("g").attr("class", `percentageArcGroup${pieClass}`);
                    enter.append("path").attr("class", "scaleArc");
                    return enter;
           });

            percentageArcGroup.attr("transform",`translate(${transformX },${transformY})`);

            percentageArcGroup.select(".scaleArc")
                .attr("stroke", (d) => d.fill)
                .attr("stroke-width",0.5)
                .attr("fill","none")
                .attr("d", (d,i) => d.path );

            // percentage arc label join (note: group is above scale + background rect)
            const percentageArcLabelGroup = svg.select(".scaleLabelGroup")
                .selectAll<SVGGElement, d3.PieArcDatum<CircleData>>(`.percentageArcLabelGroup${pieClass}`)
                .data(percentageArcData)
                .join((group) => {
                    const enter = group.append("g").attr("class", `percentageArcLabelGroup${pieClass}`);
                    enter.append("text").attr("class", "scaleLabel");
                    return enter;
                });

            percentageArcLabelGroup.attr("transform",`translate(${transformX },${transformY})`);

            percentageArcLabelGroup.select(".scaleLabel")
                .attr("fill", (d) => d.fill === "transparent" ? "white" : d.fill)
                .attr("text-anchor","middle")
                .attr("x",28)
                .attr("dominant-baseline","middle")
                .attr("y", (d,i) =>  margin.top -circleRadius + (i * innerArcHeight))
                .attr("font-size","6")
                .text((d) => pieClass === "bottom" ? "" : d3.format(".0f")((1 - d.value) * 100));

            const prisonGroup = pieGroup.select(".prisonsGroup")
                .selectAll<SVGGElement, d3.PieArcDatum<CircleData>>(`.prisonGroup${pieClass}`)
                .data((d) => {
                    // building this data dynamically as depends on pie angle results
                    const prisons = d.data.data;
                    const prisonSlice = (d.endAngle - d.startAngle)/(prisons.length + 1);
                    return prisons.reduce((acc, prison, index) => {
                        const prisonAngle =  d.startAngle + (index * prisonSlice) + prisonSlice;
                        acc.push({
                            data: prison,
                            lines: getPrisonLines(prison,prisonAngle,prisonSlice,arcScale),
                        })
                        return acc;
                    },[] as { data: ChartData, lines: PrisonLine[] }[])
                })
                .join((group) => {
                    const enter = group.append("g").attr("class", `prisonGroup${pieClass}`);
                    enter.append("g").attr("class","prisonLines")
                    return enter;
                });

            const prisonLineGroup = prisonGroup.select(".prisonLines")
                .selectAll<SVGGElement, PrisonLine[]>(`.prisonLineGroup${pieClass}`)
                .data((d) => d.lines)
                .join((group) => {
                    const enter = group.append("g").attr("class", `prisonLineGroup${pieClass}`);
                    enter.append("path").attr("class", "prisonLine");
                    enter.append("path").attr("class","policeSquare");
                    enter.append("g").attr("class","pieArcs");
                    return enter;
                });

            prisonLineGroup.select(".prisonLine")
                .attr("stroke",(d) => d.stroke)
                .attr("stroke-dasharray", (d) => d.dashArray)
                .attr("stroke-width",1)
                .attr("d", (d) => d.linePath)

            prisonLineGroup.select(".policeSquare")
                .attr("d", (d) => d.showSquare ? getPrisonPath().squarePath : "")
                .attr("fill",(d) => d.stroke)
                .attr("transform",(d) => `translate(${d.endCoord[0]},${d.endCoord[1]}) rotate(${d.angleAsDegrees})`)

            prisonLineGroup.select(".pieArcs")
                .attr("transform",(d) => `translate(${d.endCoord[0]},${d.endCoord[1]}) rotate(${pieClass === "top"? d.angleAsDegrees : d.angleAsDegrees - 180})`)

            const policeStaffArcs = getPrisonPath().circularArcs;
            const policeStaffThreshold = d3.scaleThreshold().domain([1,16,31]).range([0,1,2,3])

            const policeStaffArcGroup = prisonLineGroup.select(".pieArcs")
                .selectAll<SVGGElement, PrisonLine[]>(`.policeStaffArcs${pieClass}`)
                .data((d) => {
                    let arcData: any = policeStaffArcs.slice(0, policeStaffThreshold(d.data.differenceInPoliceNumbers));
                    arcData = arcData.map((m: any) => m = {path: m, stroke: d.stroke})
                    return arcData;
                })
                .join((group) => {
                    const enter = group.append("g").attr("class", `policeStaffArcs${pieClass}`);
                    enter.append("path").attr("class", "policeStaffCurve");
                    return enter;
                });

            policeStaffArcGroup.select(".policeStaffCurve")
                .attr("d", (d: any) => d.path)
                .attr("fill",(d) => d.stroke)


        }

       const {pieTopData, pieBottomData} = formatData(chartData,regionData);
       drawPie(pieTopData,"top",width - margin.right - circleRadius,margin.top + circleRadius)
       drawPie(pieBottomData,"bottom",margin.left + circleRadius,height - margin.bottom - circleRadius)


    }, [containerClass, chartData]);

    return (
        <svg ref={ref}>
            <text className={"chartTitle"}/>
            <text className={"chartInfo"}/>
            <g className={"scaleGroup"}></g>
            <g className={"arcGroup"}/>
            <rect className={"scaleBackgroundRect"}/>
            <g className={"scaleLabelGroup"}></g>
        </svg>
            );
            };

export default D3Chart;
