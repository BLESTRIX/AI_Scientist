import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  LevelFormat,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from "docx";
import { saveAs } from "file-saver";
import type { ExperimentData } from "@/data/mockExperimentPlan";
import type { UserProfile } from "@/context/AuthContext";

// ─── Color palette ─────────────────────────────────────────────────────────────
const COLORS = {
  primary: "0D9488",      // teal-600
  secondary: "7C3AED",    // violet-600
  dark: "1E293B",         // slate-800
  mid: "475569",          // slate-600
  light: "94A3B8",        // slate-400
  lightBg: "F0FDFA",      // teal-50
  purpleBg: "F5F3FF",     // violet-50
  tableBorder: "CBD5E1",  // slate-300
  headerBg: "0F766E",     // teal-700
  altRow: "F8FAFC",       // slate-50
  white: "FFFFFF",
  black: "000000",
  warningBg: "FFF7ED",    // orange-50
  warningBorder: "F97316", // orange-500
};

// ─── Border helpers ─────────────────────────────────────────────────────────────
const border = (color = COLORS.tableBorder) => ({
  style: BorderStyle.SINGLE,
  size: 1,
  color,
});

const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: "FFFFFF" });

const allBorders = (color = COLORS.tableBorder) => ({
  top: border(color),
  bottom: border(color),
  left: border(color),
  right: border(color),
});

const noBorders = () => ({
  top: noBorder(),
  bottom: noBorder(),
  left: noBorder(),
  right: noBorder(),
});

// ─── Text helpers ────────────────────────────────────────────────────────────
const run = (text: string, opts: Partial<{
  bold: boolean; italic: boolean; size: number; color: string; font: string;
}> = {}) =>
  new TextRun({
    text,
    bold: opts.bold ?? false,
    italics: opts.italic ?? false,
    size: opts.size ?? 22, // 11pt
    color: opts.color ?? COLORS.dark,
    font: opts.font ?? "Calibri",
  });

const para = (children: TextRun[], opts: Partial<{
  spacing: { before: number; after: number };
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType];
  numbering: { reference: string; level: number };
  heading: (typeof HeadingLevel)[keyof typeof HeadingLevel];
  border: { bottom: { style: (typeof BorderStyle)[keyof typeof BorderStyle]; size: number; color: string; space: number } };
}> = {}) =>
  new Paragraph({
    ...opts,
    children,
  });

const emptyPara = () => para([run("")], { spacing: { before: 0, after: 60 } });

// ─── Section divider ─────────────────────────────────────────────────────────
const sectionDivider = (title: string) =>
  new Paragraph({
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: 20,
        color: COLORS.white,
        font: "Calibri",
      }),
    ],
    spacing: { before: 280, after: 100 },
    shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
    indent: { left: 180, right: 180 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.primary, space: 1 },
    },
  });

// ─── Key-value info row ───────────────────────────────────────────────────────
const infoRow = (label: string, value: string | null | undefined) =>
  new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22, color: COLORS.mid, font: "Calibri" }),
      new TextRun({ text: value || "—", size: 22, color: COLORS.dark, font: "Calibri" }),
    ],
    spacing: { before: 40, after: 40 },
  });

// ─── Currency formatter ───────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);

// ─── Main export function ─────────────────────────────────────────────────────
export async function exportExperimentToDocx(
  data: ExperimentData,
  profile: UserProfile | null
): Promise<void> {
  // Separate in-lab vs new purchase materials
  const inLabMaterials = data.materials.filter(
    (m) => m.supplier === "Available In-Lab" || m.estimated_price === 0
  );
  const newMaterials = data.materials.filter(
    (m) => m.supplier !== "Available In-Lab" && m.estimated_price > 0
  );
  const newBudgetTotal = newMaterials.reduce((s, m) => s + m.estimated_price, 0);

  // ── Novelty signal label ──────────────────────────────────────────────────
  const noveltyLabel =
    data.novelty_check.signal === "not found"
      ? "Novel — No Prior Work Found"
      : data.novelty_check.signal === "similar work exists"
      ? "Similar Work Exists"
      : "Exact Match Found";

  // ── Build budget table rows ───────────────────────────────────────────────
  const COL_WIDTHS = [3200, 1800, 1300, 1500, 1060];
  const TABLE_WIDTH = COL_WIDTHS.reduce((a, b) => a + b, 0); // 8860

  const budgetHeaderRow = new TableRow({
    tableHeader: true,
    children: ["Item", "Supplier", "Catalog #", "Quantity", "Est. Cost"].map(
      (label, i) =>
        new TableCell({
          width: { size: COL_WIDTHS[i], type: WidthType.DXA },
          borders: allBorders(COLORS.primary),
          shading: { fill: COLORS.headerBg, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: label,
                  bold: true,
                  size: 18,
                  color: COLORS.white,
                  font: "Calibri",
                }),
              ],
              alignment: i === 4 ? AlignmentType.RIGHT : AlignmentType.LEFT,
            }),
          ],
        })
    ),
  });

  const buildMaterialRow = (
    m: (typeof data.materials)[0],
    isAlt: boolean
  ) =>
    new TableRow({
      children: [
        m.item,
        m.supplier,
        m.catalog_number,
        m.quantity,
        m.estimated_price === 0 ? "In-Lab ✓" : fmt(m.estimated_price),
      ].map((val, i) =>
        new TableCell({
          width: { size: COL_WIDTHS[i], type: WidthType.DXA },
          borders: allBorders(),
          shading: {
            fill: isAlt ? COLORS.altRow : COLORS.white,
            type: ShadingType.CLEAR,
          },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: String(val),
                  size: 18,
                  color:
                    i === 4 && m.estimated_price === 0
                      ? COLORS.primary
                      : COLORS.dark,
                  bold: i === 4 && m.estimated_price === 0,
                  font: "Calibri",
                }),
              ],
              alignment: i === 4 ? AlignmentType.RIGHT : AlignmentType.LEFT,
            }),
          ],
        })
      ),
    });

  const totalRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 4,
        width: { size: COL_WIDTHS.slice(0, 4).reduce((a, b) => a + b, 0), type: WidthType.DXA },
        borders: allBorders(COLORS.primary),
        shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "TOTAL NEW BUDGET REQUEST",
                bold: true,
                size: 20,
                color: COLORS.primary,
                font: "Calibri",
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: COL_WIDTHS[4], type: WidthType.DXA },
        borders: allBorders(COLORS.primary),
        shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: fmt(newBudgetTotal),
                bold: true,
                size: 20,
                color: COLORS.primary,
                font: "Calibri",
              }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
        ],
      }),
    ],
  });

  // ── Timeline table rows ───────────────────────────────────────────────────
  const TL_WIDTHS = [700, 2400, 800, 5160];
  const TL_TABLE_WIDTH = TL_WIDTHS.reduce((a, b) => a + b, 0);

  const tlHeaderRow = new TableRow({
    tableHeader: true,
    children: ["Phase", "Name", "Duration", "Description"].map((label, i) =>
      new TableCell({
        width: { size: TL_WIDTHS[i], type: WidthType.DXA },
        borders: allBorders(COLORS.secondary),
        shading: { fill: COLORS.secondary, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: label,
                bold: true,
                size: 18,
                color: COLORS.white,
                font: "Calibri",
              }),
            ],
          }),
        ],
      })
    ),
  });

  const tlRows = data.timeline_phases.map((phase, idx) =>
    new TableRow({
      children: [
        String(phase.phase),
        phase.name,
        `${phase.duration_weeks}w`,
        phase.description,
      ].map((val, i) =>
        new TableCell({
          width: { size: TL_WIDTHS[i], type: WidthType.DXA },
          borders: allBorders(),
          shading: {
            fill: idx % 2 === 0 ? COLORS.white : COLORS.purpleBg,
            type: ShadingType.CLEAR,
          },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: val,
                  size: 18,
                  color: i === 0 ? COLORS.secondary : COLORS.dark,
                  bold: i === 0,
                  font: "Calibri",
                }),
              ],
              alignment: i === 2 ? AlignmentType.CENTER : AlignmentType.LEFT,
            }),
          ],
        })
      ),
    })
  );

  // ── Build document ────────────────────────────────────────────────────────
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "protocol-steps",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
          ],
        },
        {
          reference: "deliverables",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22, color: COLORS.dark } },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 36, bold: true, font: "Calibri", color: COLORS.dark },
          paragraph: {
            spacing: { before: 360, after: 200 },
            outlineLevel: 0,
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: COLORS.primary,
                space: 1,
              },
            },
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 28, bold: true, font: "Calibri", color: COLORS.primary },
          paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 24, bold: true, font: "Calibri", color: COLORS.mid },
          paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "THE AI SCIENTIST  •  Formal Grant Proposal & Experimental Protocol",
                    size: 16,
                    color: COLORS.light,
                    font: "Calibri",
                  }),
                ],
                border: {
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: COLORS.primary,
                    space: 1,
                  },
                },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: profile
                      ? `${profile.full_name ?? "Researcher"}  |  ${profile.organization ?? ""}  |  Confidential`
                      : "Confidential",
                    size: 16,
                    color: COLORS.light,
                    font: "Calibri",
                  }),
                  new TextRun({
                    children: ["\tPage ", PageNumber.CURRENT],
                    size: 16,
                    color: COLORS.light,
                    font: "Calibri",
                  }),
                ],
                tabStops: [{ type: "right" as any, position: 9360 }],
                border: {
                  top: {
                    style: BorderStyle.SINGLE,
                    size: 2,
                    color: COLORS.tableBorder,
                    space: 1,
                  },
                },
              }),
            ],
          }),
        },
        children: [
          // ── COVER BLOCK ─────────────────────────────────────────────────
          new Paragraph({
            children: [
              new TextRun({
                text: "FORMAL GRANT PROPOSAL & EXPERIMENTAL PROTOCOL",
                bold: true,
                size: 48,
                color: COLORS.white,
                font: "Calibri",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 200 },
            shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
            indent: { left: 200, right: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "The AI Scientist Platform",
                size: 24,
                color: COLORS.white,
                font: "Calibri",
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
            spacing: { before: 0, after: 400 },
          }),

          // ── RESEARCHER INFO ──────────────────────────────────────────────
          ...(profile
            ? [
                sectionDivider("Submitting Researcher"),
                infoRow("Name", profile.full_name),
                infoRow("Role / Title", profile.role),
                infoRow("Organization", profile.organization),
                infoRow("Department", profile.department),
                infoRow(
                  "Lab Inventory",
                  `${profile.equipment_items?.length ?? 0} item(s) on hand`
                ),
                emptyPara(),
              ]
            : []),

          // ── HYPOTHESIS ──────────────────────────────────────────────────
          sectionDivider("Research Hypothesis"),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: data.hypothesis, font: "Calibri", size: 28, bold: true, color: COLORS.dark })],
            spacing: { before: 200, after: 200 },
          }),
          emptyPara(),

          // ── APPLICATION & IMPACT ────────────────────────────────────────
          ...((data as any).application_justification
            ? [
                sectionDivider("Application & Real-World Impact"),
                new Paragraph({
                  children: [
                    run((data as any).application_justification, { size: 22 }),
                  ],
                  spacing: { before: 160, after: 160 },
                }),
                emptyPara(),
              ]
            : []),

          // ── NOVELTY ASSESSMENT ──────────────────────────────────────────
          sectionDivider("Novelty Assessment"),
          new Paragraph({
            children: [
              new TextRun({
                text: "Signal: ",
                bold: true,
                size: 22,
                color: COLORS.mid,
                font: "Calibri",
              }),
              new TextRun({
                text: noveltyLabel,
                bold: true,
                size: 22,
                color: COLORS.primary,
                font: "Calibri",
              }),
            ],
            spacing: { before: 120, after: 80 },
          }),
          new Paragraph({
            children: [run(data.novelty_check.summary, { size: 22 })],
            spacing: { before: 80, after: 80 },
          }),
          ...(data.novelty_check.references.length > 0
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Key References",
                      bold: true,
                      size: 22,
                      color: COLORS.mid,
                      font: "Calibri",
                    }),
                  ],
                  spacing: { before: 120, after: 60 },
                }),
                ...data.novelty_check.references.map((ref) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${ref.authors} (${ref.year}). `,
                        size: 20,
                        italics: false,
                        color: COLORS.mid,
                        font: "Calibri",
                      }),
                      new TextRun({
                        text: `${ref.title}. `,
                        size: 20,
                        italics: true,
                        color: COLORS.dark,
                        font: "Calibri",
                      }),
                      new TextRun({
                        text: ref.journal,
                        size: 20,
                        color: COLORS.light,
                        font: "Calibri",
                      }),
                    ],
                    spacing: { before: 40, after: 40 },
                    indent: { left: 360 },
                  })
                ),
              ]
            : []),
          emptyPara(),

          // ── EXPERIMENTAL PROTOCOL ───────────────────────────────────────
          new Paragraph({
            children: [new TextRun({ text: "", size: 4 })],
            pageBreakBefore: true,
          }),
          sectionDivider("Experimental Protocol"),
          ...data.protocol.flatMap((step) => [
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({
                  text: `Step ${step.step_number}: ${step.title}`,
                  font: "Calibri",
                  size: 26,
                  bold: true,
                  color: COLORS.primary,
                }),
              ],
              spacing: { before: 240, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Duration: ", bold: true, size: 20, color: COLORS.mid, font: "Calibri" }),
                new TextRun({ text: step.duration, size: 20, color: COLORS.dark, font: "Calibri" }),
              ],
              spacing: { before: 40, after: 60 },
            }),
            new Paragraph({
              children: [run(step.description, { size: 20 })],
              spacing: { before: 60, after: 80 },
            }),
            // Key parameters
            ...(Object.keys(step.key_parameters ?? {}).length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Key Parameters", bold: true, size: 20, color: COLORS.mid, font: "Calibri" }),
                    ],
                    spacing: { before: 80, after: 40 },
                  }),
                  ...Object.entries(step.key_parameters ?? {}).map(([k, v]) =>
                    new Paragraph({
                      numbering: { reference: "deliverables", level: 0 },
                      children: [
                        new TextRun({ text: `${k.replace(/_/g, " ")}: `, bold: true, size: 20, color: COLORS.mid, font: "Calibri" }),
                        new TextRun({ text: String(v), size: 20, color: COLORS.dark, font: "Calibri" }),
                      ],
                      spacing: { before: 20, after: 20 },
                    })
                  ),
                ]
              : []),
            // Safety notes
            ...(step.safety_notes
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "⚠  Safety: ", bold: true, size: 20, color: "E97316", font: "Calibri" }),
                      new TextRun({ text: step.safety_notes, size: 20, color: COLORS.dark, font: "Calibri" }),
                    ],
                    spacing: { before: 80, after: 60 },
                    shading: { fill: COLORS.warningBg, type: ShadingType.CLEAR },
                    indent: { left: 180, right: 180 },
                  }),
                ]
              : []),
            emptyPara(),
          ]),

          // ── TIMELINE ─────────────────────────────────────────────────────
          new Paragraph({
            children: [new TextRun({ text: "", size: 4 })],
            pageBreakBefore: true,
          }),
          sectionDivider("Project Timeline"),
          new Paragraph({
            children: [
              run(
                `Total project duration: ${data.timeline_phases.reduce((s, p) => s + p.duration_weeks, 0)} weeks across ${data.timeline_phases.length} phases.`,
                { size: 22, italic: true }
              ),
            ],
            spacing: { before: 120, after: 200 },
          }),
          new Table({
            width: { size: TL_TABLE_WIDTH, type: WidthType.DXA },
            columnWidths: TL_WIDTHS,
            rows: [tlHeaderRow, ...tlRows],
          }),
          emptyPara(),

          // ── BUDGET REQUEST ─────────────────────────────────────────────
          new Paragraph({
            children: [new TextRun({ text: "", size: 4 })],
            pageBreakBefore: true,
          }),
          sectionDivider("Formal Budget Request"),

          // In-lab notice if applicable
          ...(inLabMaterials.length > 0
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `✓ ${inLabMaterials.length} item(s) satisfied by existing lab inventory (no cost requested).`,
                      size: 20,
                      color: COLORS.primary,
                      bold: true,
                      font: "Calibri",
                    }),
                  ],
                  spacing: { before: 120, after: 80 },
                  shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR },
                  indent: { left: 180, right: 180 },
                }),
                emptyPara(),
              ]
            : []),

          new Table({
            width: { size: TABLE_WIDTH, type: WidthType.DXA },
            columnWidths: COL_WIDTHS,
            rows: [
              budgetHeaderRow,
              // In-lab items first (greyed)
              ...inLabMaterials.map((m, i) => buildMaterialRow(m, i % 2 === 0)),
              // New items
              ...newMaterials.map((m, i) => buildMaterialRow(m, i % 2 === 0)),
              totalRow,
            ],
          }),
          emptyPara(),
          new Paragraph({
            children: [
              new TextRun({
                text: "Note: All prices are estimates based on current supplier listings. Final costs may vary. Items marked 'In-Lab' are available from existing equipment inventory and require no budget allocation.",
                size: 18,
                italics: true,
                color: COLORS.light,
                font: "Calibri",
              }),
            ],
            spacing: { before: 60, after: 120 },
          }),
        ],
      },
    ],
  });

  // ── Generate and download ─────────────────────────────────────────────────
  const buffer = await Packer.toBlob(doc);
  const hypothesis = data.hypothesis.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, "").trim();
  const filename = `AI_Scientist_Protocol_${hypothesis.replace(/\s+/g, "_")}.docx`;
  saveAs(buffer, filename);
}