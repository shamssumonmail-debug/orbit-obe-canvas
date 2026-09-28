export const obeCounters = {
  programs: 3,
  courses: 8,
  faculty: 24,
  students: 612,
};

export const setupRings = [
  { label: "Course Outcome Setup", value: 41, total: 48 },
  { label: "Corrective Measures", value: 6, total: 40 },
  { label: "Program Outcome Setup", value: 30, total: 34 },
  { label: "Calculated Attainment", value: 111, total: 140 },
];

export const pendingMapping = [
  { group: "TYBAF - A", CO1: 2, CO2: 3, CO3: 2, CO4: 2, CO5: 2, CO6: 2 },
  { group: "TYBAF - B", CO1: 2, CO2: 2, CO3: 3, CO4: 2, CO5: 2, CO6: 2 },
  { group: "TYBAF - C", CO1: 3, CO2: 2, CO3: 2, CO4: 2, CO5: 2, CO6: 2 },
  { group: "TYBAF - D", CO1: 2, CO2: 2, CO3: 2, CO4: 3, CO5: 2, CO6: 2 },
  { group: "TYBAF - E", CO1: 2, CO2: 2, CO3: 2, CO4: 2, CO5: 3, CO6: 2 },
  { group: "TYBSC IT - A", CO1: 12, CO2: 11, CO3: 12, CO4: 13, CO5: 13, CO6: 12 },
  { group: "TYBSC IT - B", CO1: 12, CO2: 12, CO3: 11, CO4: 13, CO5: 13, CO6: 13 },
];

export const coSeries = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"] as const;

export const attainmentByPo = [
  { po: "PO1", actual: 1.5, target: 2.5 },
  { po: "PO2", actual: 1.6, target: 2.5 },
  { po: "PO3", actual: 0.9, target: 2.5 },
  { po: "PO4", actual: 2.1, target: 2.5 },
  { po: "PO5", actual: 1.6, target: 2.5 },
  { po: "PO6", actual: 0.9, target: 2.5 },
];

export const cognitiveDistribution = [
  { name: "Apply", value: 20 },
  { name: "Understand", value: 20 },
  { name: "Remember", value: 20 },
  { name: "Analyze", value: 25 },
  { name: "Evaluate", value: 15 },
];

export const attainmentTrend = [
  { term: "2021-22", direct: 1.8, indirect: 2.1 },
  { term: "2022-23", direct: 2.0, indirect: 2.2 },
  { term: "2023-24", direct: 2.3, indirect: 2.3 },
  { term: "2024-25", direct: 2.5, indirect: 2.4 },
];

export const institutionProfile = {
  name: "Vidyapeeth Institute of Technology",
  code: "VMIOT-2411",
  affiliatedTo: "State Technological University",
  accreditation: "NAAC A+ / NBA Tier-I",
  academicYear: "2024-25",
  term: "Term 1",
  email: "office@vmiot.edu.in",
  phone: "+91 20 4567 8900",
  website: "https://vmiot.edu.in",
  addressLine: "Plot 14, Education Hub Road",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411045",
  vision:
    "To be a centre of excellence in outcome based technical education, producing globally competent and socially responsible professionals.",
  mission:
    "Deliver outcome driven curriculum, foster research culture, and continuously improve attainment through structured assessment.",
  attainmentScale: "3",
  targetAttainment: "2.5",
  enableIndirectFeedback: true,
  autoCalculateAttainment: true,
};

export type InstitutionProfile = typeof institutionProfile;
