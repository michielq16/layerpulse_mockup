import pptxgen from "pptxgenjs";

const DARK_BLUE="1E3A5C", GOLD="F5B800", SLATE="64748B", WHITE="FFFFFF",
      GREEN="73B505", AMBER="D97706", LIGHT_GRAY="F1F5F9", MED_BLUE="2E5A8C",
      LIGHT_SLATE="94A3B8", FONT="Segoe UI";
const makeShadow=()=>({type:"outer",color:"000000",blur:6,offset:2,angle:135,opacity:0.12});
const makeCardShadow=()=>({type:"outer",color:"000000",blur:4,offset:1,angle:135,opacity:0.1});

const pres=new pptxgen();
pres.layout="LAYOUT_16x9";
pres.author="FabricLab";
pres.title="LayerPulse — Persona-driven intelligence for Microsoft Fabric";

// ── helpers ──
function title(slide,t){ slide.addText(t,{x:0.8,y:0.4,w:8.4,h:0.7,fontSize:28,fontFace:FONT,color:DARK_BLUE,bold:true,align:"left",margin:0}); }
function quoteBox(slide,t){
  slide.addShape(pres.shapes.RECTANGLE,{x:0.8,y:1.25,w:8.4,h:1.05,fill:{color:LIGHT_GRAY},shadow:makeCardShadow()});
  slide.addShape(pres.shapes.RECTANGLE,{x:0.8,y:1.25,w:0.08,h:1.05,fill:{color:GOLD}});
  slide.addText([{text:t,options:{italic:true}}],{x:1.1,y:1.3,w:7.9,h:0.95,fontSize:14.5,fontFace:FONT,color:DARK_BLUE,align:"left",valign:"middle",margin:0});
}
function twoCol(slide,leftItems,rightItems){
  // left = job & needs (neutral), right = the problem (amber)
  slide.addShape(pres.shapes.RECTANGLE,{x:0.8,y:2.5,w:4.0,h:2.65,fill:{color:LIGHT_GRAY},shadow:makeCardShadow()});
  slide.addText("My job & information needs",{x:1.05,y:2.62,w:3.5,h:0.4,fontSize:14,fontFace:FONT,color:DARK_BLUE,bold:true,align:"left",margin:0});
  slide.addText(leftItems.map((t,i)=>({text:t,options:{bullet:true,breakLine:i<leftItems.length-1}})),
    {x:1.05,y:3.08,w:3.55,h:2.0,fontSize:12.5,fontFace:FONT,color:SLATE,align:"left",paraSpaceAfter:7});
  slide.addShape(pres.shapes.RECTANGLE,{x:5.0,y:2.5,w:4.2,h:2.65,fill:{color:LIGHT_GRAY},shadow:makeCardShadow()});
  slide.addShape(pres.shapes.RECTANGLE,{x:5.0,y:2.5,w:0.08,h:2.65,fill:{color:AMBER}});
  slide.addText("What I can't see today",{x:5.3,y:2.62,w:3.7,h:0.4,fontSize:14,fontFace:FONT,color:AMBER,bold:true,align:"left",margin:0});
  slide.addText(rightItems.map((t,i)=>({text:t,options:{bullet:true,breakLine:i<rightItems.length-1}})),
    {x:5.3,y:3.08,w:3.75,h:2.0,fontSize:12.5,fontFace:FONT,color:DARK_BLUE,align:"left",paraSpaceAfter:7});
}
function docBadge(slide,label){
  const w=label.length*0.105+0.5;
  slide.addShape(pres.shapes.RECTANGLE,{x:0.8,y:1.22,w:w,h:0.42,fill:{color:DARK_BLUE}});
  slide.addText("DOC  "+label,{x:0.8,y:1.22,w:w,h:0.42,fontSize:12.5,fontFace:FONT,color:WHITE,bold:true,align:"center",valign:"middle",margin:0});
  slide.addText("the insights LayerPulse surfaces",{x:0.85+w,y:1.22,w:8.4-w,h:0.42,fontSize:12,fontFace:FONT,color:SLATE,italic:true,align:"left",valign:"middle",margin:0});
}
function statGrid(slide,stats){
  const yStart=1.85, cardH=1.42, rowGap=1.6;
  stats.forEach((s,i)=>{
    const col=i%2, row=Math.floor(i/2);
    const x=0.8+col*4.4, y=yStart+row*rowGap;
    slide.addShape(pres.shapes.RECTANGLE,{x,y,w:4.0,h:cardH,fill:{color:LIGHT_GRAY},shadow:makeCardShadow()});
    slide.addShape(pres.shapes.RECTANGLE,{x,y,w:0.08,h:cardH,fill:{color:GOLD}});
    slide.addText(s.num,{x:x+0.28,y:y+0.1,w:3.5,h:0.62,fontSize:(s.num.length>4?28:40),fontFace:FONT,color:GOLD,bold:true,align:"left",valign:"bottom",margin:0});
    slide.addText(s.label,{x:x+0.3,y:y+0.74,w:3.5,h:0.6,fontSize:12,fontFace:FONT,color:SLATE,align:"left",valign:"top",margin:0});
  });
}
function ctaBar(slide,t){
  slide.addShape(pres.shapes.RECTANGLE,{x:0.8,y:5.08,w:8.4,h:0.45,fill:{color:DARK_BLUE}});
  slide.addText([{text:"CTA   ",options:{color:GOLD,bold:true}},{text:t,options:{color:WHITE}}],
    {x:1.05,y:5.08,w:8.0,h:0.45,fontSize:13.5,fontFace:FONT,align:"left",valign:"middle",margin:0});
}

// ════════ 1 · TITLE ════════
{
  const s=pres.addSlide(); s.background={color:DARK_BLUE};
  s.addText("LayerPulse",{x:0.8,y:1.5,w:8.4,h:0.9,fontSize:46,fontFace:FONT,color:WHITE,bold:true,align:"left",margin:0});
  s.addShape(pres.shapes.RECTANGLE,{x:0.8,y:2.5,w:2.5,h:0.05,fill:{color:GOLD}});
  s.addText("Persona-driven intelligence for Microsoft Fabric",{x:0.8,y:2.75,w:8.4,h:0.6,fontSize:22,fontFace:FONT,color:GOLD,align:"left",margin:0});
  s.addText("Four jobs. One platform. The decision — and the document to prove it.",{x:0.8,y:3.45,w:8.4,h:0.5,fontSize:16,fontFace:FONT,color:LIGHT_SLATE,align:"left",margin:0});
  s.addText("FabricLab  |  LayerPulse",{x:0.8,y:4.5,w:8.4,h:0.4,fontSize:16,fontFace:FONT,color:WHITE,align:"left",margin:0});
  s.addText("2026  |  Persona & scenario walkthrough",{x:0.8,y:4.95,w:8.4,h:0.35,fontSize:14,fontFace:FONT,color:LIGHT_SLATE,align:"left",margin:0});
}

// ════════ 2 · THESIS ════════
{
  const s=pres.addSlide();
  title(s,"Microsoft fragments. LayerPulse joins.");
  s.addText("Fabric keeps usage, cost, quality and governance in separate, half-finished portals. The answer is always one JOIN away — and nobody does the join. Four people feel that gap every day:",
    {x:0.8,y:1.2,w:8.4,h:0.8,fontSize:15,fontFace:FONT,color:SLATE,align:"left",margin:0});
  const ps=[
    {n:"BI Manager",d:"Is my estate healthy — and what do I tell the board?"},
    {n:"Data Engineer",d:"Which refresh failed, why — and what's inside this model?"},
    {n:"Governance",d:"Who exported what — and can I prove it to the auditor?"},
    {n:"FinOps",d:"What does BI cost — and where's the waste?"},
  ];
  ps.forEach((p,i)=>{
    const x=0.55+i*2.2;
    s.addShape(pres.shapes.RECTANGLE,{x,y:2.3,w:2.0,h:2.3,fill:{color:LIGHT_GRAY},shadow:makeCardShadow()});
    s.addShape(pres.shapes.RECTANGLE,{x,y:2.3,w:2.0,h:0.06,fill:{color:GOLD}});
    s.addText(p.n,{x:x+0.15,y:2.45,w:1.7,h:0.7,fontSize:15,fontFace:FONT,color:DARK_BLUE,bold:true,align:"left",valign:"top",margin:0});
    s.addText(p.d,{x:x+0.15,y:3.15,w:1.7,h:1.35,fontSize:12,fontFace:FONT,color:SLATE,align:"left",valign:"top",margin:0});
  });
  s.addText([{text:"“Microsoft gives you the data in ten places. We give you the decision in one.”",options:{italic:true}}],
    {x:0.8,y:4.85,w:8.4,h:0.5,fontSize:18,fontFace:FONT,color:DARK_BLUE,align:"center",margin:0});
}

// ════════ 3-4 · BI MANAGER ════════
{
  const s=pres.addSlide(); title(s,"The BI Manager");
  quoteBox(s,"“I'm the BI Manager at a global offshore-energy operator. My team runs ~500 Power BI workspaces and 1,700 semantic models across the fleet. The board asks if our BI is healthy — and I can't answer in one number.”");
  twoCol(s,
    ["Own the health of the entire BI estate","Report status to leadership & the CFO","Know what's failing, what's used, what it costs","Decide what to fix, retire, or invest in"],
    ["Fabric shows fragments — never one answer","I hear about refresh failures from angry users","No idea which of thousands of reports are used","Can't split the capacity bill by business unit"]);
}
{
  const s=pres.addSlide(); title(s,"LayerPulse for the BI Manager");
  docBadge(s,"BI Estate Briefing");
  statGrid(s,[
    {num:"1",label:"estate verdict + 4-item action register (REMEDIATE today)"},
    {num:"70%",label:"of 4,796 reports unopened in the last 30 days"},
    {num:"67.9%",label:"refresh success — one in three refreshes fails"},
    {num:"100%",label:"of capacity spend attributed, by workspace"},
  ]);
  ctaBar(s,"One read-only connection → an estate briefing in your inbox every month.");
}

// ════════ 5-6 · DATA ENGINEER ════════
{
  const s=pres.addSlide(); title(s,"The Data Engineer");
  quoteBox(s,"“I'm a Data Engineer on the BI platform team. I build the semantic models, write the DAX and Power Query, and I'm on the hook when refreshes go red. Most model knowledge lives in people's heads.”");
  twoCol(s,
    ["Design models · author DAX & Power Query","Keep scheduled refreshes green","See inside any model — DAX, sources, lineage","Onboard to unfamiliar models fast"],
    ["A refresh fails — I see THAT, never WHY","Model logic is undocumented tribal knowledge","Onboarding to a model = days of spelunking","No single source of truth per model"]);
}
{
  const s=pres.addSlide(); title(s,"LayerPulse for the Data Engineer");
  docBadge(s,"Reliability Diagnostic + Single-Model Dossier");
  statGrid(s,[
    {num:"32.7%",label:"of refreshes failing — a reliability, not latency, problem"},
    {num:"100%",label:"-fail clusters pinpointed by name (e.g. R2R Guyana / Asia)"},
    {num:"47",label:"measures — DAX, sources, lineage, owners — in one dossier"},
    {num:"min",label:"to onboard a model, vs days of manual archaeology"},
  ]);
  ctaBar(s,"Generate a full dossier for any of your 1,700 models, on demand.");
}

// ════════ 7 · DOSSIER SPOTLIGHT ════════
{
  const s=pres.addSlide(); title(s,"Spotlight: the Single-Model Dossier");
  s.addText("RetailOperations — the whole model in 8 pages: metadata · DAX · Power Query · refresh · ownership · glossary · CU/cost · quality.",
    {x:0.8,y:1.18,w:8.4,h:0.5,fontSize:14,fontFace:FONT,color:SLATE,align:"left",margin:0});
  statGrid(s,[
    {num:"47",label:"measures — all with DAX and descriptions"},
    {num:"13",label:"tables · 18 relationships — a clean, fully-mapped star"},
    {num:"0%",label:"refresh — 56/56 failed, stale 89 days"},
    {num:"1",label:"root cause named: Power Query reads an unreachable local path"},
  ]);
  s.addText([{text:"Verdict: ",options:{color:SLATE}},{text:"well-built, operationally dead",options:{color:AMBER,bold:true}},{text:" — and LayerPulse names the exact fix.",options:{color:DARK_BLUE}}],
    {x:0.8,y:5.1,w:8.4,h:0.4,fontSize:15,fontFace:FONT,align:"center",margin:0});
}

// ════════ 8-9 · GOVERNANCE ════════
{
  const s=pres.addSlide(); title(s,"The Governance & Compliance Lead");
  quoteBox(s,"“I'm the Governance & Compliance lead. When the auditor calls, I'm the one who has to produce evidence — fast, and defensible. Today that's a manual fire-drill across portals.”");
  twoCol(s,
    ["Govern access, data export, tenant config","Prove SOC 2 / audit controls on demand","Know who exported or shared what, and when","Track the tenant's export & guest posture"],
    ["Evidence is scattered across portals + 30-day logs","Assembling a SOC 2 pack is a manual fire-drill","No off-hours / anomalous-access view","Can't prove a control without screenshots"]);
}
{
  const s=pres.addSlide(); title(s,"LayerPulse for Governance & Compliance");
  docBadge(s,"SOC 2 Access & Export Evidence Pack");
  statGrid(s,[
    {num:"8,035",label:"export/share ops logged — who · when · IP · target"},
    {num:"884",label:"users · 692 source IPs across the audit window"},
    {num:"166",label:"tenant switches captured, point-in-time"},
    {num:"3/4",label:"CC6 controls evidenced — gaps flagged, not faked"},
  ]);
  ctaBar(s,"Hand the auditor an evidence pack — generated, not assembled.");
}

// ════════ 10-11 · FINOPS ════════
{
  const s=pres.addSlide(); title(s,"The FinOps / Capacity Owner");
  quoteBox(s,"“I own FinOps and capacity. Finance asks me 'what does BI cost, and is it worth it?' — and today I genuinely can't answer at the business-unit level. The bill is one opaque number.”");
  twoCol(s,
    ["Size capacity · attribute cost · cut waste","Split the capacity bill by business unit","Spot over-subscription before it bites","Find spend that delivers no value"],
    ["The capacity bill is one opaque number","The portal says 'healthy' while we're over-subscribed","No view of which workspaces drive the cost","Can't tell value-spend from waste"]);
}
{
  const s=pres.addSlide(); title(s,"LayerPulse for FinOps");
  docBadge(s,"Wasted-Spend Analysis + FinOps cockpit");
  statGrid(s,[
    {num:"$10K",label:"/mo bill attributed to workspace at 99.7%"},
    {num:"349%",label:"true capacity utilization — the portal said 'healthy'"},
    {num:"$1.25K",label:"/mo orphan-suspect spend surfaced for review"},
    {num:"0",label:"fabricated numbers — fixed bill, waste flagged not inflated"},
  ]);
  ctaBar(s,"Answer the CFO and find the waste — without faking a number.");
}

// ════════ 12 · WHY TRUST IT ════════
{
  const s=pres.addSlide(); title(s,"Why you can trust it");
  const cards=[
    {t:"Reproducible from your own tenant",d:"Every number traces back to a query against your live Fabric data — not a demo, not sample data."},
    {t:"It refuses to invent",d:"Where data is missing it says so — RLS evaluation not yet captured, dataflow lineage needed — rather than faking a green light."},
    {t:"Honest cost, never inflated",d:"Cost is your real fixed capacity bill, attributed by usage — never multiplied by utilization to look bigger."},
    {t:"Read-only and in-tenant",d:"Service-principal, read-only. Your data stays in your Azure tenant. Nothing leaves."},
  ];
  cards.forEach((c,i)=>{
    const y=1.35+i*0.92;
    s.addShape(pres.shapes.RECTANGLE,{x:0.8,y,w:8.4,h:0.8,fill:{color:LIGHT_GRAY},shadow:makeCardShadow()});
    s.addShape(pres.shapes.RECTANGLE,{x:0.8,y,w:0.08,h:0.8,fill:{color:GREEN}});
    s.addText(c.t,{x:1.1,y:y+0.08,w:7.9,h:0.35,fontSize:15,fontFace:FONT,color:DARK_BLUE,bold:true,align:"left",margin:0});
    s.addText(c.d,{x:1.1,y:y+0.42,w:7.9,h:0.35,fontSize:12.5,fontFace:FONT,color:SLATE,align:"left",margin:0});
  });
  s.addText([{text:"“The honesty is the differentiator — it's what makes the documents presentable to a CFO or an auditor.”",options:{italic:true}}],
    {x:0.8,y:5.1,w:8.4,h:0.4,fontSize:14,fontFace:FONT,color:DARK_BLUE,align:"center",margin:0});
}

// ════════ 13 · NEXT STEPS ════════
{
  const s=pres.addSlide(); title(s,"Getting started");
  const steps=[{num:"1",t:"Connect, read-only",time:"Now"},{num:"2",t:"Your personas instrumented",time:"2 weeks"},{num:"3",t:"Continuous docs + cockpit",time:"1 month"}];
  steps.forEach((step,i)=>{
    const x=0.8+i*3.1;
    s.addShape(pres.shapes.OVAL,{x:x+0.85,y:2.0,w:0.7,h:0.7,fill:{color:GOLD}});
    s.addText(step.num,{x:x+0.85,y:2.0,w:0.7,h:0.7,fontSize:24,fontFace:FONT,color:DARK_BLUE,bold:true,align:"center",valign:"middle",margin:0});
    s.addText(step.t,{x,y:2.9,w:2.6,h:0.6,fontSize:16,fontFace:FONT,color:DARK_BLUE,bold:true,align:"center",margin:0});
    s.addText(step.time,{x,y:3.5,w:2.6,h:0.4,fontSize:14,fontFace:FONT,color:SLATE,align:"center",margin:0});
    if(i<steps.length-1) s.addText("→",{x:x+2.6,y:1.9,w:0.5,h:0.6,fontSize:28,fontFace:FONT,color:GOLD,bold:true,align:"center",valign:"middle"});
  });
  s.addText("All four documents above are generated from one read-only connection — and refresh continuously.",
    {x:0.8,y:4.4,w:8.4,h:0.5,fontSize:15,fontFace:FONT,color:SLATE,align:"center",margin:0});
}

// ════════ 14 · CLOSING ════════
{
  const s=pres.addSlide(); s.background={color:DARK_BLUE};
  s.addText("Microsoft gives you the data in ten places.",{x:0.5,y:1.7,w:9.0,h:0.8,fontSize:30,fontFace:FONT,color:WHITE,bold:true,align:"center",margin:0});
  s.addText("LayerPulse gives you the decision in one.",{x:0.5,y:2.5,w:9.0,h:0.9,fontSize:38,fontFace:FONT,color:GOLD,bold:true,align:"center",margin:0});
  s.addShape(pres.shapes.RECTANGLE,{x:4.0,y:3.6,w:2.0,h:0.04,fill:{color:GOLD}});
  s.addText("FabricLab  |  LayerPulse",{x:0.5,y:3.9,w:9.0,h:0.4,fontSize:18,fontFace:FONT,color:WHITE,align:"center",margin:0});
  s.addText("And the document to prove it.",{x:0.5,y:4.4,w:9.0,h:0.4,fontSize:16,fontFace:FONT,color:GOLD,align:"center",margin:0});
}

const outPath="docs/decks/LayerPulse-Personas-2026-05-29.pptx";
pres.writeFile({fileName:outPath}).then(()=>{console.log("Saved: "+outPath);console.log("Slides: "+pres.slides.length);}).catch(e=>console.error("Error:",e));
