export type Region = {
    "region": string;
    "shortName": string;
    "northToSouthOrder": number;
    "circle": "top" | "bottom";
}

export type ChartData = {
    id: string;
    type: string;
    municipality: string;
    region: string;
    suicides: number;
    attemptedSuicides:number;
    selfHarm:number;
    regulatoryRooms: number;
    nonRegulatoryRooms: number;
    totalPrisoners: number;
    overcrowdingAbsolute: number;
    overcrowdingPercent: number;
    expectedPolice: number;
    realPolice: number;
    differenceInPoliceNumbers: number;
    top30SelfHarm: boolean;
    top30Suicides: boolean;
}
export type CircleData = {
    name: string;
    prisonCount: number;
    pieOrder: number;
    data: ChartData[];
}
export type AllCircleData = {
    top: CircleData[];
    bottom: CircleData[]
}
export interface D3ChartProps {
    containerClass: string;
    chartData: ChartData[];
    regionData: Region[];
}

export type PrisonLine = {
    data: ChartData
    linePath: string;
    endCoord: [number, number];
    angleAsDegrees: number;
    stroke: string;
    dashArray: string;

    showSquare: boolean;
}
