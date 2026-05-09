export const TACTIC_ORDER = [
  "reconnaissance","resource-development","initial-access","execution",
  "persistence","privilege-escalation","stealth","defense-impairment","credential-access",
  "discovery","lateral-movement","collection","command-and-control","exfiltration","impact",
];

export const TACTIC_SHORT = {
  "reconnaissance":"RECON","resource-development":"RES DEV","initial-access":"INIT ACC",
  "execution":"EXEC","persistence":"PERSIST","privilege-escalation":"PRIV ESC",
  "stealth":"STEALTH","defense-impairment":"DEF IMP","credential-access":"CRED ACC","discovery":"DISCOV",
  "lateral-movement":"LAT MOV","collection":"COLLECT","command-and-control":"C2",
  "exfiltration":"EXFIL","impact":"IMPACT",
};

export const TACTIC_CLR = {
  "reconnaissance":"#3b82f6","resource-development":"#6366f1","initial-access":"#ef4444",
  "execution":"#f97316","persistence":"#f59e0b","privilege-escalation":"#eab308",
  "stealth":"#14b8a6","defense-impairment":"#0f766e","credential-access":"#a855f7","discovery":"#0ea5e9",
  "lateral-movement":"#06b6d4","collection":"#22c55e","command-and-control":"#8b5cf6",
  "exfiltration":"#ec4899","impact":"#f43f5e",
};

export const TACTIC_INFO = {
  "reconnaissance":       { id:"TA0043", name:"Reconnaissance",        desc:"The adversary is trying to gather information they can use to plan future operations." },
  "resource-development": { id:"TA0042", name:"Resource Development",   desc:"The adversary is trying to establish resources they can use to support operations." },
  "initial-access":       { id:"TA0001", name:"Initial Access",         desc:"The adversary is trying to get into your network." },
  "execution":            { id:"TA0002", name:"Execution",              desc:"The adversary is trying to run malicious code." },
  "persistence":          { id:"TA0003", name:"Persistence",            desc:"The adversary is trying to maintain their foothold." },
  "privilege-escalation": { id:"TA0004", name:"Privilege Escalation",   desc:"The adversary is trying to gain higher-level permissions." },
  "stealth":              { id:"TA0005", name:"Stealth",                desc:"The adversary is trying to hide and conceal their actions, appearing as normal behavior." },
  "defense-impairment":  { id:"TA0112", name:"Defense Impairment",     desc:"The adversary is trying to break security mechanisms, pipelines, and tooling so defenders can't see or trust what's happening." },
  "credential-access":    { id:"TA0006", name:"Credential Access",      desc:"The adversary is trying to steal account names and passwords." },
  "discovery":            { id:"TA0007", name:"Discovery",              desc:"The adversary is trying to figure out your environment." },
  "lateral-movement":     { id:"TA0008", name:"Lateral Movement",       desc:"The adversary is trying to move through your environment." },
  "collection":           { id:"TA0009", name:"Collection",             desc:"The adversary is trying to gather data of interest to their goal." },
  "command-and-control":  { id:"TA0011", name:"Command and Control",    desc:"The adversary is trying to communicate with compromised systems to control them." },
  "exfiltration":         { id:"TA0010", name:"Exfiltration",           desc:"The adversary is trying to steal data." },
  "impact":               { id:"TA0040", name:"Impact",                 desc:"The adversary is trying to manipulate, interrupt, or destroy your systems and data." },
};

export const COUNTRY_META = {
  CN: { flag:"🇨🇳", label:"China",       color:"#ef4444" },
  RU: { flag:"🇷🇺", label:"Russia",      color:"#3b82f6" },
  NK: { flag:"🇰🇵", label:"N. Korea",    color:"#a855f7" },
  IR: { flag:"🇮🇷", label:"Iran",        color:"#f97316" },
  VN: { flag:"🇻🇳", label:"Vietnam",     color:"#22c55e" },
  UNK:{ flag:"🏴",  label:"Unknown",     color:"#6b7280" },
};

// Platform groups for impact analysis filter
export const PLATFORM_GROUPS = {
  Windows:  ["Windows"],
  Linux:    ["Linux"],
  macOS:    ["macOS"],
  Cloud:    ["IaaS","Azure AD","Google Workspace","SaaS","Office 365","Identity Provider"],
  ICS:      ["Engineering Workstation","Field Controller/RTU/PLC/IED","Human-Machine Interface",
              "Input/Output Server","Safety Instrumentation System/Protection Relay","Data Historian"],
  Network:  ["Network Devices","Network"],
  Containers:["Containers"],
};

export const INDUSTRIES = [
  "All Industries","Financial","Healthcare","Energy/Utilities","Defense/Government",
  "Telecommunications","Manufacturing","Retail","Education","Critical Infrastructure","Technology",
];
