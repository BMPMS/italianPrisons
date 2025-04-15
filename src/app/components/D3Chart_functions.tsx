import * as d3 from "d3";
import {AllCircleData, ChartData, CircleData, PrisonLine, Region} from "@/app/components/D3Chart_types";
import {COLORS} from "@/app/components/D3Chart";

const getPie = (degrees: number[], sortOrder: "ascending" | "descending") => {
    const pieConvert = degrees
        .map((m) => m = (m/360) * (Math.PI*2));
    return d3.pie<CircleData>()
        .startAngle(pieConvert[0])
        .endAngle(pieConvert[1])
        .value((d) => d.prisonCount)
        .sort((a, b) => d3[sortOrder](a.pieOrder, b.pieOrder));
}

const blankEntry = {
    "id": "",
    "type": "",
    "municipality": "",
    "region": "Friuli Venezia Giulia",
    "suicides": 0,
    "attemptedSuicides": 0,
    "selfHarm": 0,
    "regulatoryRooms": 0,
    "nonRegulatoryRooms": 0,
    "totalPrisoners": 0,
    "overcrowdingAbsolute": 0,
    "overcrowdingPercent": 0,
    "expectedPolice": 0,
    "realPolice": 0,
    "differenceInPoliceNumbers": 0,
    "top30SelfHarm": false,
    "top30Suicides": false
}
export const formatData = (chartData: ChartData[], regionData: Region[]) => {
    const topCircleDegrees = [7, 200];
    const bottomCircleDegrees = [194,380];

    const dataByRegion = d3.group(chartData, (g) => g.region);

    const circleData = Array.from(dataByRegion.keys()).reduce((acc, entry, index) => {
        if(index === 0){acc = {top: [],bottom:[]}};
        const region = regionData.find((f) => f.region === entry);
        let allRegionData = dataByRegion.get(entry);
        if(region && allRegionData){
            allRegionData = allRegionData.sort((a,b) => d3[region.circle === "top" ? "descending" : "ascending"](a.overcrowdingPercent,b.overcrowdingPercent));
            if(entry === "Friuli Venezia Giulia"){
                // adding blank entry @ start to compensate for rounding off at the top of the design.
                allRegionData.unshift(blankEntry)
            }
            acc[region.circle].push(
                {name: region.shortName,
                    pieOrder: region.northToSouthOrder,
                    prisonCount: allRegionData.length,
                    data: allRegionData})
        }
        return acc;
    },{} as AllCircleData)

    const pieTopData = getPie(topCircleDegrees,"ascending")(circleData.top);
    const pieBottomData = getPie(bottomCircleDegrees,"descending")(circleData.bottom);

    return {pieTopData,pieBottomData};
}


const checkRegEx = (expression: RegExp, pathString: string) => {
    const regEx = expression.exec(pathString);
    if(regEx && regEx.length > 1){
        return regEx[1];
    }
    return "";
}

export const flipLabelArc = (pieData: d3.PieArcDatum<CircleData>, arcWidth: number, circleRadius: number) => {
    // https://www.visualcinnamon.com/2015/09/placing-text-on-arcs/#:~:text=The%20first%20thing%20that%20you,the%20shape%20of%20a%20path%20.
    const firstArcSection = /(^.+?)L/;

    const labelArc = d3.arc< d3.PieArcDatum<CircleData>>()
        .outerRadius(circleRadius - arcWidth/2)
        .innerRadius(circleRadius - 1 - arcWidth/2);

    const arcPath = labelArc(pieData) || "";
    let newArc = checkRegEx(firstArcSection,arcPath);
    if(newArc !== ""){
        //Replace all the commas so that IE can handle it
        newArc = newArc.replace(/,/g, " ");
        //If the end angle lies beyond a quarter of a circle (90 degrees or pi/2)
        //flip the end and start position
        if (pieData.startAngle >= (Math.PI/2) && pieData.startAngle <= (Math.PI * 1.5)) {
            //Everything between the capital M and first capital A
            const startLoc = /M(.*?)A/;
            //Everything between the capital A and 0 0 1
            const middleLoc = /A(.*?)0 0 1/;
            //Everything between the 0 0 1 and the end of the string (denoted by $)
            const endLoc = /0 0 1 (.*?)$/;
            //Flip the direction of the arc by switching the start and end point
            //and using a 0 (instead of 1) sweep flag
            const newStart = checkRegEx(endLoc,newArc);
            const newEnd = checkRegEx(startLoc,newArc);
            const middleSec = checkRegEx(middleLoc,newArc);
            //Build up the new arc notation, set the sweep-flag to 0
            return "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
        }
    }
    return arcPath;
}

export const getPercentageArcData = (pieData:  d3.PieArcDatum<CircleData>[], arcScale: d3.ScaleLinear<number, number, never>, pieClass: string) =>  {
    // start + end angle of entire circle
    const percentagePie = {
        startAngle: d3.min(pieData, (d) => d.startAngle) || 0,
        endAngle: d3.max(pieData, (d) => d.endAngle) || 0
    }
    // arcs required for scale
    const percentageArcs = Array.from({ length: 11}).map((m,i) => i/10);

    return percentageArcs.reduce((acc, entry, i) => {

        const radius = arcScale(entry) || 0;

        const arc = d3.arc<{startAngle: number, endAngle: number}>()
            .innerRadius(radius)
            .outerRadius(radius);

        let entryFill = COLORS.darkGrey; // arcs have different fill at 0, 0.5 + 1
        if((entry === 1 && pieClass === "top" || entry === 0 && pieClass === "bottom") ){entryFill = "transparent"};
        if(entry === 0.5 || (entry === 0 && pieClass === "top" || entry === 1 && pieClass === "bottom")){entryFill = "white"};
        const path = arc(percentagePie) || "";

        acc.push({
            path,
            value: entry,
            fill: entryFill
        })
        return acc;
    },[] as {path: string, value: number, fill: string}[])
}
export const getPrisonPath = () => {
    // draws prison square (easier to rotate as a centred path)
    const prisonSquareRadius = 2;
    const topLeft = `${-prisonSquareRadius},${-prisonSquareRadius}`;
    const topRight = `${prisonSquareRadius},${-prisonSquareRadius}`;
    const bottomLeft = `${-prisonSquareRadius},${prisonSquareRadius}`;
    const bottomRight = `${prisonSquareRadius},${prisonSquareRadius}`;
    const squarePath = `M${topLeft}L${topRight}L${bottomRight}L${bottomLeft}Z`

    const percentPie = 0.7;
    const pieCount = 3;
    const pieSlice = (Math.PI * (percentPie * 2)) / 3;
    const angleStart = -Math.PI * percentPie;

    const arc = d3
        .arc<{startAngle: number, endAngle: number}>()
        .padAngle(0.2)
        .cornerRadius(0.5)
        .innerRadius((prisonSquareRadius * 2))
        .outerRadius((prisonSquareRadius * 2) + 1);

    const circularArcs = Array.from({ length: pieCount }, (_, i) => i + 1).reduce(
        (acc, entry, index) => {
            const aggregate = index * pieSlice;
            const pieArc = arc({
                startAngle: angleStart + aggregate,
                endAngle: angleStart + aggregate + pieSlice
            })
            if(pieArc){
                acc.push(pieArc);
            }
            return acc;
        },
        [] as string[]
    );

    return {squarePath, circularArcs}
}


const getLine = (prison: ChartData, lineAngle: number, prisonAngle: number,stroke: string, dashArray: string,arcScale: d3.ScaleLinear<number, number, never>) => {
    const prisonScaleResult = arcScale(prison.overcrowdingPercent/100);

    const radialLine = d3.lineRadial()
        .angle(d => d[0])      // angle in radians
        .radius(d => d[1]);    // radius in pixels

    const firstRadialPoint: [number, number] = [lineAngle,arcScale.range()[0]];
    const secondRadialPoint: [number,number] = [prisonAngle,prisonScaleResult];
    const linePath = radialLine([firstRadialPoint,secondRadialPoint]) || "";
    const endCoord = linePath
        .split("L")[1]
        .split(",")
        .reduce((acc,entry) => {
            acc.push(+entry);
            return acc
        },[] as number[]);
    const angleAsDegrees = (lineAngle/(Math.PI * 2)) * 360;
    return {linePath, endCoord, angleAsDegrees, stroke, dashArray, data: prison} as PrisonLine
}

export const getPrisonLines = (prison: ChartData, prisonAngle: number, prisonSlice:number, arcScale: d3.ScaleLinear<number, number, never>) => {
    const getLineAngle = (currentLineLength: number) => {
        if(currentLineLength === 0) return prisonAngle;
        if(currentLineLength === 1) return prisonAngle - (prisonSlice/3.5);
        return prisonAngle + (prisonSlice/3.5)
    }
    const lines: PrisonLine[] = [];
    // are there suicides?
    if(prison.suicides > 0){
        lines.push(getLine(prison,prisonAngle,prisonAngle,COLORS.red,"4,4",arcScale));
    }
    // is it in top 30 attempted suicides
    if(prison.top30Suicides){
        const nextAngle = getLineAngle(lines.length)
        lines.push(getLine(prison,nextAngle,prisonAngle,"white","4,4",arcScale));
    }
    // is it top 30 self harm
    if(prison.top30SelfHarm){
        const nextAngle = getLineAngle(lines.length)
        lines.push(getLine(prison,nextAngle,prisonAngle,"white","2,2",arcScale));
    }
    // nothing in lines - add white, ""
    if(lines.length === 0){
        lines.push(getLine(prison,prisonAngle,prisonAngle,"white","",arcScale))
    }

    lines.map((m,i) => m.showSquare = i === 0);

    return lines.reverse();
}

export const wrap = (text: d3.Selection<d3.BaseType, unknown, null, undefined>, wrapWidth: number): void => {
    text.each(function (this: d3.BaseType) {
        const currentText = this as SVGTextElement; // 'this' is the current SVGTextElement
        d3.select(currentText).selectAll("tspan").remove();
        let words = d3.select(currentText).text().split(/\s+/).reverse();
        let word = "";
        let line: string[] = [];
        let lineNumber = 0;
        let lineHeight = 1.1;
        let y = 0;
        let dy = 0;
        let tspan = d3.select(currentText)
            .text(null)
            .append("tspan")
            .attr("x", 0)
            .attr("y", y)
            .attr("dy", `${dy}em`);
        while (word = (words.pop() || "")) {
            line.push(word);
            tspan.text(line.join(" "));
            const tspanNode = tspan.node() || undefined;
            if (tspanNode && tspanNode.getComputedTextLength() > wrapWidth) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}
