export const TACTIC_ORDER = [
  "reconnaissance","resource-development","initial-access","execution",
  "persistence","privilege-escalation","defense-evasion","credential-access",
  "discovery","lateral-movement","collection","command-and-control","exfiltration","impact",
];

export const TACTIC_SHORT = {
  "reconnaissance":"RECON","resource-development":"RES DEV","initial-access":"INIT ACC",
  "execution":"EXEC","persistence":"PERSIST","privilege-escalation":"PRIV ESC",
  "defense-evasion":"DEF EVA","credential-access":"CRED ACC","discovery":"DISCOV",
  "lateral-movement":"LAT MOV","collection":"COLLECT","command-and-control":"C2",
  "exfiltration":"EXFIL","impact":"IMPACT",
};

export const TACTIC_CLR = {
  "reconnaissance":"#3b82f6","resource-development":"#6366f1","initial-access":"#ef4444",
  "execution":"#f97316","persistence":"#f59e0b","privilege-escalation":"#eab308",
  "defense-evasion":"#14b8a6","credential-access":"#a855f7","discovery":"#0ea5e9",
  "lateral-movement":"#06b6d4","collection":"#22c55e","command-and-control":"#8b5cf6",
  "exfiltration":"#ec4899","impact":"#f43f5e",
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
