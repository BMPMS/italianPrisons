import D3Chart from "@/app/components/D3Chart";
import chartData from "@/app/data/chartData.json";
import regionMapper from "@/app/data/regionMapper.json"
import {Region} from "@/app/components/D3Chart_types";
export default function Home() {

    const regionData = regionMapper as Region[];

  return (
      <>
          <div className={"floatingDiv"}>The aim here is to accurately reproduce Valerie's beautiful visualisation in d3 to demonstrate my skills and show that I can build a typescripted React app from scratch.<br /> <br /> I've also added a little bit of interactivity.  <br /> <br /> Huge thanks for Valeria for giving me permission to work on this.<br /> <br />  <a href="https://www.linkedin.com/posts/valeriabeccari_dataviz-datibenecomune-informationdesign-activity-7292590337795981312-3fer?utm_source=share&utm_medium=member_desktop&rcm=ACoAACARFfUBpGLAsNXbOfTx0YgTrs0fy3krcwA" target="_blank" rel="noopener noreferrer">More about the design here</a></div>
          <div className="d3ChartContainer grid  items-center justify-items-center min-h-screen p-0 font-[family-name:var(--font-figtree)]">
                 <D3Chart
                  containerClass={"d3Chart"}
                  chartData={chartData}
                  regionData={regionData}
              />
          </div>
      </>

  );
}
