// Real benchmarks from the official Florida Early Learning and Developmental
// Standards: 4 Years Old to Kindergarten (2017), Form OEL-VPK 15.
// Source: https://flbt5.floridaearlylearning.com/docs/OEL-VPK154yo.pdf
//
// IDs follow the document's own hierarchy so each is traceable back to the PDF:
//   Domain (I-VIII) . Component (A-H) [. sub-component (a-d)] . Standard (1-n) [. Benchmark (a-f)]
// Some domains (Mathematical Thinking, Approaches to Learning, Social Studies,
// Creative Arts) state expectations at the standard level rather than breaking out
// lettered benchmarks; those entries are coded to the standard.
//
// This is a curated subset across all eight domains, not the complete document.
// To add more, open the PDF and follow the same { id, ageBand, domain, text } shape.
// Wording is lightly condensed from the official text; spot-check against the PDF.

export const BENCHMARKS = [
  // I. Physical Development
  { id: "I.B.a.1.b", ageBand: "4-K", domain: "Physical Development", text: "Demonstrates coordinated movement in skills such as jumping for height and distance, hopping and running." },
  { id: "I.B.c.2.c", ageBand: "4-K", domain: "Physical Development", text: "Uses coordinated movements to complete complex tasks such as cutting along a line, pouring, buttoning, zipping, snapping and lacing." },
  { id: "I.A.d.1.b", ageBand: "4-K", domain: "Physical Development", text: "Recognizes nutritious food choices and healthy eating habits." },

  // II. Approaches to Learning
  { id: "II.A.1", ageBand: "4-K", domain: "Approaches to Learning", text: "Shows increased curiosity and is eager to learn new things and have new experiences." },
  { id: "II.C.1", ageBand: "4-K", domain: "Approaches to Learning", text: "Approaches daily activities with creativity and inventiveness." },

  // III. Social and Emotional Development
  { id: "III.A.1.a", ageBand: "4-K", domain: "Social & Emotional", text: "Recognizes the emotions of peers and responds with empathy and compassion." },
  { id: "III.B.1.a", ageBand: "4-K", domain: "Social & Emotional", text: "Recognizes and names own emotions and exhibits behavioral control with or without adult support." },
  { id: "III.C.2.b", ageBand: "4-K", domain: "Social & Emotional", text: "Maintains friendships and engages in prosocial behavior such as cooperating, compromising and turn-taking." },
  { id: "III.C.3.a", ageBand: "4-K", domain: "Social & Emotional", text: "Independently engages in simple social problem solving, offering solutions and reflecting on whether they worked." },

  // IV. Language and Literacy
  { id: "IV.A.3.a", ageBand: "4-K", domain: "Language & Literacy", text: "Achieves mastery of two-step directions and usually follows three-step directions." },
  { id: "IV.C.1.a", ageBand: "4-K", domain: "Language & Literacy", text: "Demonstrates understanding of age-appropriate vocabulary across many topic areas." },
  { id: "IV.C.2.a", ageBand: "4-K", domain: "Language & Literacy", text: "Uses a large speaking vocabulary, adding new words weekly and using them appropriately in context." },
  { id: "IV.F.2.a", ageBand: "4-K", domain: "Language & Literacy", text: "Distinguishes individual words within spoken phrases or sentences." },
  { id: "IV.F.3.c", ageBand: "4-K", domain: "Language & Literacy", text: "Names most letters when shown an uppercase or lowercase letter." },
  { id: "IV.F.3.d", ageBand: "4-K", domain: "Language & Literacy", text: "Recognizes some letter sounds." },
  { id: "IV.F.4.a", ageBand: "4-K", domain: "Language & Literacy", text: "Retells or reenacts a story with increasing accuracy and complexity after it is read aloud." },
  { id: "IV.G.1.c", ageBand: "4-K", domain: "Language & Literacy", text: "Writes own name, not necessarily with full correct spelling or well-formed letters." },

  // V. Mathematical Thinking
  { id: "V.A.2", ageBand: "4-K", domain: "Mathematical Thinking", text: "Counts and identifies the number sequence 1 to 31." },
  { id: "V.A.3", ageBand: "4-K", domain: "Mathematical Thinking", text: "Demonstrates one-to-one correspondence when counting objects placed in a row (one to 15 and beyond)." },
  { id: "V.A.4", ageBand: "4-K", domain: "Mathematical Thinking", text: "Understands the last number spoken tells how many, up to 10 (cardinality)." },
  { id: "V.C.1", ageBand: "4-K", domain: "Mathematical Thinking", text: "Identifies and extends a simple AB repeating pattern." },
  { id: "V.D.1", ageBand: "4-K", domain: "Mathematical Thinking", text: "Recognizes and names two-dimensional shapes (circle, square, triangle, rectangle) of different size and orientation." },
  { id: "V.D.2", ageBand: "4-K", domain: "Mathematical Thinking", text: "Describes, sorts and classifies shapes using attributes such as size and number of sides." },
  { id: "V.F.2", ageBand: "4-K", domain: "Mathematical Thinking", text: "Identifies measurable attributes such as length and weight and compares objects directly." },

  // VI. Scientific Inquiry
  { id: "VI.A.3.a", ageBand: "4-K", domain: "Scientific Inquiry", text: "Makes predictions and tests them through experimentation and investigation." },
  { id: "VI.B.1.a", ageBand: "4-K", domain: "Scientific Inquiry", text: "Identifies characteristics of a variety of plants and animals, including physical attributes and behaviors." },
  { id: "VI.B.1.c", ageBand: "4-K", domain: "Scientific Inquiry", text: "Understands that all living things grow, change and go through life cycles." },
  { id: "VI.C.1.d", ageBand: "4-K", domain: "Scientific Inquiry", text: "Investigates and describes changing states of matter: liquid, solid and gas." },
  { id: "VI.D.1.c", ageBand: "4-K", domain: "Scientific Inquiry", text: "Explores and discusses observations of the clouds, sun, moon and stars." },
  { id: "VI.E.1.c", ageBand: "4-K", domain: "Scientific Inquiry", text: "Identifies organized efforts to protect the environment, such as recycling materials in the classroom." },

  // VII. Social Studies
  { id: "VII.A.4", ageBand: "4-K", domain: "Social Studies", text: "Explores cultural attributes by comparing characteristics such as language, music, foods and celebrations." },
  { id: "VII.C.2", ageBand: "4-K", domain: "Social Studies", text: "Explains the role of groups within a community." },
  { id: "VII.G.1", ageBand: "4-K", domain: "Social Studies", text: "Recognizes the difference between wants and needs." },

  // VIII. Creative Expression Through the Arts
  { id: "VIII.A.1", ageBand: "4-K", domain: "Creative Arts", text: "Combines with intention a variety of open-ended, process-oriented art materials." },
  { id: "VIII.B.1", ageBand: "4-K", domain: "Creative Arts", text: "Actively participates in a variety of individual and group musical activities." },
  { id: "VIII.C.1", ageBand: "4-K", domain: "Creative Arts", text: "Engages in individual and group movement activities to express thoughts, feelings and experiences." },
];
