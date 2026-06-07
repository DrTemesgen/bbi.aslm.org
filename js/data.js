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

// Professional certification disciplines (modelled on IFBA's certification areas)
BBI.certTypes = [
  { key: 'brm', abbr: 'BRM', name: 'Biorisk Management', color: '#0f4f3c',
    desc: 'Core competency in assessing and managing biological risk in laboratories and programmes.' },
  { key: 'bsc', abbr: 'BSC', name: 'Biosafety Cabinets', color: '#1c7d61',
    desc: 'Selection, certification and safe use of biological safety cabinets and primary containment.' },
  { key: 'bcf', abbr: 'BCF', name: 'Biocontainment Facilities', color: '#1f6feb',
    desc: 'Design, commissioning and operation of high- and maximum-containment laboratory facilities.' },
  { key: 'bph', abbr: 'BPH', name: 'Biosafety & Public Health', color: '#b4861e',
    desc: 'Applying biosafety in public-health laboratories, surveillance and outbreak response.' },
  { key: 'bbn', abbr: 'BBN', name: 'Biosecurity & Biological Nonproliferation', color: '#c0392b',
    desc: 'Pathogen security, accountability and prevention of deliberate misuse of biological agents.' }
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

BBI.pillars = [
  { n: 1, title: 'Regional Technical Working Groups', icon: '⚙️',
    text: 'Establish and operationalise five regional, multisectoral Biosafety & Biosecurity Technical Working Groups (RBB-TWGs) to coordinate implementation and monitoring across the continent.' },
  { n: 2, title: 'Legal & Regulatory Framework', icon: '⚖️',
    text: 'Develop and roll out a harmonised, African Union–endorsed regional legislative framework so Member States can enact and align national biosafety and biosecurity regulations.' },
  { n: 3, title: 'Training & Certification', icon: '🎓',
    text: 'Deliver a Regional Training and Certification Programme that turns biosafety and biosecurity into a recognised professional discipline with certified practitioners.' },
  { n: 4, title: 'Institutional Certification', icon: '🏛️',
    text: 'Build a regulatory and certification programme for institutions and laboratories that manage high-consequence pathogens, agents and toxins.' },
  { n: 5, title: 'National Systems Strengthening', icon: '🛡️',
    text: 'Strengthen National Public Health Institutions and National Reference Laboratories to prevent, detect and respond to accidental and deliberate biological threats.' }
];

BBI.timeline = [
  { yr: 'May 2019', title: 'BBI launched', text: 'Africa CDC launches the Regional Biosafety and Biosecurity Initiative with AU Member States and global partners.' },
  { yr: '2020–2021', title: 'Regional TWGs operationalised', text: 'Five Regional Biosafety & Biosecurity Technical Working Groups established across Africa’s regions.' },
  { yr: '2022', title: 'Legal framework endorsed', text: 'The regional Biosafety and Biosecurity Legal Framework is endorsed by the African Union.' },
  { yr: '2023–2024', title: 'Training & certification scales', text: 'Regional Training and Certification Programme expands; 400+ professionals certified across the continent.' },
  { yr: '2025', title: 'Five-year review', text: 'Africa CDC and ASLM complete a five-year review, charting a new continental strategy.' },
  { yr: '2025–2030', title: 'New strategy', text: 'National TWGs and professional associations, sustainable domestic funding and ethical R&D become priorities.' }
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
    title: 'North Africa consultative meeting on the 2025–2030 strategy',
    text: 'Africa CDC concludes a regional consultation shaping the next five-year biosafety and biosecurity strategy.' },
  { d: '12', m: 'Sep', y: '2025', region: 'central', tag: 'Strategy',
    title: 'Five-year BBI review charts new continental strategy',
    text: 'Africa CDC and ASLM complete a five-year review, paving the way for a new harmonised framework.' }
];

BBI.resources = [
  { type: 'PDF', title: 'Regional Biosafety & Biosecurity Legal Framework (2023)', meta: 'Africa CDC, AU-PANVAC & AU-IBAR · Framework', cat: 'Framework', url: 'resources/regional-bsbs-legal-framework-2023.pdf' },
  { type: 'PDF', title: '2025–2030 Continental Biosafety & Biosecurity Strategy', meta: 'Africa CDC · Strategy', cat: 'Strategy' },
  { type: 'DOC', title: 'Regional Training & Certification Programme Curriculum', meta: 'ASLM Academy · Training', cat: 'Training' },
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
  { id: 'amara-okonkwo', name: 'Dr Amara Okonkwo', role: 'Regional TWG Chair', org: 'Nigeria CDC', country: 'Nigeria', region: 'western', specialties: ['Biorisk Management', 'Policy'], level: 'Lead',
    certs: [{ t: 'brm', y: 2019 }, { t: 'bbn', y: 2021 }], mentor: true,
    hero: 'Chairs the West Africa RBB-TWG and has championed national biosafety legislation across the region.',
    bio: 'Amara leads regional coordination of biosafety and biosecurity policy in West Africa, bridging laboratory practice and national regulation under a One Health approach.' },
  { id: 'lydia-mwangi', name: 'Dr Lydia Mwangi', role: 'Biosafety Officer', org: 'Kenya Medical Research Institute', country: 'Kenya', region: 'eastern', specialties: ['Laboratory Biosafety', 'Training'], level: 'Senior',
    certs: [{ t: 'brm', y: 2020 }, { t: 'bsc', y: 2022 }], mentor: true,
    hero: '',
    bio: 'Lydia oversees laboratory biosafety at KEMRI and trains the next generation of biosafety officers across Eastern Africa.' },
  { id: 'samuel-tadesse', name: 'Dr Samuel Tadesse', role: 'National Reference Lab Lead', org: 'Ethiopian Public Health Institute', country: 'Ethiopia', region: 'eastern', specialties: ['Pathogen Control', 'Diagnostics'], level: 'Senior',
    certs: [{ t: 'bph', y: 2021 }], mentor: false, hero: '',
    bio: 'Samuel leads Ethiopia’s national reference laboratory, strengthening diagnostics and pathogen control for outbreak preparedness.' },
  { id: 'fatima-el-amrani', name: 'Dr Fatima El-Amrani', role: 'Biosecurity Regulator', org: 'Institut Pasteur de Tunis', country: 'Tunisia', region: 'northern', specialties: ['Regulation', 'Legal Framework'], level: 'Lead',
    certs: [{ t: 'bbn', y: 2020 }, { t: 'brm', y: 2018 }], mentor: true,
    hero: 'A leading voice for harmonised biosecurity regulation across North Africa.',
    bio: 'Fatima advises on national biosecurity regulation and the domestication of the AU legal framework in North Africa.' },
  { id: 'thabo-nkosi', name: 'Dr Thabo Nkosi', role: 'Biorisk Manager', org: 'NICD', country: 'South Africa', region: 'southern', specialties: ['High Containment', 'Waste Management'], level: 'Senior',
    certs: [{ t: 'bcf', y: 2019 }, { t: 'brm', y: 2017 }], mentor: true, hero: '',
    bio: 'Thabo manages biorisk in high-containment facilities at the NICD and advises on biological waste management.' },
  { id: 'aicha-diallo', name: 'Dr Aïcha Diallo', role: 'Training Coordinator', org: 'Institut Pasteur de Dakar', country: 'Senegal', region: 'western', specialties: ['Training', 'Certification'], level: 'Lead',
    certs: [{ t: 'brm', y: 2018 }, { t: 'bph', y: 2021 }], mentor: true,
    hero: 'Has trained hundreds of professionals through the regional certification programme.',
    bio: 'Aïcha coordinates the regional training and certification programme, mentoring candidates from across Francophone Africa.' },
  { id: 'jean-paul-mbarga', name: 'Dr Jean-Paul Mbarga', role: 'Laboratory Director', org: 'Centre Pasteur du Cameroun', country: 'Cameroon', region: 'central', specialties: ['Laboratory Biosafety', 'Equipment'], level: 'Senior',
    certs: [{ t: 'bsc', y: 2021 }, { t: 'brm', y: 2020 }], mentor: false, hero: '',
    bio: 'Jean-Paul directs laboratory operations and equipment reliability at the Centre Pasteur du Cameroun.' },
  { id: 'grace-banda', name: 'Dr Grace Banda', role: 'Biosafety Specialist', org: 'Zambia National Public Health Institute', country: 'Zambia', region: 'southern', specialties: ['Biorisk Management', 'Surveillance'], level: 'Associate',
    certs: [{ t: 'brm', y: 2022 }], mentor: false, hero: '',
    bio: 'Grace supports biosafety and disease surveillance systems at the Zambia NPHI.' },
  { id: 'yusuf-abdallah', name: 'Dr Yusuf Abdallah', role: 'Biosecurity Analyst', org: 'Tanzania NPHL', country: 'Tanzania', region: 'eastern', specialties: ['Pathogen Control', 'Policy'], level: 'Associate',
    certs: [{ t: 'bbn', y: 2022 }], mentor: false, hero: '',
    bio: 'Yusuf analyses biosecurity risks and supports pathogen accountability at Tanzania’s national health laboratory.' },
  { id: 'mariam-coulibaly', name: 'Dr Mariam Coulibaly', role: 'Programme Officer', org: "Ministry of Health, Côte d'Ivoire", country: "Côte d'Ivoire", region: 'western', specialties: ['Policy', 'Coordination'], level: 'Associate',
    certs: [{ t: 'bph', y: 2023 }], mentor: false, hero: '',
    bio: 'Mariam coordinates national biosafety and biosecurity activities within the Ivorian Ministry of Health.' },
  { id: 'ahmed-hassan', name: 'Dr Ahmed Hassan', role: 'BioRisk Advisor', org: 'Egyptian Ministry of Health', country: 'Egypt', region: 'northern', specialties: ['High Containment', 'Regulation'], level: 'Senior',
    certs: [{ t: 'bcf', y: 2020 }, { t: 'bbn', y: 2021 }], mentor: true, hero: '',
    bio: 'Ahmed advises on biorisk for high-containment facilities and regulatory compliance in Egypt.' },
  { id: 'esther-uwimana', name: 'Dr Esther Uwimana', role: 'Quality & Biosafety Lead', org: 'Rwanda Biomedical Centre', country: 'Rwanda', region: 'eastern', specialties: ['Laboratory Biosafety', 'Accreditation'], level: 'Senior',
    certs: [{ t: 'brm', y: 2020 }, { t: 'bph', y: 2022 }], mentor: true,
    hero: 'Drove laboratory accreditation and biosafety quality systems at the Rwanda Biomedical Centre.',
    bio: 'Esther leads quality and biosafety at the RBC, integrating accreditation with biorisk management.' },
  { id: 'kwame-mensah', name: 'Dr Kwame Mensah', role: 'Biosafety Officer', org: 'Noguchi Memorial Institute', country: 'Ghana', region: 'western', specialties: ['Training', 'Waste Management'], level: 'Associate',
    certs: [{ t: 'brm', y: 2023 }], mentor: false, hero: '',
    bio: 'Kwame supports biosafety training and biological waste management at the Noguchi Memorial Institute.' },
  { id: 'nadia-benali', name: 'Dr Nadia Benali', role: 'Regulatory Affairs Lead', org: 'Institut Pasteur du Maroc', country: 'Morocco', region: 'northern', specialties: ['Legal Framework', 'Policy'], level: 'Lead',
    certs: [{ t: 'bbn', y: 2019 }], mentor: true, hero: '',
    bio: 'Nadia leads regulatory affairs and supports the alignment of Moroccan law with the AU framework.' },
  { id: 'patrick-lukusa', name: 'Dr Patrick Lukusa', role: 'High-Containment Specialist', org: 'INRB', country: 'DR Congo', region: 'central', specialties: ['High Containment', 'Pathogen Control'], level: 'Senior',
    certs: [{ t: 'bcf', y: 2021 }, { t: 'brm', y: 2019 }], mentor: true,
    hero: 'Operates one of Central Africa’s key high-containment laboratories on the front line of outbreak response.',
    bio: 'Patrick specialises in high-containment operations and pathogen control at the INRB in Kinshasa.' },
  { id: 'tendai-moyo', name: 'Dr Tendai Moyo', role: 'Biosafety Trainer', org: 'Zimbabwe NMRL', country: 'Zimbabwe', region: 'southern', specialties: ['Training', 'Certification'], level: 'Senior',
    certs: [{ t: 'brm', y: 2020 }, { t: 'bsc', y: 2022 }], mentor: true, hero: '',
    bio: 'Tendai trains and certifies biosafety practitioners across Southern Africa.' }
];

BBI.events = [
  { d: '22', m: 'Jan', y: '2026', loc: 'Arusha, Tanzania', type: 'Conference', reg: true,
    title: 'Global Voices in Biosafety & Biosecurity', region: 'eastern',
    desc: 'Annual gathering celebrating diversity and sharing best practice in biosafety and biosecurity across Africa and beyond.' },
  { d: '10', m: 'Mar', y: '2026', loc: 'Dakar, Senegal', type: 'Training', reg: true,
    title: 'Regional Biorisk Management Certification Course', region: 'western',
    desc: 'Five-day intensive preparing candidates for the Biorisk Management certification examination.' },
  { d: '05', m: 'May', y: '2026', loc: 'Cairo, Egypt', type: 'Workshop', reg: true,
    title: 'North Africa Legal Framework Domestication Workshop', region: 'northern',
    desc: 'Regulators and policymakers work through enacting national legislation aligned to the AU framework.' },
  { d: '18', m: 'Jul', y: '2026', loc: 'Johannesburg, South Africa', type: 'Training', reg: false,
    title: 'High-Containment Facilities Operations Course', region: 'southern',
    desc: 'Specialist training for biocontainment facility operators and engineers.' },
  { d: '09', m: 'Sep', y: '2026', loc: 'Kigali, Rwanda', type: 'Summit', reg: false,
    title: 'Continental Biosafety Leadership Summit', region: 'eastern',
    desc: 'TWG chairs and national focal points review progress on the 2025–2030 strategy.' }
];

BBI.getInvolved = [
  { icon: '🎓', title: 'Get certified', text: 'Join the regional training and certification programme and earn a recognised, portable credential.', cta: 'See pathways', href: 'training.html' },
  { icon: '🧭', title: 'Find a mentor', text: 'Connect with experienced professionals through the mentorship programme to grow your career.', cta: 'Mentorship', href: 'mentorship.html' },
  { icon: '🤝', title: 'Join a National TWG', text: 'Contribute to your country’s biosafety and biosecurity technical working group or professional association.', cta: 'Express interest', href: '#join' },
  { icon: '🌍', title: 'Partner with the BBI', text: 'Institutions and funders can collaborate to strengthen biosafety and biosecurity systems across Africa.', cta: 'Contact us', href: 'mailto:info@aslm.org' }
];

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
  }
};
