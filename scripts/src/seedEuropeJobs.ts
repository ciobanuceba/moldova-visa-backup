import { db, jobsTable } from "@workspace/db";

const jobs = [
  // ── Construction Worker ──────────────────────────────────────────────────
  {
    title: "Construction Worker",
    category: "Construction",
    location: "Berlin, Germany",
    type: "Full-time",
    salary: "€2,200–€2,600/month",
    description: "German construction firm seeks construction workers for residential and commercial building projects across Berlin. Tasks include formwork, concrete work, and structural assembly under EU safety standards.",
    requirements: "1+ year construction experience. Basic German or English communication. EU work permit sponsorship provided.",
    benefits: "Work visa sponsorship, relocation assistance, health insurance, accommodation support for first 3 months. Vacancies: 6",
  },
  {
    title: "Construction Worker",
    category: "Construction",
    location: "Warsaw, Poland",
    type: "Full-time",
    salary: "€1,800–€2,100/month",
    description: "Large infrastructure contractor in Warsaw needs construction labourers for road and bridge projects. Modern equipment and safety-first culture.",
    requirements: "Physical fitness, willingness to relocate, basic safety awareness.",
    benefits: "Work permit assistance, shared accommodation, transport to site, EU-standard contract. Vacancies: 8",
  },

  // ── Warehouse Worker ─────────────────────────────────────────────────────
  {
    title: "Warehouse Worker",
    category: "Logistics",
    location: "Munich, Germany",
    type: "Full-time",
    salary: "€2,000–€2,300/month",
    description: "E-commerce fulfilment centre near Munich needs warehouse operatives for picking, packing, and inventory management using modern WMS systems.",
    requirements: "Basic IT literacy, ability to lift up to 25 kg, reliability. No German required — training provided.",
    benefits: "Full visa sponsorship, relocation flight reimbursed, subsidised housing, shift bonuses. Vacancies: 15",
  },
  {
    title: "Warehouse Worker",
    category: "Logistics",
    location: "Amsterdam, Netherlands",
    type: "Full-time",
    salary: "€2,100–€2,400/month",
    description: "International distribution centre near Amsterdam requires warehouse staff for order fulfilment and stock control on rotating shifts.",
    requirements: "Punctual, physically fit, comfortable working in a fast-paced environment.",
    benefits: "Work permit support, Dutch language classes, bike-to-work scheme, pension contribution. Vacancies: 10",
  },

  // ── Factory Worker ───────────────────────────────────────────────────────
  {
    title: "Factory Worker",
    category: "Manufacturing",
    location: "Prague, Czech Republic",
    type: "Full-time",
    salary: "€1,700–€2,000/month",
    description: "Automotive parts manufacturer near Prague seeks production line operators for assembly, quality inspection, and packaging.",
    requirements: "Attention to detail, willingness to work shifts, no prior experience required.",
    benefits: "Employer-sponsored work visa, dormitory-style housing, meal vouchers, annual bonus. Vacancies: 20",
  },
  {
    title: "Factory Worker",
    category: "Manufacturing",
    location: "Milan, Italy",
    type: "Full-time",
    salary: "€1,900–€2,200/month",
    description: "Textile and garment factory in the Milan area requires production workers for cutting, sewing, and finishing for European fashion brands.",
    requirements: "Basic sewing or machine-operation experience preferred. Reliable and detail-oriented.",
    benefits: "Visa sponsorship, transport allowance, staff canteen, EU labour contract. Vacancies: 12",
  },

  // ── Hotel Housekeeper ────────────────────────────────────────────────────
  {
    title: "Hotel Housekeeper",
    category: "Hospitality",
    location: "Vienna, Austria",
    type: "Full-time",
    salary: "€1,900–€2,200/month",
    description: "Five-star hotel in central Vienna seeks housekeepers to maintain guest rooms and public spaces to luxury standards.",
    requirements: "Previous housekeeping experience preferred. Attention to detail and presentation.",
    benefits: "Work visa sponsorship, staff accommodation, meals on shift, tips scheme. Vacancies: 8",
  },
  {
    title: "Hotel Housekeeper",
    category: "Hospitality",
    location: "Barcelona, Spain",
    type: "Seasonal",
    salary: "€1,600–€1,900/month",
    description: "Beachfront resort in Barcelona needs housekeeping staff for the peak tourist season, with possibility of permanent contract renewal.",
    requirements: "Physically active, customer service mindset, willingness to work weekends.",
    benefits: "Seasonal work permit support, staff accommodation, all meals included. Vacancies: 10",
  },

  // ── Waiter/Waitress ──────────────────────────────────────────────────────
  {
    title: "Waiter/Waitress",
    category: "Hospitality",
    location: "Paris, France",
    type: "Full-time",
    salary: "€1,900–€2,300/month (incl. tips)",
    description: "Well-known brasserie in central Paris seeks experienced waitstaff for lunch and dinner service, fine-dining standards.",
    requirements: "1+ year restaurant experience. Basic French or English communication.",
    benefits: "Work visa sponsorship, staff meals, tips retained, career development. Vacancies: 5",
  },
  {
    title: "Waiter/Waitress",
    category: "Hospitality",
    location: "Rome, Italy",
    type: "Full-time",
    salary: "€1,700–€2,000/month (incl. tips)",
    description: "Popular trattoria near the Rome city centre needs friendly, energetic waitstaff for a busy tourist-focused restaurant.",
    requirements: "Customer-facing experience, positive attitude, good memory for orders.",
    benefits: "Work permit assistance, staff meals, tips, flexible scheduling. Vacancies: 4",
  },

  // ── Cook ─────────────────────────────────────────────────────────────────
  {
    title: "Cook",
    category: "Hospitality",
    location: "Brussels, Belgium",
    type: "Full-time",
    salary: "€2,100–€2,500/month",
    description: "European restaurant group in Brussels seeks cooks for hot and cold kitchen sections, working with a diverse international menu.",
    requirements: "Culinary qualification or 2+ years cook experience.",
    benefits: "Work visa sponsorship, staff meals, career progression, paid training. Vacancies: 6",
  },
  {
    title: "Cook",
    category: "Hospitality",
    location: "Lisbon, Portugal",
    type: "Full-time",
    salary: "€1,800–€2,100/month",
    description: "Hotel restaurant in Lisbon needs a versatile cook for breakfast, lunch, and dinner service with seasonal menu updates.",
    requirements: "Minimum 1 year professional kitchen experience.",
    benefits: "Relocation and visa support, accommodation available, tips share. Vacancies: 3",
  },

  // ── Delivery Driver ──────────────────────────────────────────────────────
  {
    title: "Delivery Driver",
    category: "Logistics",
    location: "Frankfurt, Germany",
    type: "Full-time",
    salary: "€2,200–€2,600/month",
    description: "Logistics company in Frankfurt needs last-mile delivery drivers with category B licence. Company van provided.",
    requirements: "Valid category B driving licence, minimum 2 years driving experience, clean record.",
    benefits: "Work visa sponsorship, company vehicle, fuel card, performance bonuses. Vacancies: 10",
  },
  {
    title: "Delivery Driver",
    category: "Logistics",
    location: "Krakow, Poland",
    type: "Full-time",
    salary: "€1,700–€2,000/month",
    description: "Regional courier service in Krakow requires drivers for local and inter-city deliveries. Shifts available mornings and evenings.",
    requirements: "Category B licence (min. 1 year), smart appearance, customer-friendly attitude.",
    benefits: "Work permit assistance, company van, fuel, tips from customers. Vacancies: 6",
  },

  // ── Security Guard ───────────────────────────────────────────────────────
  {
    title: "Security Guard",
    category: "Security",
    location: "Dublin, Ireland",
    type: "Full-time",
    salary: "€2,300–€2,700/month",
    description: "Security services company in Dublin requires uniformed guards for retail, office, and industrial site protection.",
    requirements: "Security licence (or willingness to obtain with company support), physically fit, responsible.",
    benefits: "Work visa sponsorship, licence training paid by company, health insurance. Vacancies: 12",
  },

  // ── Electrician ──────────────────────────────────────────────────────────
  {
    title: "Electrician",
    category: "Trades",
    location: "Hamburg, Germany",
    type: "Full-time",
    salary: "€2,800–€3,300/month",
    description: "Electrical contractor in Hamburg needs qualified electricians for domestic and commercial installations, maintenance, and fault-finding.",
    requirements: "Qualified electrician (NVQ Level 3 or equivalent), valid electrical safety certificate.",
    benefits: "Work visa sponsorship, company vehicle, tool allowance, overtime at premium rate. Vacancies: 5",
  },
  {
    title: "Electrician",
    category: "Trades",
    location: "Zurich, Switzerland",
    type: "Full-time",
    salary: "€4,200–€4,800/month",
    description: "Industrial maintenance company near Zurich requires an experienced electrician for factory and building systems.",
    requirements: "Industrial electrical experience, commitment to strict safety procedures, EU/EFTA work permit eligible.",
    benefits: "Work permit sponsorship, high salary, relocation package, Swiss health insurance. Vacancies: 2",
  },

  // ── Plumber ──────────────────────────────────────────────────────────────
  {
    title: "Plumber",
    category: "Trades",
    location: "Copenhagen, Denmark",
    type: "Full-time",
    salary: "€3,000–€3,500/month",
    description: "Established plumbing and heating company in Copenhagen needs qualified plumbers for domestic and commercial installations.",
    requirements: "Qualified plumber with 2+ years experience, ability to interpret technical drawings.",
    benefits: "Work visa sponsorship, company van, on-call allowance, generous annual leave. Vacancies: 4",
  },

  // ── Welder ───────────────────────────────────────────────────────────────
  {
    title: "Welder",
    category: "Trades",
    location: "Rotterdam, Netherlands",
    type: "Full-time",
    salary: "€2,600–€3,000/month",
    description: "Shipyard and metal fabrication workshop in Rotterdam requires skilled welders for MIG, TIG, and arc welding of structural components.",
    requirements: "Certified welder (MIG/TIG minimum), ability to read technical drawings.",
    benefits: "Work permit sponsorship, all PPE supplied, welding certification renewal paid. Vacancies: 6",
  },

  // ── Nurse / Caregiver ────────────────────────────────────────────────────
  {
    title: "Elderly Care Assistant",
    category: "Healthcare",
    location: "Berlin, Germany",
    type: "Full-time",
    salary: "€2,400–€2,800/month",
    description: "Residential care home in Berlin seeks caring, patient staff to assist elderly residents with daily living activities.",
    requirements: "Compassionate attitude, basic German or willingness to learn, caregiving experience a plus.",
    benefits: "Work visa sponsorship, free German language courses, staff accommodation, health insurance. Vacancies: 10",
  },
  {
    title: "Nursing Assistant",
    category: "Healthcare",
    location: "Vienna, Austria",
    type: "Full-time",
    salary: "€2,300–€2,700/month",
    description: "Hospital in Vienna needs nursing assistants to support clinical staff with patient care, monitoring, and daily routines.",
    requirements: "Healthcare qualification or relevant experience, empathy and reliability.",
    benefits: "Work visa sponsorship, professional development, relocation support, health insurance. Vacancies: 8",
  },

  // ── Agricultural Worker ──────────────────────────────────────────────────
  {
    title: "Agricultural Worker",
    category: "Agriculture",
    location: "Andalusia, Spain",
    type: "Seasonal",
    salary: "€1,500–€1,800/month",
    description: "Large fruit and vegetable farm in Andalusia needs seasonal agricultural workers for harvesting and packing.",
    requirements: "Physical stamina, willingness to work outdoors in varying conditions.",
    benefits: "Seasonal work permit support, on-site accommodation, meals included, return travel paid. Vacancies: 20",
  },
  {
    title: "Greenhouse Worker",
    category: "Agriculture",
    location: "Almeria, Spain",
    type: "Seasonal",
    salary: "€1,400–€1,700/month",
    description: "Greenhouse vegetable producer in Almeria requires seasonal workers for planting, tending, and harvesting crops.",
    requirements: "No experience required, willingness to work in a hot climate, team player.",
    benefits: "Work permit assistance, shared accommodation, meals provided. Vacancies: 15",
  },
];

async function main() {
  console.log(`Seeding ${jobs.length} European job listings…`);

  const existingTitlesForLocations = await db
    .select({ id: jobsTable.id, location: jobsTable.location })
    .from(jobsTable);

  const alreadySeeded = existingTitlesForLocations.some((j) =>
    jobs.some((newJob) => newJob.location === j.location),
  );

  if (alreadySeeded) {
    console.log("⚠️  Some European jobs already appear to be in the database. Skipping seed to avoid duplicates.");
    process.exit(0);
  }

  const inserted = await db.insert(jobsTable).values(jobs).returning({ id: jobsTable.id });
  console.log(`✅ Inserted ${inserted.length} European jobs successfully.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
