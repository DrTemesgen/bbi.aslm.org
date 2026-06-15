/* BBI Africa — data layer
   ----------------------------------------------------------------
   • metrics / pillars / timeline / news / partners  -> based on public
     BBI communications from Africa CDC and ASLM (2019–2025).
   • directory[]  -> ILLUSTRATIVE SAMPLE PROFILES only, included to
     demonstrate the professional directory. Replace with the official
     roster of certified professionals when available.
   ---------------------------------------------------------------- */
window.BBI = window.BBI || {};

BBI.regions = [
  { key: 'central', name: 'Central Africa', color: '#1c7d61' },
  { key: 'eastern', name: 'Eastern Africa', color: '#13654d' },
  { key: 'northern', name: 'Northern Africa', color: '#e0a92e' },
  { key: 'southern', name: 'Southern Africa', color: '#1f6feb' },
  { key: 'western', name: 'Western Africa', color: '#c0392b' }
];

// The four official technical areas of the Regional Training & Certification
// Program for Biosafety & Biosecurity Professionals (RTCPBBP, Africa CDC BBI).
BBI.certTypes = [
  { key: 'brm', abbr: 'BRM', name: 'Biorisk Management', color: '#0f4f3c', order: 0,
    desc: 'Assessing and managing biological risk in laboratories and programmes.',
    eligibility: 'Degree or diploma (3–4 years) in Human/Animal/Environmental Health, Biotechnology, Microbiology or a related field.' },
  { key: 'bce', abbr: 'BCE', name: 'Biocontainment Engineering', color: '#1f6feb', order: 1,
    desc: 'Design, commissioning and operation of containment laboratory engineering systems.',
    eligibility: 'Engineering or Biomedical degree/diploma relevant to facility and containment systems.' },
  { key: 'bwm', abbr: 'BWM', name: 'Biological Waste Management', color: '#b4861e', order: 2,
    desc: 'Safe handling, treatment and disposal of biological and laboratory waste.',
    eligibility: 'Degree or diploma (3–4 years) in Human/Animal/Environmental Health, Biotechnology, Microbiology or a related field.' },
  { key: 'bsc', abbr: 'BSC', name: 'Certification of Biological Safety Cabinets', color: '#1c7d61', order: 3,
    desc: 'Field certification, testing and safe use of biological safety cabinets.',
    eligibility: 'Engineering/Biomedical degree, or a technical/vocational qualification relevant to safety-cabinet certification.' },
  { key: 'cba', abbr: 'CBA', name: 'Cyberbiosecurity & AI', color: '#6d4aab', order: 4,
    desc: 'Securing biological data, digital laboratory systems and AI tools against cyber and information threats.',
    eligibility: 'Background in IT/cybersecurity, bioinformatics, data science or laboratory information systems, with relevant experience.' }
];

// RTCP-BBP certification levels
BBI.certLevels = [
  { key: 'I', name: 'Level I', desc: 'Foundational competency — entry practitioners building core skills in the discipline.' },
  { key: 'II', name: 'Level II', desc: 'Intermediate competency — practitioners applying skills independently in their setting.' },
  { key: 'SME', name: 'SME (Subject Matter Expert)', desc: 'Recognised subject-matter expert who leads, trains and advises others in the discipline.' }
];

// RTCP-BBP pathways
BBI.pathways = [
  { key: 'direct', name: 'Direct (Training) Pathway', desc: 'Complete the structured training courses and assessments leading to certification.' },
  { key: 'alternative', name: 'Alternative Pathway', desc: 'For experienced professionals — certify based on prior qualifications and demonstrated experience, assessed against the proficiency matrix.' }
];

// Required application documents (Alternative Pathway EOI)
BBI.requiredDocs = [
  'Background statement aligning your qualifications and experience to the desired certification level',
  'Capability statement describing relevant work history, methodologies and results',
  'Current Curriculum Vitae (CV)',
  'Three references (current, not older than 3 years) with contact details',
  'Electronic copies of degrees, diplomas, professional registrations and training certificates'
];

BBI.certSteps = [
  { icon: '📚', title: 'Prepare', text: 'Study the competency framework and use preparation resources and regional training to get exam-ready.' },
  { icon: '📝', title: 'Apply & take the exam', text: 'Submit your application and sit the certification examination for your chosen discipline.' },
  { icon: '🔁', title: 'Maintain', text: 'Keep your credential current through continuing professional development and periodic renewal.' }
];

BBI.metrics = {
  memberStates: 55,
  twgs: 5,
  certified: 400,
  trainings: 30,
  countriesEngaged: 47,
  legalFrameworks: 1,
  institutionsCertified: 18
};

// Editable home-page content (admin can override via settings/home).
BBI.home = {
  heroTitle: 'Securing Africa against biological threats',
  heroLead: 'The <strong>Biosafety &amp; Biosecurity Initiative (BBI)</strong> strengthens the systems that prevent, detect and respond to accidental and deliberate biological threats — across all 55 African Union Member States, in line with IHR (2005), the Biological Weapons Convention and UNSCR 1540.',
  stats: [
    { num: 55, suffix: '', label: 'AU Member States', sub: 'Continental coverage' },
    { num: 5, suffix: '', label: 'Regional TWGs', sub: 'Operationalised' },
    { num: 400, suffix: '+', label: 'Professionals certified', sub: '2021–2025' },
    { num: 1, suffix: '', label: 'AU-endorsed framework', sub: 'Regional legal basis' }
  ]
};

// The 6 domains of the Regional BSBS Legal Framework (AU Member States, 2023)
BBI.domains = [
  { n: 1, icon: '🏛️', title: 'Lead Agency / Institution',
    text: 'Authorisation and establishment of an agency or institution responsible for regulating and managing national biosafety and biosecurity systems.' },
  { n: 2, icon: '📐', title: 'National Standards',
    text: 'Development of national standards for biosafety and biosecurity, aligned to the regional framework and international requirements.' },
  { n: 3, icon: '🔬', title: 'Biological Risk Assessment',
    text: 'Establishing the authority for biological risk assessment of agents and toxins of concern.' },
  { n: 4, icon: '🧪', title: 'Laboratory & Facility Regulation',
    text: 'Regulation of laboratory and facility-level requirements for handling High Consequence Agents and Toxins (HCATs).' },
  { n: 5, icon: '🎓', title: 'Education & Human Resources',
    text: 'Education, training and human-resource requirements for all personnel who possess, use, manipulate, store, transfer or destroy/incinerate HCATs.' },
  { n: 6, icon: '🚚', title: 'Transfer, Storage & Disposal',
    text: 'Governing the safe transfer, storage and disposal of High Consequence Agents and Toxins (HCATs).' }
];

// The six official BBI priority areas (Africa CDC BBI 2021–2025 Strategic Plan):
// two enabling efforts + four operational priorities.
BBI.pillars = [
  { n: 1, kind: 'Enabling', title: 'Strategic focus at Africa CDC', icon: '🎯',
    text: 'Enable Africa CDC to form a strategic focus on biosafety and biosecurity and to effectively implement, evaluate and measure the impact of the BBI.' },
  { n: 2, kind: 'Enabling', title: 'Continental & Regional TWGs', icon: '⚙️',
    text: 'Establish and operationalise five multisectoral, multi-expert Regional Biosafety & Biosecurity Technical Working Groups (RBB-TWGs) and a continental TWG.' },
  { n: 3, kind: 'Operational', title: 'Legal Framework', icon: '⚖️',
    text: 'Develop an African Union–endorsed biosafety and biosecurity legal framework for use across AU Member States.' },
  { n: 4, kind: 'Operational', title: 'Institutional Certification', icon: '🏛️',
    text: 'Establish a regulatory and certification framework for institutions handling High Consequence Agents and Toxins (HCAT).' },
  { n: 5, kind: 'Operational', title: 'Training & Certification', icon: '🎓',
    text: 'Establish a regional training and certification programme for biosafety and biosecurity experts.' },
  { n: 6, kind: 'Operational', title: 'National Capabilities', icon: '🛡️',
    text: 'Strengthen AU Member States’ capabilities — including National Public Health Institutes and National Reference Laboratories — to prevent, detect and respond to accidental or deliberate biological events.' }
];

BBI.timeline = [
  { yr: 'May 2019', title: 'BBI launched', text: 'Africa CDC launches the Regional Biosafety and Biosecurity Initiative with AU Member States and global partners.' },
  { yr: '2020–2021', title: 'Regional TWGs operationalised', text: 'Five Regional Biosafety & Biosecurity Technical Working Groups established across Africa’s regions.' },
  { yr: '2022', title: 'Legal framework endorsed', text: 'The regional Biosafety and Biosecurity Legal Framework is endorsed by the African Union.' },
  { yr: '2023–2024', title: 'Training & certification scales', text: 'Regional Training and Certification Programme expands; 400+ professionals certified across the continent.' },
  { yr: '2025', title: 'Five-year review', text: 'Africa CDC and ASLM complete a five-year review, charting a new continental strategy.' },
  { yr: '2026–2030', title: 'New strategy', text: 'National TWGs and professional associations, sustainable domestic funding and ethical R&D become priorities.' }
];

// Country engagement by region (status: active / emerging / planned)
BBI.countries = [
  // Eastern
  { name: 'Kenya', region: 'eastern', status: 'active' },
  { name: 'Ethiopia', region: 'eastern', status: 'active' },
  { name: 'Tanzania', region: 'eastern', status: 'active' },
  { name: 'Uganda', region: 'eastern', status: 'active' },
  { name: 'Rwanda', region: 'eastern', status: 'active' },
  { name: 'South Sudan', region: 'eastern', status: 'emerging' },
  // Western
  { name: 'Nigeria', region: 'western', status: 'active' },
  { name: 'Senegal', region: 'western', status: 'active' },
  { name: 'Ghana', region: 'western', status: 'active' },
  { name: "Côte d'Ivoire", region: 'western', status: 'active' },
  { name: 'Mali', region: 'western', status: 'emerging' },
  { name: 'Burkina Faso', region: 'western', status: 'emerging' },
  // Northern
  { name: 'Egypt', region: 'northern', status: 'active' },
  { name: 'Morocco', region: 'northern', status: 'active' },
  { name: 'Tunisia', region: 'northern', status: 'active' },
  { name: 'Algeria', region: 'northern', status: 'emerging' },
  { name: 'Libya', region: 'northern', status: 'planned' },
  // Southern
  { name: 'South Africa', region: 'southern', status: 'active' },
  { name: 'Zambia', region: 'southern', status: 'active' },
  { name: 'Zimbabwe', region: 'southern', status: 'active' },
  { name: 'Botswana', region: 'southern', status: 'emerging' },
  { name: 'Mozambique', region: 'southern', status: 'emerging' },
  // Central
  { name: 'Cameroon', region: 'central', status: 'active' },
  { name: 'DR Congo', region: 'central', status: 'active' },
  { name: 'Gabon', region: 'central', status: 'emerging' },
  { name: 'Chad', region: 'central', status: 'planned' }
];

BBI.trainings = [
  { title: 'Advanced BioRisk Management', level: 'Advanced', mode: 'In-person', dur: '5 days',
    desc: 'Comprehensive biorisk assessment, mitigation and management for laboratory and programme leaders.' },
  { title: 'Regional Training & Certification Programme', level: 'Certification', mode: 'Blended', dur: 'Multi-module',
    desc: 'Flagship pathway that certifies biosafety and biosecurity professionals to a harmonised regional standard.' },
  { title: 'Advanced Biological Waste Management', level: 'Advanced', mode: 'In-person', dur: '4 days',
    desc: 'Safe handling, treatment and disposal of biological waste — delivered in Dar es Salaam, Tanzania.' },
  { title: 'Laboratory Equipment Maintenance & Calibration', level: 'Technical', mode: 'In-person', dur: '5 days',
    desc: 'Regional training strengthening equipment reliability and metrology in reference laboratories.' },
  { title: 'Biosafety & Biosecurity Legal Framework', level: 'Policy', mode: 'Workshop', dur: '3 days',
    desc: 'Orientation for regulators and policymakers on enacting national legislation aligned to the AU framework.' },
  { title: 'Pathogen & Toxin Control for High-Containment Facilities', level: 'Specialist', mode: 'In-person', dur: '5 days',
    desc: 'Control measures and accountability for institutions handling high-consequence agents and toxins.' }
];

BBI.news = [
  { d: '15', m: 'Feb', y: '2026', region: 'eastern', tag: 'Mission',
    title: 'Africa CDC mission to Nairobi advances national TWG roadmap',
    text: 'Technical mission supports Kenya in operationalising a National Biosafety & Biosecurity Technical Working Group.' },
  { d: '18', m: 'Jan', y: '2026', region: 'eastern', tag: 'Mission',
    title: 'Africa CDC mission to Mombasa on cross-border biosecurity',
    text: 'Engagement on harmonised biosafety and biosecurity practices at points of entry along the corridor.' },
  { d: '02', m: 'Dec', y: '2025', region: 'eastern', tag: 'Training',
    title: 'Advanced Biological Waste Management training, Dar es Salaam',
    text: 'Regional practitioners trained on safe treatment and disposal of biological waste.' },
  { d: '20', m: 'Nov', y: '2025', region: 'western', tag: 'Training',
    title: 'Northern Africa experts convene in Dakar for regional training',
    text: 'Regional biosafety and biosecurity training strengthens harmonised practice across borders.' },
  { d: '30', m: 'Oct', y: '2025', region: 'northern', tag: 'Strategy',
    title: 'North Africa consultative meeting on the 2026–2030 strategy',
    text: 'Africa CDC concludes a regional consultation shaping the next five-year biosafety and biosecurity strategy.' },
  { d: '12', m: 'Sep', y: '2025', region: 'central', tag: 'Strategy',
    title: 'Five-year BBI review charts new continental strategy',
    text: 'Africa CDC and ASLM complete a five-year review, paving the way for a new harmonised framework.' }
];

BBI.resources = [
  { type: 'PDF', title: 'Regional Biosafety & Biosecurity Legal Framework (2023)', meta: 'Africa CDC, AU-PANVAC & AU-IBAR · Framework', cat: 'Framework', url: 'resources/regional-bsbs-legal-framework-2023.pdf' },
  { type: 'PDF', title: 'BBI 2021–2025 Strategic Plan', meta: 'Africa CDC · Strategy', cat: 'Strategy', url: 'resources/The-Africa-CDC-5-Year-Strategic-Plan_Final_13-June-2021_FINAL_23June2021-2.pdf' },
  { type: 'PAGE', title: 'Training & Certification Programme — guide (RTCP-BBP)', meta: 'BBI · Programme', cat: 'Training', url: 'program.html' },
  { type: 'PDF', title: 'Regional Training & Certification Program for Biosafety & Biosecurity Professionals (2022)', meta: 'Africa CDC · Training', cat: 'Training', url: 'resources/Training-and-Certification-Program-for-Biosafety-and-Biosecurity-Professionals_English.pdf' },
  { type: 'PDF', title: 'BBI 2021–2025 End-Term Evaluation Report', meta: 'Africa CDC · Evaluation', cat: 'Evaluation', url: 'resources/BSBS-2021-2025-FINAL-Evaluation-Report.pdf' },
  { type: 'PDF', title: 'Biosafety & Biosecurity Strategy 2026–2030 (Phase III)', meta: 'Africa CDC · Strategy', cat: 'Strategy', url: 'resources/bbi-strategy-2026-2030-africacdc.pdf' },
  { type: 'PDF', title: 'BioRisk Management Field Guide', meta: 'Africa CDC · Guidance', cat: 'Guidance' },
  { type: 'PDF', title: 'Institutional Certification Standard for High-Consequence Facilities', meta: 'Africa CDC · Standard', cat: 'Standard' },
  { type: 'LINK', title: 'LabVoice: The next five years of Biosafety & Biosecurity', meta: 'ASLM · Podcast', cat: 'Media', url: 'https://aslm.org/resource/labvoice-empawering-africas-future-the-next-five-years-of-biosafety-and-biosecurity/' },
  { type: 'LINK', title: 'ASLM Biosafety & Biosecurity programme page', meta: 'ASLM · Web', cat: 'Web', url: 'https://aslm.org/quality-systems-standards-regulation-and-accreditation/biosafety-biosecurity/' },
  // ---- Knowledge Hub: curated external references ----
  { type: 'LINK', title: 'WHO Laboratory Biosafety Manual (4th edition)', meta: 'World Health Organization · Guidance', cat: 'Guidance', url: 'https://www.who.int/publications/i/item/9789240011311' },
  { type: 'LINK', title: 'IFBA Certification & Professional Register', meta: 'International Federation of Biosafety Associations', cat: 'Certification', url: 'https://internationalbiosafety.org/certification/' },
  { type: 'LINK', title: 'Africa CDC — Biosafety & Biosecurity', meta: 'Africa CDC · Web', cat: 'Web', url: 'https://africacdc.org/' },
  { type: 'LINK', title: 'Biological Weapons Convention (BWC)', meta: 'UNODA · Treaty', cat: 'Policy', url: 'https://disarmament.unoda.org/biological-weapons/' },
  { type: 'LINK', title: 'International Health Regulations (IHR 2005)', meta: 'WHO · Framework', cat: 'Policy', url: 'https://www.who.int/health-topics/international-health-regulations' }
];

// ---- ILLUSTRATIVE SAMPLE PROFILES — replace with the official roster ----
// certs: keys into BBI.certTypes, each with the year achieved.
// mentor: available in the mentorship programme. hero: spotlight citation (or '').
BBI.directory = [
  { id: 'amara-okonkwo', name: 'Dr Amara Okonkwo', role: 'Regional TWG Chair', org: 'Nigeria CDC', country: 'Nigeria', region: 'western', specialties: ['Biorisk Management', 'Policy'], level: 'SME',
    certs: [{ t: 'brm', y: 2019 }, { t: 'bce', y: 2021 }], mentor: true,
    hero: 'Chairs the West Africa RBB-TWG and has championed national biosafety legislation across the region.',
    bio: 'Amara leads regional coordination of biosafety and biosecurity policy in West Africa, bridging laboratory practice and national regulation under a One Health approach.' },
  { id: 'lydia-mwangi', name: 'Dr Lydia Mwangi', role: 'Biosafety Officer', org: 'Kenya Medical Research Institute', country: 'Kenya', region: 'eastern', specialties: ['Laboratory Biosafety', 'Training'], level: 'Level II',
    certs: [{ t: 'brm', y: 2020 }, { t: 'bsc', y: 2022 }], mentor: true,
    hero: '',
    bio: 'Lydia oversees laboratory biosafety at KEMRI and trains the next generation of biosafety officers across Eastern Africa.' },
  { id: 'samuel-tadesse', name: 'Dr Samuel Tadesse', role: 'National Reference Lab Lead', org: 'Ethiopian Public Health Institute', country: 'Ethiopia', region: 'eastern', specialties: ['Pathogen Control', 'Diagnostics'], level: 'Level II',
    certs: [{ t: 'bwm', y: 2021 }], mentor: false, hero: '',
    bio: 'Samuel leads Ethiopia’s national reference laboratory, strengthening diagnostics and pathogen control for outbreak preparedness.' },
  { id: 'fatima-el-amrani', name: 'Dr Fatima El-Amrani', role: 'Biosecurity Regulator', org: 'Institut Pasteur de Tunis', country: 'Tunisia', region: 'northern', specialties: ['Regulation', 'Legal Framework'], level: 'SME',
    certs: [{ t: 'bce', y: 2020 }, { t: 'brm', y: 2018 }], mentor: true,
    hero: 'A leading voice for harmonised biosecurity regulation across North Africa.',
    bio: 'Fatima advises on national biosecurity regulation and the domestication of the AU legal framework in North Africa.' },
  { id: 'thabo-nkosi', name: 'Dr Thabo Nkosi', role: 'Biorisk Manager', org: 'NICD', country: 'South Africa', region: 'southern', specialties: ['High Containment', 'Waste Management'], level: 'Level II',
    certs: [{ t: 'bce', y: 2019 }, { t: 'bwm', y: 2017 }], mentor: true, hero: '',
    bio: 'Thabo manages biorisk in high-containment facilities at the NICD and advises on biological waste management.' },
  { id: 'aicha-diallo', name: 'Dr Aïcha Diallo', role: 'Training Coordinator', org: 'Institut Pasteur de Dakar', country: 'Senegal', region: 'western', specialties: ['Training', 'Certification'], level: 'SME',
    certs: [{ t: 'brm', y: 2018 }, { t: 'bwm', y: 2021 }], mentor: true,
    hero: 'Has trained hundreds of professionals through the regional certification programme.',
    bio: 'Aïcha coordinates the regional training and certification programme, mentoring candidates from across Francophone Africa.' },
  { id: 'jean-paul-mbarga', name: 'Dr Jean-Paul Mbarga', role: 'Laboratory Director', org: 'Centre Pasteur du Cameroun', country: 'Cameroon', region: 'central', specialties: ['Laboratory Biosafety', 'Equipment'], level: 'Level II',
    certs: [{ t: 'bsc', y: 2021 }, { t: 'brm', y: 2020 }], mentor: false, hero: '',
    bio: 'Jean-Paul directs laboratory operations and equipment reliability at the Centre Pasteur du Cameroun.' },
  { id: 'grace-banda', name: 'Dr Grace Banda', role: 'Biosafety Specialist', org: 'Zambia National Public Health Institute', country: 'Zambia', region: 'southern', specialties: ['Biorisk Management', 'Surveillance'], level: 'Level I',
    certs: [{ t: 'brm', y: 2022 }], mentor: false, hero: '',
    bio: 'Grace supports biosafety and disease surveillance systems at the Zambia NPHI.' },
  { id: 'yusuf-abdallah', name: 'Dr Yusuf Abdallah', role: 'Biosecurity Analyst', org: 'Tanzania NPHL', country: 'Tanzania', region: 'eastern', specialties: ['Pathogen Control', 'Policy'], level: 'Level I',
    certs: [{ t: 'brm', y: 2022 }], mentor: false, hero: '',
    bio: 'Yusuf analyses biosecurity risks and supports pathogen accountability at Tanzania’s national health laboratory.' },
  { id: 'mariam-coulibaly', name: 'Dr Mariam Coulibaly', role: 'Programme Officer', org: "Ministry of Health, Côte d'Ivoire", country: "Côte d'Ivoire", region: 'western', specialties: ['Policy', 'Coordination'], level: 'Level I',
    certs: [{ t: 'brm', y: 2023 }], mentor: false, hero: '',
    bio: 'Mariam coordinates national biosafety and biosecurity activities within the Ivorian Ministry of Health.' },
  { id: 'ahmed-hassan', name: 'Dr Ahmed Hassan', role: 'BioRisk Advisor', org: 'Egyptian Ministry of Health', country: 'Egypt', region: 'northern', specialties: ['High Containment', 'Regulation'], level: 'Level II',
    certs: [{ t: 'bce', y: 2020 }, { t: 'bsc', y: 2021 }], mentor: true, hero: '',
    bio: 'Ahmed advises on biorisk for high-containment facilities and regulatory compliance in Egypt.' },
  { id: 'esther-uwimana', name: 'Dr Esther Uwimana', role: 'Quality & Biosafety Lead', org: 'Rwanda Biomedical Centre', country: 'Rwanda', region: 'eastern', specialties: ['Laboratory Biosafety', 'Accreditation'], level: 'Level II',
    certs: [{ t: 'brm', y: 2020 }, { t: 'bwm', y: 2022 }], mentor: true,
    hero: 'Drove laboratory accreditation and biosafety quality systems at the Rwanda Biomedical Centre.',
    bio: 'Esther leads quality and biosafety at the RBC, integrating accreditation with biorisk management.' },
  { id: 'kwame-mensah', name: 'Dr Kwame Mensah', role: 'Biosafety Officer', org: 'Noguchi Memorial Institute', country: 'Ghana', region: 'western', specialties: ['Training', 'Waste Management'], level: 'Level I',
    certs: [{ t: 'bwm', y: 2023 }], mentor: false, hero: '',
    bio: 'Kwame supports biosafety training and biological waste management at the Noguchi Memorial Institute.' },
  { id: 'nadia-benali', name: 'Dr Nadia Benali', role: 'Regulatory Affairs Lead', org: 'Institut Pasteur du Maroc', country: 'Morocco', region: 'northern', specialties: ['Legal Framework', 'Policy'], level: 'SME',
    certs: [{ t: 'brm', y: 2019 }], mentor: true, hero: '',
    bio: 'Nadia leads regulatory affairs and supports the alignment of Moroccan law with the AU framework.' },
  { id: 'patrick-lukusa', name: 'Dr Patrick Lukusa', role: 'High-Containment Specialist', org: 'INRB', country: 'DR Congo', region: 'central', specialties: ['High Containment', 'Pathogen Control'], level: 'Level II',
    certs: [{ t: 'bce', y: 2021 }, { t: 'brm', y: 2019 }], mentor: true,
    hero: 'Operates one of Central Africa’s key high-containment laboratories on the front line of outbreak response.',
    bio: 'Patrick specialises in high-containment operations and pathogen control at the INRB in Kinshasa.' },
  { id: 'tendai-moyo', name: 'Dr Tendai Moyo', role: 'Biosafety Trainer', org: 'Zimbabwe NMRL', country: 'Zimbabwe', region: 'southern', specialties: ['Training', 'Certification'], level: 'Level II',
    certs: [{ t: 'brm', y: 2020 }, { t: 'bsc', y: 2022 }], mentor: true, hero: '',
    bio: 'Tendai trains and certifies biosafety practitioners across Southern Africa.' }
];

BBI.events = [
  { id: 'global-voices-2026', d: '22', m: 'Jan', y: '2026', loc: 'Arusha, Tanzania', type: 'Conference', reg: true,
    title: 'Global Voices in Biosafety & Biosecurity', region: 'eastern',
    desc: 'Annual gathering celebrating diversity and sharing best practice in biosafety and biosecurity across Africa and beyond.' },
  { id: 'biorisk-cert-dakar-2026', d: '10', m: 'Mar', y: '2026', loc: 'Dakar, Senegal', type: 'Training', reg: true,
    title: 'Regional Biorisk Management Certification Course', region: 'western',
    desc: 'Five-day intensive preparing candidates for the Biorisk Management certification examination.' },
  { id: 'north-africa-legal-2026', d: '05', m: 'May', y: '2026', loc: 'Cairo, Egypt', type: 'Workshop', reg: true,
    title: 'North Africa Legal Framework Domestication Workshop', region: 'northern',
    desc: 'Regulators and policymakers work through enacting national legislation aligned to the AU framework.' },
  { id: 'high-containment-jhb-2026', d: '18', m: 'Jul', y: '2026', loc: 'Johannesburg, South Africa', type: 'Training', reg: false,
    title: 'High-Containment Facilities Operations Course', region: 'southern',
    desc: 'Specialist training for biocontainment facility operators and engineers.' },
  { id: 'continental-summit-kigali-2026', d: '09', m: 'Sep', y: '2026', loc: 'Kigali, Rwanda', type: 'Summit', reg: false,
    title: 'Continental Biosafety Leadership Summit', region: 'eastern',
    desc: 'TWG chairs and national focal points review progress on the 2026–2030 strategy.' }
];

BBI.getInvolved = [
  { icon: '🎓', title: 'Get certified', text: 'Apply to the regional training and certification programme and earn a recognised, portable credential.', cta: 'Apply now', href: 'apply.html' },
  { icon: '🧭', title: 'Find a mentor', text: 'Connect with experienced professionals through the mentorship programme to grow your career.', cta: 'Mentorship', href: 'mentorship.html' },
  { icon: '🤝', title: 'Join a National TWG', text: 'Contribute to your country’s biosafety and biosecurity technical working group or professional association.', cta: 'Express interest', href: '#join' },
  { icon: '🌍', title: 'Partner with the BBI', text: 'Institutions and funders can collaborate to strengthen biosafety and biosecurity systems across Africa.', cta: 'Contact us', href: 'mailto:academy@aslm.org' }
];

// Examination & Certification Committee (ECC).
// Content reflects the ECC overview presented at the BCE training, Dar es Salaam,
// 15–19 June 2026 (Noel Odhiambo, ECC Member). Leadership names remain
// ILLUSTRATIVE SAMPLES pending the official roster.
BBI.ecc = {
  about: 'The Examination and Certification Committee (ECC) is the independent body that safeguards the standards of the Regional Training and Certification Programme for Biosafety and Biosecurity Professionals (RTCP-BBP) — Priority Area 3 of the BBI. Working through three guiding principles — coordination, standardization and quality — it oversees competency-based assessment across three levels, reviews applications, and awards and renews the professional certification of biosafety and biosecurity practitioners across Africa. Certification is delivered through Regional Centres of Excellence and feeds the African Union Register of Biosafety and Biosecurity Professionals.',
  mandate: [
    { icon: '🔗', title: 'Coordinate', text: 'Coordinate training and certification across the Regional Centres of Excellence and partner institutions so practitioners meet one harmonised continental standard.' },
    { icon: '📐', title: 'Standardize', text: 'Define and maintain the competency standards, proficiency matrices and assessment criteria for each certification area and level.' },
    { icon: '✅', title: 'Assure quality', text: 'Evaluate Expressions of Interest and candidate evidence against a structured, weighted matrix, and protect the fairness, consistency and credibility of the programme.' },
    { icon: '🎓', title: 'Certify & maintain', text: 'Confirm competency and award certification, oversee renewal and continuing professional development, and maintain the African Union Register of Biosafety and Biosecurity Professionals.' }
  ],
  leadership: [
    { name: 'Prof. [Chairperson]', role: 'Chairperson', org: 'Africa CDC', country: 'Continental' },
    { name: 'Dr [Vice-Chair]', role: 'Vice-Chairperson', org: 'ASLM', country: 'Continental' },
    { name: 'Dr [Secretary]', role: 'Secretary', org: 'BBI Secretariat', country: 'Continental' }
  ],
  members: [
    { name: 'Noel Odhiambo', role: 'ECC Member · Senior Technical Adviser (Biosafety & Biosecurity; Emergency Preparedness & Response)', org: 'Amref Health Africa in Kenya', country: 'Kenya' },
    { name: 'Dr [Member]', role: 'Biorisk Management expert', country: 'Western Africa' },
    { name: 'Dr [Member]', role: 'Biocontainment Engineering expert', country: 'Southern Africa' },
    { name: 'Dr [Member]', role: 'Biological Waste Management expert', country: 'Eastern Africa' },
    { name: 'Dr [Member]', role: 'Biosafety Cabinets expert', country: 'Northern Africa' },
    { name: 'Dr [Member]', role: 'Cyberbiosecurity & AI expert', country: 'Central Africa' }
  ],
  history: [
    { yr: '2022', title: 'ECC established', text: 'The committee was constituted under the BBI to govern the new Regional Training and Certification Programme (RTCP-BBP).' },
    { yr: '2023', title: 'Standards adopted & first Centre of Excellence', text: 'Proficiency matrices and evaluation criteria endorsed for the core technical areas; the Eastern Africa Regional Centre of Excellence is operationalised at the National Public Health Laboratory (NPHL), Dar es Salaam, Tanzania.' },
    { yr: '2024', title: 'First cohorts certified & Western Centre', text: 'The ECC reviews and certifies the first cohorts of professionals; the Western Africa Regional Centre of Excellence opens at Institut Pasteur de Dakar, Senegal.' },
    { yr: '2025–2030', title: 'Scaling up', text: 'Three of five Regional Centres of Excellence operational — including Southern Africa (RDDC, NICD/NHLS, Johannesburg) — with competency-based certification across three levels, an expanding African Union Register and strengthened CPD oversight.' }
  ]
};

BBI.helpers = {
  regionName(key) {
    const r = (BBI.regions || []).find(x => x.key === key);
    return r ? r.name : key;
  },
  regionColor(key) {
    const r = (BBI.regions || []).find(x => x.key === key);
    return r ? r.color : '#13654d';
  },
  initials(name) {
    return name.replace(/^Dr\.?\s+/i, '').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  },
  avatarColor(seed) {
    const palette = ['#0f4f3c', '#13654d', '#1c7d61', '#b4861e', '#1f6feb', '#c0392b', '#6d4aab'];
    let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  },
  certType(key) {
    return (BBI.certTypes || []).find(c => c.key === key) || { abbr: key, name: key, color: '#13654d', desc: '' };
  },
  person(id) {
    return (BBI.directory || []).find(p => p.id === id) || null;
  },
  // Distinct level values from a roster, ordered by seniority; unknown (admin-added) levels sort alphabetically after.
  sortedLevels(list) {
    const ORDER = ['Level I', 'Level II', 'SME'];
    return [...new Set((list || []).map(p => p.level).filter(Boolean))].sort((a, b) => {
      const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return a.localeCompare(b);
    });
  }
};
