// =============================================================================
// THE AI SCIENTIST — Master Data Contract
// Mock Response: L. rhamnosus GG Intestinal Permeability Study
// =============================================================================

export type NoveltySignal = "not found" | "similar work exists" | "exact match found";

export interface Reference {
  title: string;
  url: string;
  authors: string;
  journal: string;
  year: number;
}

export interface NoveltyCheck {
  signal: NoveltySignal;
  summary: string;
  references: Reference[];
}

export interface ProtocolStep {
  step_number: number;
  title: string;
  description: string;
  duration: string;
  key_parameters: Record<string, string>;
  safety_notes: string | null;
  editable: boolean;
}

export interface Material {
  item: string;
  supplier: string;
  catalog_number: string;
  quantity: string;
  estimated_price: number;
  notes: string;
  url?: string | null;
}

export interface TimelinePhase {
  phase: number;
  name: string;
  duration_weeks: number;
  week_range: string;
  description: string;
  dependencies: string[];
  deliverables: string[];
}

export interface ExperimentData {
  hypothesis: string;
  novelty_check: NoveltyCheck;
  protocol: ProtocolStep[];
  materials: Material[];
  budget_total: number;
  timeline_phases: TimelinePhase[];
}

export const mockExperimentData: ExperimentData = {
  hypothesis:
    "Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.",

  novelty_check: {
    signal: "similar work exists",
    summary:
      "Two recent studies have investigated L. rhamnosus GG supplementation and intestinal barrier function in murine models. Ongoing differentiation exists in the specific tight junction protein targets (claudin-1 vs. ZO-1), strain dosage, and intervention duration. Your specific 30% permeability reduction threshold with simultaneous claudin-1/occludin quantification in C57BL/6J mice represents a meaningful incremental contribution.",
    references: [
      {
        title:
          "Lactobacillus rhamnosus GG restores intestinal barrier function in a murine model of colitis by upregulating tight junction proteins and suppressing NF-κB signaling",
        url: "https://doi.org/10.1016/j.jnutbio.2021.108851",
        authors: "Karczewski, J., Troost, F.J., Konings, I., Dessing, J., Beynen, M., Brummer, R.J., & Wells, J.M.",
        journal: "Journal of Nutritional Biochemistry",
        year: 2021,
      },
      {
        title:
          "Probiotic Lactobacillus rhamnosus GG supplementation prevents leaky gut syndrome in a DSS-induced colitis model through claudin-1 and occludin preservation",
        url: "https://doi.org/10.3390/nu14050987",
        authors: "Anderson, R.C., Cookson, A.L., McNabb, W.C., Park, Z., McCann, M.J., Kelly, W.J., & Roy, N.C.",
        journal: "Nutrients",
        year: 2022,
      },
    ],
  },

  protocol: [
    {
      step_number: 1,
      title: "Animal Procurement, Housing, and Acclimation",
      description:
        "Obtain 40 male C57BL/6J mice (8 weeks old, 20–22 g) from Jackson Laboratory. House mice in groups of 5 per cage in a temperature-controlled facility (22 ± 1°C) with a 12h:12h light/dark cycle (lights on at 07:00). Provide ad libitum access to standard chow (LabDiet 5001) and autoclaved water throughout the study. Allow a 7-day acclimation period prior to any intervention. Weigh all animals on Days 1, 4, and 7 of acclimation. Randomize animals into 2 groups (n=20/group) on Day 7 using a stratified randomization scheme based on body weight to ensure group weight equivalence (target: <1 g mean difference between groups). All procedures must be approved by the Institutional Animal Care and Use Committee (IACUC) prior to initiation.",
      duration: "7 days (acclimation) + 1 day (randomization)",
      key_parameters: {
        strain: "C57BL/6J",
        age: "8 weeks at arrival",
        sex: "Male",
        n_per_group: "20",
        housing: "5 mice/cage, individually ventilated cages (IVC)",
        temperature: "22 ± 1°C",
        humidity: "50 ± 10%",
        light_cycle: "12h:12h",
        chow: "LabDiet 5001 (standard rodent chow)",
      },
      safety_notes:
        "Handle animals in a certified BSL-1 facility. Wear PPE (gloves, lab coat, mask) at all times. All bedding and waste must be autoclaved before disposal.",
      editable: true,
    },
    {
      step_number: 2,
      title: "Bacterial Culture Preparation and Daily Gavage Stock",
      description:
        "Prepare a working stock of Lactobacillus rhamnosus GG (ATCC 53103) for daily oral gavage. Revive the lyophilized stock vial according to ATCC guidelines using De Man, Rogosa and Sharpe (MRS) broth (Sigma-Aldrich, 69966) at 37°C under anaerobic conditions for 24 hours. Confirm viable colony counts by serial dilution plating on MRS agar. For the intervention period, prepare fresh bacterial suspensions each morning by centrifuging an overnight culture at 3,000 × g for 10 min, washing the pellet twice with sterile PBS (pH 7.4), and resuspending in sterile PBS to achieve a final concentration of 1 × 10⁹ CFU/0.2 mL. Verify the dose by OD600 measurement (target OD600 ≈ 0.4–0.5) and plate count confirmation on Mondays and Thursdays throughout the 4-week intervention. Store working suspension on ice and use within 2 hours of preparation. The vehicle control group receives 0.2 mL sterile PBS by the same gavage method.",
      duration: "Ongoing throughout 4-week intervention (daily preparation)",
      key_parameters: {
        organism: "Lactobacillus rhamnosus GG (ATCC 53103)",
        dose: "1 × 10⁹ CFU per mouse",
        volume: "0.2 mL per gavage",
        vehicle: "Sterile PBS (pH 7.4)",
        culture_medium: "MRS Broth (Sigma-Aldrich, 69966)",
        dose_confirmation: "OD600 + plate count (2×/week)",
        gavage_needle: "20G, 38 mm ball-tipped gavage needle",
        preparation_timing: "Fresh daily, used within 2 hours",
      },
      safety_notes:
        "L. rhamnosus GG is BSL-1. All culture work must be performed in a biological safety cabinet. Waste containing live bacteria must be autoclaved before disposal. Never use a culture that appears contaminated or has an unexpected color/turbidity.",
      editable: true,
    },
    {
      step_number: 3,
      title: "Daily Oral Gavage Administration (4-Week Intervention)",
      description:
        "Administer daily oral gavage to all 40 mice for 28 consecutive days (Days 8–35 of the study). The LGG group receives 0.2 mL of the freshly prepared bacterial suspension (1 × 10⁹ CFU) and the control group receives 0.2 mL sterile PBS. Perform gavage at the same time each day (08:00–10:00) to minimize circadian variation. Restrain mice manually with the non-dominant hand; insert the gavage needle at a ~45° angle at the corner of the mouth, advance along the hard palate, and deposit the suspension in the stomach. Monitor all animals for signs of distress, regurgitation, or respiratory distress immediately post-gavage and at the next cage check. Record individual body weights on Days 8, 15, 22, and 35 to track growth trajectories. Any animal showing >15% weight loss relative to peak weight must be removed from the study per IACUC protocol.",
      duration: "28 days (Days 8–35)",
      key_parameters: {
        frequency: "Once daily",
        time_of_day: "08:00–10:00 h",
        lgg_dose: "1 × 10⁹ CFU / 0.2 mL PBS",
        control_dose: "0.2 mL sterile PBS",
        needle_gauge: "20G ball-tipped gavage needle",
        weight_monitoring: "Days 8, 15, 22, 35",
        humane_endpoint: ">15% weight loss from peak",
      },
      safety_notes:
        "Improper gavage technique is the primary risk. Always confirm needle placement before depositing volume. A correctly placed needle will not cause resistance. If resistance is felt, withdraw and reposition. Accidental intratracheal delivery is immediately fatal. Train all personnel on gavage technique with practice animals before the study begins.",
      editable: true,
    },
    {
      step_number: 4,
      title: "In Vivo Intestinal Permeability Assessment (FITC-Dextran Assay)",
      description:
        "On Day 35 (final day of intervention), assess intestinal permeability in all mice using the FITC-dextran (FD4) assay. Fast mice for 4 hours (08:00–12:00) with free access to water. At 12:00, administer FITC-dextran (MW 4,000 Da; Sigma-Aldrich, FD4) by oral gavage at 60 mg/kg body weight dissolved in sterile PBS (prepare a 25 mg/mL stock). Strictly maintain animals in the dark for the duration of the assay to prevent photobleaching. After 4 hours (at 16:00), collect blood via submandibular vein puncture (200 µL) using a 4 mm Goldenrod lancet. Transfer blood immediately into EDTA-coated microtainer tubes and centrifuge at 1,000 × g for 10 min at 4°C to obtain plasma. Transfer 50 µL plasma to a black 96-well plate. Dilute a FITC-dextran standard curve (0, 62.5, 125, 250, 500, 1000, 2000 ng/mL) in PBS using the same 25 mg/mL stock. Read fluorescence at Ex/Em 485/528 nm on a fluorescence microplate reader (Synergy H1, BioTek). Calculate serum FITC-dextran concentration from the standard curve. Express results as ng/mL of FITC-dextran in plasma.",
      duration: "1 day (Day 35); 4h fasting + 4h assay window",
      key_parameters: {
        probe: "FITC-Dextran, MW 4,000 Da (FD4)",
        dose: "60 mg/kg body weight",
        vehicle: "Sterile PBS (25 mg/mL stock)",
        fasting_duration: "4 hours pre-gavage",
        blood_collection_timepoint: "4 hours post-gavage",
        blood_volume: "200 µL (submandibular puncture)",
        anticoagulant: "EDTA microtainer tube",
        centrifugation: "1,000 × g, 10 min, 4°C",
        assay_volume: "50 µL plasma per well (96-well black plate)",
        excitation: "485 nm",
        emission: "528 nm",
        standard_curve_range: "0–2000 ng/mL",
      },
      safety_notes:
        "FITC is a photosensitive dye. Minimize light exposure of all samples and standards. Prepare FITC-dextran stock in subdued lighting and wrap tubes in aluminum foil. All gavage needles used for blood collection are sharps — dispose in a designated sharps container.",
      editable: true,
    },
    {
      step_number: 5,
      title: "Terminal Tissue Harvest",
      description:
        "Following blood collection on Day 35, euthanize all mice by CO₂ asphyxiation followed by cervical dislocation as a secondary method, per IACUC guidelines. Work with one cage at a time to minimize stress to non-euthanized animals. Immediately after euthanasia, perform a midline laparotomy. Identify and isolate the small intestine (jejunum and ileum) and the colon. For each segment: (1) Flush gently with ice-cold PBS using a blunt-end needle syringe to remove fecal content. (2) Cut a 1 cm segment from mid-jejunum, mid-ileum, and mid-colon and snap-freeze in liquid nitrogen for Western blot analysis. (3) Cut an adjacent 0.5 cm segment from each region, place in 10% neutral buffered formalin (NBF) for 24 hours, then transfer to 70% ethanol for histology (H&E and immunofluorescence). (4) Place the remaining intestinal tissue from the ileum into a pre-weighed cryovial, snap-freeze in liquid nitrogen, and store at −80°C for RNA extraction. Also collect the cecum contents into a separate cryovial, snap-freeze, and store at −80°C for 16S rRNA microbiome sequencing (secondary endpoint). Label all samples with animal ID, tissue type, and date.",
      duration: "1 day (Day 35, immediately post-blood collection); ~20 min per mouse",
      key_parameters: {
        euthanasia_method: "CO₂ asphyxiation + cervical dislocation",
        segments_collected: "Mid-jejunum, mid-ileum, mid-colon",
        snap_freeze_segments: "1 cm segments in liquid nitrogen (Western blot)",
        formalin_segments: "0.5 cm in 10% NBF, 24h then 70% ethanol (histology/IF)",
        rna_tissue: "Remaining ileum snap-frozen at −80°C",
        microbiome_sample: "Cecal contents snap-frozen at −80°C",
        storage_western_blot: "−80°C until processing",
        storage_histology: "4°C in 70% ethanol until paraffin embedding",
      },
      safety_notes:
        "Liquid nitrogen causes severe cryogenic burns. Use insulated cryo-gloves and face shield. CO₂ tanks must be secured to the wall. Work in a fume hood when handling formalin (10% NBF) — it is a fixative and carcinogen. Dispose of formalin waste as chemical hazardous waste.",
      editable: true,
    },
    {
      step_number: 6,
      title: "Western Blot Analysis for Claudin-1 and Occludin",
      description:
        "Homogenize snap-frozen intestinal tissue (ileum) in RIPA lysis buffer supplemented with protease and phosphatase inhibitor cocktail (Thermo Fisher, 78442). Centrifuge lysates at 14,000 × g for 15 min at 4°C; collect supernatant. Quantify protein concentration using the BCA Protein Assay Kit (Thermo Fisher, 23225). Load 30 µg total protein per lane on a 12% SDS-PAGE gel. Run at 120V for 90 min in 1× Tris-glycine-SDS running buffer. Transfer to PVDF membrane (0.2 µm) at 100V for 60 min in 1× Tris-glycine transfer buffer + 20% methanol at 4°C. Block membrane with 5% non-fat dry milk in TBST for 1 hour at room temperature. Incubate overnight at 4°C with primary antibodies: Anti-Claudin-1 rabbit mAb (Cell Signaling Technology, #13255, 1:1000 in 5% BSA/TBST) and Anti-Occludin rabbit mAb (Abcam, ab216327, 1:1000). Wash 3× with TBST (10 min each). Incubate with HRP-conjugated goat anti-rabbit IgG secondary antibody (Cell Signaling Technology, #7074, 1:2000) for 1 hour at room temperature. Detect bands using ECL substrate (Thermo Fisher, 32109). Image on a ChemiDoc MP (Bio-Rad) using auto-exposure. Strip and re-probe with Anti-β-Actin antibody (Cell Signaling Technology, #4967, 1:5000) as a loading control. Quantify band densitometry using ImageJ (Fiji), normalized to β-Actin.",
      duration: "2–3 days (protein extraction Day 1, blotting Day 2, imaging Day 3)",
      key_parameters: {
        tissue: "Ileum (snap-frozen, −80°C)",
        lysis_buffer: "RIPA + protease/phosphatase inhibitor cocktail",
        protein_quantification: "BCA Protein Assay",
        protein_loaded: "30 µg per lane",
        gel_percentage: "12% SDS-PAGE",
        transfer_membrane: "PVDF, 0.2 µm",
        blocking: "5% non-fat dry milk in TBST, 1h RT",
        primary_antibody_claudin1:
          "Cell Signaling Technology #13255, rabbit mAb, 1:1000",
        primary_antibody_occludin:
          "Abcam ab216327, rabbit mAb, 1:1000",
        secondary_antibody: "HRP goat anti-rabbit IgG (CST #7074), 1:2000",
        loading_control: "β-Actin (CST #4967), 1:5000",
        detection: "ECL substrate, ChemiDoc MP (Bio-Rad)",
        quantification: "ImageJ (Fiji) densitometry, normalized to β-Actin",
      },
      safety_notes:
        "Acrylamide monomer is a neurotoxin and potential carcinogen. Use pre-cast gels where possible to minimize handling of liquid acrylamide. Wear nitrile gloves when handling ECL substrate. SDS is an irritant — work in a well-ventilated area.",
      editable: true,
    },
    {
      step_number: 7,
      title: "Immunofluorescence Staining of Tight Junction Proteins",
      description:
        "Process formalin-fixed paraffin-embedded (FFPE) tissue sections for immunofluorescence. After paraffin embedding, cut 5 µm sections onto Superfrost Plus slides. Dewax in xylene (2 × 5 min), rehydrate through graded ethanol series (100%, 95%, 70%, 2 min each), then wash in distilled water. Perform heat-induced epitope retrieval (HIER) using citrate buffer (pH 6.0) in a pressure cooker at 95°C for 20 min. Cool to room temperature, wash with PBS. Block with 5% normal goat serum in PBS + 0.1% Triton X-100 for 1 hour at room temperature. Incubate overnight at 4°C with: Anti-Claudin-1 (Cell Signaling Technology, #13255, 1:200) and Anti-Occludin (Thermo Fisher, 71-1500, 1:100) in blocking buffer. Wash 3× PBS. Incubate with Alexa Fluor 488-conjugated goat anti-rabbit (Invitrogen, A11008, 1:500) and Alexa Fluor 594-conjugated goat anti-mouse (Invitrogen, A11005, 1:500) for 1 hour at RT in the dark. Wash 3× PBS. Mount with Prolong Gold Antifade with DAPI (Invitrogen, P36930). Image on a confocal microscope (Zeiss LSM 900) at 40× oil immersion objective. Acquire at least 5 non-overlapping fields per section. Quantify fluorescence intensity using ImageJ (Fiji): mean gray value per crypt-villus unit, normalized to DAPI nuclear staining area.",
      duration: "3–4 days (embedding Day 1, sectioning/staining Days 2–3, imaging Day 4)",
      key_parameters: {
        tissue_preparation: "FFPE, 5 µm sections on Superfrost Plus slides",
        antigen_retrieval: "Citrate buffer pH 6.0, pressure cooker 95°C, 20 min",
        blocking: "5% normal goat serum + 0.1% Triton X-100 in PBS",
        primary_claudin1: "CST #13255, rabbit, 1:200, 4°C overnight",
        primary_occludin: "Thermo Fisher 71-1500, mouse, 1:100, 4°C overnight",
        secondary_1: "Alexa Fluor 488 goat anti-rabbit, 1:500",
        secondary_2: "Alexa Fluor 594 goat anti-mouse, 1:500",
        counterstain: "DAPI (via Prolong Gold Antifade, Invitrogen P36930)",
        microscope: "Zeiss LSM 900 confocal, 40× oil immersion",
        fields_per_section: "≥5 non-overlapping fields",
        quantification: "ImageJ mean gray value per crypt-villus unit / DAPI area",
      },
      safety_notes:
        "Xylene is highly flammable and a CNS depressant. Use only in a certified chemical fume hood. Wear nitrile gloves and eye protection. Store xylene in a flammable solvent cabinet. DAPI is a potential mutagen — avoid skin contact.",
      editable: true,
    },
    {
      step_number: 8,
      title: "Statistical Analysis and Data Reporting",
      description:
        "Perform all statistical analyses in GraphPad Prism 10 (GraphPad Software, San Diego, CA). For the primary endpoint (serum FITC-dextran concentration), compare LGG vs. control groups using an unpaired two-tailed Student's t-test after confirming normality by Shapiro-Wilk test and equality of variances by F-test. If normality is violated (Shapiro-Wilk p < 0.05), use the Mann-Whitney U test. For Western blot densitometry (claudin-1, occludin) and immunofluorescence intensity, apply the same statistical approach per protein per intestinal segment. Express all data as mean ± SEM. Define statistical significance as p < 0.05. Calculate the percent reduction in permeability as: [(FITC-dextran_control − FITC-dextran_LGG) / FITC-dextran_control] × 100%. Perform a priori power analysis (GPower 3.1): assuming 30% reduction in permeability (primary endpoint), SD = 15% (based on published literature), α = 0.05, power = 0.80, estimated n = 18/group (use n = 20/group to account for potential attrition). Generate bar graphs, representative blot images, and representative IF micrographs for all primary endpoints. Report all raw data in supplemental spreadsheets.",
      duration: "5–7 days (post data collection)",
      key_parameters: {
        software: "GraphPad Prism 10, GPower 3.1",
        primary_test: "Unpaired t-test or Mann-Whitney U (if non-normal)",
        normality_test: "Shapiro-Wilk test",
        variance_test: "F-test",
        significance_threshold: "p < 0.05",
        data_expression: "Mean ± SEM",
        power_analysis:
          "30% effect, SD=15%, α=0.05, power=0.80 → n=18 → using n=20",
        primary_endpoint_calculation:
          "% reduction = [(control − LGG) / control] × 100%",
      },
      safety_notes: null,
      editable: true,
    },
  ],

  materials: [
    {
      item: "C57BL/6J Mice, Male, 8 weeks (×40)",
      supplier: "The Jackson Laboratory",
      catalog_number: "JAX:000664",
      quantity: "40 animals",
      estimated_price: 2400.0,
      notes:
        "Order at least 3 weeks prior to study start to account for shipping and health screening. Confirm SPF (specific pathogen-free) status. Include 5 extra animals for training/practice gavage.",
    },
    {
      item: "Lactobacillus rhamnosus GG (ATCC 53103), Lyophilized Reference Strain",
      supplier: "ATCC",
      catalog_number: "ATCC-53103",
      quantity: "1 vial",
      estimated_price: 595.0,
      notes:
        "Revive per ATCC protocol. Create 10 working stocks from the primary revival to avoid repeated freeze-thaw cycles of the master stock.",
    },
    {
      item: "MRS Broth (De Man, Rogosa and Sharpe), 500g",
      supplier: "Sigma-Aldrich",
      catalog_number: "69966-500G",
      quantity: "1 bottle (500 g)",
      estimated_price: 112.0,
      notes: "For L. rhamnosus GG culture. Prepare 100 mL batches, autoclave at 121°C for 15 min.",
    },
    {
      item: "MRS Agar, 500g",
      supplier: "Sigma-Aldrich",
      catalog_number: "69964-500G",
      quantity: "1 bottle (500 g)",
      estimated_price: 143.0,
      notes: "For colony count verification plates. Pour 25 mL plates, use within 2 weeks.",
    },
    {
      item: "FITC-Dextran, Average MW 4,000 (FD4), 1g",
      supplier: "Sigma-Aldrich",
      catalog_number: "FD4-1G",
      quantity: "1 g",
      estimated_price: 218.0,
      notes:
        "Store at −20°C, protect from light. Prepare fresh working stock in sterile PBS on the day of assay. Dose at 60 mg/kg.",
    },
    {
      item: "Phosphate-Buffered Saline (PBS), 10× Concentrate, 1L",
      supplier: "Thermo Fisher Scientific",
      catalog_number: "70011044",
      quantity: "2 bottles (1 L each)",
      estimated_price: 72.0,
      notes: "Dilute to 1× with molecular-grade water. Autoclave before use for in vivo work.",
    },
    {
      item: "Anti-Claudin-1 Rabbit Monoclonal Antibody (D5H1D XP®)",
      supplier: "Cell Signaling Technology",
      catalog_number: "13255S",
      quantity: "1 vial (100 µL)",
      estimated_price: 389.0,
      notes: "Use at 1:1000 (WB) and 1:200 (IF). Store at −20°C in aliquots. Validated for mouse tissue.",
    },
    {
      item: "Anti-Occludin Rabbit Monoclonal Antibody",
      supplier: "Abcam",
      catalog_number: "ab216327",
      quantity: "1 vial (100 µL)",
      estimated_price: 355.0,
      notes: "Use at 1:1000 (WB). Clone EPR19955. Validated for C57BL/6 mouse intestinal tissue.",
    },
    {
      item: "Anti-Occludin Mouse Monoclonal Antibody (clone OC-3F10)",
      supplier: "Thermo Fisher Scientific",
      catalog_number: "33-1500",
      quantity: "1 vial (100 µg)",
      estimated_price: 279.0,
      notes: "Use at 1:100 (IF) for dual-staining with CST claudin-1 antibody (rabbit). Store at −20°C.",
    },
    {
      item: "Anti-β-Actin Rabbit Monoclonal Antibody (13E5)",
      supplier: "Cell Signaling Technology",
      catalog_number: "4967S",
      quantity: "1 vial (200 µL)",
      estimated_price: 312.0,
      notes: "Loading control for Western blot. Use at 1:5000 in 5% BSA/TBST.",
    },
    {
      item: "HRP-Conjugated Goat Anti-Rabbit IgG Secondary Antibody",
      supplier: "Cell Signaling Technology",
      catalog_number: "7074S",
      quantity: "1 vial (500 µL)",
      estimated_price: 178.0,
      notes: "Use at 1:2000 for Western blot. Store at 4°C.",
    },
    {
      item: "Alexa Fluor 488 Goat Anti-Rabbit IgG (H+L) Secondary Antibody",
      supplier: "Invitrogen (Thermo Fisher)",
      catalog_number: "A11008",
      quantity: "1 vial (500 µL, 2 mg/mL)",
      estimated_price: 187.0,
      notes: "Use at 1:500 for immunofluorescence. Protect from light.",
    },
    {
      item: "Alexa Fluor 594 Goat Anti-Mouse IgG (H+L) Secondary Antibody",
      supplier: "Invitrogen (Thermo Fisher)",
      catalog_number: "A11005",
      quantity: "1 vial (500 µL, 2 mg/mL)",
      estimated_price: 187.0,
      notes: "Use at 1:500 for immunofluorescence. Protect from light.",
    },
    {
      item: "RIPA Lysis and Extraction Buffer, 100 mL",
      supplier: "Thermo Fisher Scientific",
      catalog_number: "89900",
      quantity: "1 bottle (100 mL)",
      estimated_price: 89.0,
      notes: "Add protease/phosphatase inhibitor cocktail fresh before use.",
    },
    {
      item: "Halt Protease & Phosphatase Inhibitor Cocktail (100×), 1 mL",
      supplier: "Thermo Fisher Scientific",
      catalog_number: "78442",
      quantity: "2 vials (1 mL each)",
      estimated_price: 148.0,
      notes: "Add 10 µL per 1 mL RIPA buffer. Critical for preserving tight junction protein phosphorylation status.",
    },
    {
      item: "Pierce BCA Protein Assay Kit",
      supplier: "Thermo Fisher Scientific",
      catalog_number: "23225",
      quantity: "1 kit (500 assays)",
      estimated_price: 156.0,
      notes: "For protein quantification of tissue lysates before Western blot. Compatible with RIPA buffer.",
    },
    {
      item: "Mini-PROTEAN TGX Precast Gels, 12%, 15-well (10-pack)",
      supplier: "Bio-Rad",
      catalog_number: "4561046",
      quantity: "2 packs (10 gels each)",
      estimated_price: 298.0,
      notes: "Use pre-cast gels to eliminate acrylamide monomer handling. 15 wells accommodate n=40 samples plus ladder.",
    },
    {
      item: "Clarity Western ECL Substrate, 500 mL",
      supplier: "Bio-Rad",
      catalog_number: "1705060",
      quantity: "1 kit",
      estimated_price: 215.0,
      notes: "High-sensitivity ECL. Sufficient for entire study. Store at 4°C, mix 1:1 immediately before use.",
    },
    {
      item: "ProLong Gold Antifade Mountant with DAPI, 10 mL",
      supplier: "Invitrogen (Thermo Fisher)",
      catalog_number: "P36930",
      quantity: "1 bottle (10 mL)",
      estimated_price: 198.0,
      notes: "For mounting IF slides. Allows permanent sealing. Cure at RT for 24h before imaging.",
    },
    {
      item: "Neutral Buffered Formalin (10%), 4L",
      supplier: "Sigma-Aldrich",
      catalog_number: "HT501128-4L",
      quantity: "1 bottle (4 L)",
      estimated_price: 89.0,
      notes:
        "For tissue fixation (histology and IF). Fix at RT for 24h, then transfer to 70% ethanol. Handle in fume hood.",
    },
    {
      item: "EDTA Microtainer Blood Collection Tubes (200-pack)",
      supplier: "BD Biosciences",
      catalog_number: "365974",
      quantity: "1 pack (200 tubes)",
      estimated_price: 124.0,
      notes: "For blood collection via submandibular puncture. Use lavender-top (EDTA) for plasma isolation.",
    },
    {
      item: "Goldenrod Animal Lancet, 4 mm (200-pack)",
      supplier: "Medipoint",
      catalog_number: "GR4MM-200",
      quantity: "1 pack (200 lancets)",
      estimated_price: 68.0,
      notes: "For submandibular blood collection. Single-use, sterile.",
    },
    {
      item: "Black 96-Well Flat-Bottom Microplate (25-pack)",
      supplier: "Greiner Bio-One",
      catalog_number: "655090",
      quantity: "1 pack (25 plates)",
      estimated_price: 112.0,
      notes: "Black plates are essential to minimize background fluorescence in the FITC-dextran assay.",
    },
    {
      item: "20G Ball-Tipped Stainless Steel Gavage Needle, 38mm (10-pack)",
      supplier: "Cadence Science",
      catalog_number: "7908",
      quantity: "2 packs (10 needles each)",
      estimated_price: 96.0,
      notes: "For oral gavage in adult male C57BL/6 mice (20–30 g). Autoclave before first use and between cages.",
    },
  ],

  budget_total: 7823.0,

  timeline_phases: [
    {
      phase: 1,
      name: "IACUC Protocol Submission and Approval",
      duration_weeks: 4,
      week_range: "Weeks −4 to 0 (Pre-study)",
      description:
        "Prepare and submit the IACUC protocol documenting all animal procedures, justification of animal numbers (power analysis), humane endpoints, and biosafety measures. Allow 4 weeks for committee review, revisions, and final approval. This phase must be completed before any animal work can begin. Concurrently, order all reagents and antibodies, verify delivery timelines, and arrange with the vivarium for housing space.",
      dependencies: [],
      deliverables: [
        "Approved IACUC protocol number",
        "All reagents received and quality-checked",
        "Vivarium space reserved and prepared",
        "Personnel trained on gavage technique (practice animals)",
      ],
    },
    {
      phase: 2,
      name: "Animal Procurement and Acclimation",
      duration_weeks: 1,
      week_range: "Week 1",
      description:
        "Receive 40 C57BL/6J male mice (8 weeks old) from Jackson Laboratory. Transfer to the vivarium and allow a 7-day acclimation period under study conditions (temperature, light cycle, standard chow, autoclaved water). Monitor daily for signs of illness or distress. Weigh animals on Days 1, 4, and 7. On Day 7, stratify animals by body weight and randomize into LGG intervention (n=20) and vehicle control (n=20) groups.",
      dependencies: ["Phase 1: IACUC approval", "Phase 1: Vivarium space reserved"],
      deliverables: [
        "40 animals received, health-checked, and logged",
        "Randomization list generated (sealed until Day 7)",
        "Groups assigned: LGG (n=20), Control (n=20)",
        "Baseline body weights recorded",
      ],
    },
    {
      phase: 3,
      name: "Bacterial Stock Preparation and Validation",
      duration_weeks: 1,
      week_range: "Week 1 (concurrent with acclimation)",
      description:
        "Revive the L. rhamnosus GG ATCC 53103 lyophilized stock per ATCC protocol using MRS broth under anaerobic conditions. Perform serial dilution plating to confirm viability and establish OD600-to-CFU correlation for the working strain. Prepare 10 working glycerol stocks (−80°C). Validate the daily gavage preparation protocol (OD600 measurement + plate count) to confirm consistent 1 × 10⁹ CFU/0.2 mL delivery. Train all technical staff on the daily preparation SOP.",
      dependencies: ["Phase 1: LGG ATCC strain received"],
      deliverables: [
        "10 working glycerol stocks of LGG prepared and stored at −80°C",
        "OD600-to-CFU standard curve established for the strain",
        "Daily gavage preparation SOP validated and signed off",
        "All technical staff trained and signed competency",
      ],
    },
    {
      phase: 4,
      name: "Supplementation Intervention (Daily Oral Gavage)",
      duration_weeks: 4,
      week_range: "Weeks 2–5",
      description:
        "Administer daily oral gavage to all 40 mice for 28 consecutive days. LGG group: 1 × 10⁹ CFU in 0.2 mL sterile PBS. Control group: 0.2 mL sterile PBS. Gavage is performed at 08:00–10:00 daily. Fresh bacterial suspension is prepared each morning and used within 2 hours. Bacterial dose is verified by OD600 on Mondays and Thursdays. Body weights are recorded weekly. Daily health monitoring and cage-side observations are logged by the facility technician.",
      dependencies: ["Phase 2: Animals acclimated and randomized", "Phase 3: LGG stocks validated"],
      deliverables: [
        "28-day gavage log completed (individual daily records)",
        "8 OD600/plate count validation measurements completed",
        "Weekly body weight data for all 40 animals",
        "Health monitoring logs with no unexpected adverse events",
      ],
    },
    {
      phase: 5,
      name: "In Vivo FITC-Dextran Permeability Assay and Terminal Harvest",
      duration_weeks: 1,
      week_range: "Week 6 (Day 35 of study)",
      description:
        "On Day 35, perform the FITC-dextran intestinal permeability assay in all 40 mice simultaneously. Mice are fasted for 4 hours, then gavaged with FITC-dextran (60 mg/kg). Blood is collected 4 hours later by submandibular puncture. Plasma is isolated and stored at −80°C for fluorescence quantification. Immediately following blood collection, animals are euthanized (CO₂ + cervical dislocation). Complete tissue harvest is performed: intestinal segments are collected for Western blot (snap-frozen), immunofluorescence (formalin-fixed), and RNA extraction (snap-frozen). Cecal contents are collected for microbiome sequencing.",
      dependencies: ["Phase 4: 28-day intervention complete"],
      deliverables: [
        "40 plasma samples collected, centrifuged, and stored at −80°C",
        "40 sets of tissue samples: snap-frozen for WB, formalin-fixed for histology/IF, and for RNA",
        "40 cecal content samples stored at −80°C",
        "Complete tissue harvest log with sample IDs",
      ],
    },
    {
      phase: 6,
      name: "FITC-Dextran Fluorescence Quantification (Primary Endpoint)",
      duration_weeks: 1,
      week_range: "Week 6 (immediately after harvest)",
      description:
        "Thaw plasma samples and prepare the FITC-dextran standard curve. Load 50 µL plasma per well in duplicate on black 96-well plates. Read fluorescence at Ex/Em 485/528 nm on a calibrated fluorescence microplate reader (Synergy H1, BioTek). Calculate serum FITC-dextran concentration for each mouse using the standard curve. Complete the primary endpoint data set for statistical analysis.",
      dependencies: ["Phase 5: Plasma samples collected"],
      deliverables: [
        "Primary endpoint dataset: FITC-dextran (ng/mL) for all 40 mice",
        "Standard curve R² ≥ 0.99 confirmed",
        "Percent permeability reduction calculated (LGG vs. Control)",
      ],
    },
    {
      phase: 7,
      name: "Western Blot Analysis (Claudin-1 and Occludin)",
      duration_weeks: 1,
      week_range: "Week 7",
      description:
        "Process snap-frozen ileal tissue samples for Western blot analysis. Homogenize in RIPA buffer, quantify protein by BCA assay, and run 12% SDS-PAGE. Transfer to PVDF membrane and probe for Claudin-1 (CST #13255), Occludin (Abcam ab216327), and β-Actin (loading control). Quantify band densitometry using ImageJ, normalize to β-Actin. All samples from LGG and Control groups are run on the same gel to eliminate gel-to-gel variability.",
      dependencies: ["Phase 5: Snap-frozen tissue collected"],
      deliverables: [
        "Western blot images for claudin-1, occludin, and β-Actin for all 40 samples",
        "Densitometry data (normalized to β-Actin) for claudin-1 and occludin",
        "Representative blot images selected for figure preparation",
      ],
    },
    {
      phase: 8,
      name: "Immunofluorescence Staining and Confocal Imaging",
      duration_weeks: 2,
      week_range: "Weeks 7–8",
      description:
        "Submit formalin-fixed intestinal tissue to the histology core for paraffin embedding and sectioning (5 µm sections on Superfrost Plus slides). Perform HIER, primary antibody incubation (Claudin-1 and Occludin), and fluorescent secondary antibody staining. Mount slides with ProLong Gold/DAPI. Image on a Zeiss LSM 900 confocal at 40×. Acquire ≥5 fields per mouse per segment. Quantify fluorescence intensity using ImageJ.",
      dependencies: ["Phase 5: Formalin-fixed tissue processed and in 70% ethanol"],
      deliverables: [
        "FFPE blocks and 5 µm sections for all tissues",
        "Stained IF slides for claudin-1 (green) and occludin (red) with DAPI",
        "Confocal images (≥5 fields/mouse/segment)",
        "Quantified fluorescence intensity dataset",
      ],
    },
    {
      phase: 9,
      name: "Statistical Analysis and Manuscript Preparation",
      duration_weeks: 1,
      week_range: "Week 9",
      description:
        "Compile all primary and secondary endpoint data. Perform statistical analyses in GraphPad Prism 10: unpaired t-test or Mann-Whitney U for FITC-dextran, claudin-1, and occludin data. Generate publication-quality figures: bar graphs with individual data points, representative Western blot images, and representative confocal micrographs. Prepare a complete data package for the lab PI including all raw data, analysis files, and a draft Results and Methods section.",
      dependencies: [
        "Phase 6: Primary endpoint data complete",
        "Phase 7: Western blot data complete",
        "Phase 8: IF imaging data complete",
      ],
      deliverables: [
        "Complete statistical analysis (Prism 10 project file)",
        "All figures at 300 DPI in TIFF and PDF formats",
        "Draft Methods and Results sections",
        "Supplemental raw data spreadsheets",
        "Final study report submitted to PI",
      ],
    },
    {
      phase: 10,
      name: "16S rRNA Microbiome Sequencing (Secondary Endpoint)",
      duration_weeks: 4,
      week_range: "Weeks 6–10 (outsourced; concurrent with analysis phases)",
      description:
        "Submit cecal content samples to a contracted sequencing facility (e.g., Novogene or Genewiz) for 16S rRNA V3-V4 amplicon sequencing. Target 50,000 reads per sample. Receive FASTQ files and perform bioinformatics analysis using QIIME2: DADA2 for denoising, taxonomy assignment via SILVA 138 database. Calculate alpha diversity (Shannon, Faith's PD) and beta diversity (Bray-Curtis PCoA). This is a secondary/exploratory endpoint and does not affect the primary study timeline.",
      dependencies: ["Phase 5: Cecal content samples collected and stored at −80°C"],
      deliverables: [
        "FASTQ files received from sequencing facility",
        "QIIME2 analysis artifacts and visualizations",
        "Alpha and beta diversity metrics for all 40 samples",
        "Differential abundance analysis (LGG vs. Control)",
      ],
    },
  ],
};
