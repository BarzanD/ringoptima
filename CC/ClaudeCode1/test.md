# Förbättringsplan: Sub-Agent Arkitektur för Utbildningsdokument Pipeline

## Executive Summary

Denna plan beskriver hur vi kan förbättra den nuvarande two-stage pipeline (Kursplan → Prompt1/G-OPAF → Prompt2/Evidence-based → Final Module) genom att implementera en modulär sub-agent arkitektur i Claude Code.

**Huvudmål:**
- Reducera generation time med 50%+ genom parallellisering
- Förbättra kvalitet genom proactive quality gates
- Öka flexibilitet och återanvändbarhet av komponenter
- Behålla det strategiska värdet från nuvarande approach

---

## 1. Analys av Nuvarande Pipeline

### 1.1 Current State

**Stage 1: G-OPAF Framework (Prompt1.rtf)**
- Input: Kursplan.pdf
- Process: Persona-baserad pedagogisk design
  - PersonaOrchestrator koordinerar
  - 3 SubPersonas: Instructional_Designer, Subject_Matter_Expert, YH_Vocational_Consultant
  - PedagogyEngine: CLT_Processor, Constructivist_Module_Designer, Assessment_Strategy_Engine
  - Workflow: Analysis → Module Generation → Assessment
- Output: Utbildningsdokument1 (XML format)
- Focus: Swedish YH context, SeQF Level 6, "LowThreshold_HighCeiling" strategy

**Stage 2: Evidence-Based Optimization (Prompt2.rtf)**
- Input: Utbildningsdokument1 (XML)
- Process: Applicera research-backed interventions
  - Prioritera interventions med effect size > 0.60
  - Highest priority: Autonomy support (g=1.14)
  - Optimize: Cognitive load, Language clarity, Accessibility, Assessment alignment
  - Add: Advance organizers (d=1.24), Worked examples (d=0.67), Metacognitive prompts, Spacing
- Output: Final Module (Markdown format)
- Focus: Evidence-based pedagogy, measurable outcomes

### 1.2 Identifierade Bottlenecks

1. **Sequential Processing (KRITISKT)**
   - Stage 1 måste slutföras helt innan Stage 2 kan börja
   - Ingen parallellisering inom stages
   - Totalt 2× processing time (minimum)

2. **Redundant Processing**
   - Överlappande concerns hanteras separat:
     - CLT principles (både Stage 1 och 2)
     - Assessment alignment (både)
     - Metacognitive scaffolding (både)
     - Accessibility (implicit i Stage 1, explicit i Stage 2)
   - Dubbel kvalitetskontroll utan integration

3. **Format Conversion Overhead**
   - XML → Markdown conversion
   - Risk för informationsförlust
   - Parsing overhead

4. **Missing Feedback Loops**
   - One-way pipeline: Stage 2 kan inte påverka Stage 1
   - Fel upptäcks sent i processen (dyrare att fixa)
   - Ingen iterative refinement

5. **Monolithic Processing**
   - Hela kursen behandlas som en enhet
   - Omöjligt att parallellisera olika modules
   - Svårt att iterera på enskilda delar

6. **Retrospective QA**
   - Quality checks sker EFTER content generation
   - Ingen proactive validation
   - Högre cost of quality

### 1.3 Opportunities med Sub-Agents

**A. Parallellisering (Största impact på speed)**
- Module-level: Olika modules samtidigt
- Persona-level: Parallella expert perspectives
- Component-level: Samtidig generation av olika komponenter

**B. Integrated Quality Assurance**
- Proactive quality gates under generation
- Unified quality framework (inte två separata checklists)
- Real-time feedback och correction

**C. Intelligent Orchestration**
- Smart routing till rätt specialist agents
- Dependency management
- Optimal resource utilization

**D. Specialized Expertise**
- Domain-specific agents (Swedish, SeQF, Industry)
- Format specialists (XML, Markdown)
- Evidence-based pedagogy experts

**E. Modular Architecture**
- Reusable components (Glossary, Cases, Exercises)
- Flexible composition
- Easier maintenance och updates

**F. Bi-directional Communication**
- Stage 2 kan ge feedback till Stage 1
- Iterative refinement
- Continuous improvement

---

## 2. Föreslagen Sub-Agent Arkitektur

### 2.1 Arkitektur Overview: HYBRID APPROACH

Vi kombinerar det bästa från nuvarande two-stage approach med modulär, parallelliserbar agent design.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION LAYER                          │
│  ┌──────────────────┐         ┌──────────────────────┐         │
│  │ Master_          │         │ Quality_Gate_        │         │
│  │ Orchestrator     │◄────────│ Manager              │         │
│  └──────────────────┘         └──────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   STAGE 1:        │ │   STAGE 1.5:     │ │   STAGE 2:       │
│   STRATEGIC       │ │   VALIDATION     │ │   CONTENT        │
│   DESIGN          │ │   (NEW)          │ │   GENERATION     │
│   (G-OPAF)        │ │                  │ │   (Modularized)  │
└───────────────────┘ └──────────────────┘ └──────────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   STAGE 3:        │ │   STAGE 4:       │ │  CROSS-CUTTING   │
│   EVIDENCE-BASED  │ │   FINAL          │ │  AGENTS          │
│   OPTIMIZATION    │ │   ASSEMBLY & QA  │ │  (Always         │
│                   │ │                  │ │   Available)     │
└───────────────────┘ └──────────────────┘ └──────────────────┘
```

### 2.2 Detailed Agent Specifications

#### ORCHESTRATION LAYER

**Master_Orchestrator**
- **Role:** Koordinera hela pipeline, manage dependencies, optimize parallelization
- **Responsibilities:**
  - Parse kursplan och determine overall strategy
  - Route tasks till rätt agents
  - Manage parallel execution
  - Aggregate results
  - Handle errors och retries
- **Key Decisions:**
  - Hur många modules? (baserat på YH-poäng, innehåll)
  - Vilka agents behövs för denna specifika kurs?
  - Vilken ordning och parallelization strategy?

**Quality_Gate_Manager**
- **Role:** Proactive quality assurance throughout pipeline
- **Responsibilities:**
  - Run validation checks kontinuerligt (inte bara slutet)
  - Route feedback till rätt agents för correction
  - Track quality metrics
  - Decide när output är ready för nästa stage
- **Quality Gates:**
  - Post-Stage 1: Strategic design completeness
  - Post-Stage 1.5: Validation compliance
  - Post-Stage 2: Content quality
  - Post-Stage 3: Evidence-based optimization compliance
  - Post-Stage 4: Final QA checklist

---

#### STAGE 1: STRATEGIC DESIGN (G-OPAF Enhanced)

**Kursplan_Analyzer**
- **Input:** Kursplan.pdf
- **Process:**
  - Extract: CourseName, SubjectMatter, TotalCredits, SeQF_Level, IndustryFocus
  - Parse: Learning objectives (Kunskaper, Färdigheter, Kompetenser)
  - Identify: Assessment forms, prerequisites
  - Structure: Into machine-readable format
- **Output:** Structured kursplan data (JSON/XML)
- **Why:** Single source of truth, reusable för alla andra agents

**Instructional_Designer_Agent**
- **Role:** Expert på pedagogisk design, SeQF 6
- **Focus:** Learning objectives, pedagogical structure, assessment alignment
- **Process:**
  - Analyze learning objectives → design module structure
  - Apply Constructivist_Module_Designer principles
  - Design assessment strategy (formative + summative)
  - Ensure "LowThreshold_HighCeiling" strategy
- **Output:** Pedagogical design document
- **Runs:** PARALLEL med andra persona agents

**Subject_Matter_Expert_Agent**
- **Role:** Djup domänkunskap inom subject matter
- **Focus:** Theoretical depth, content accuracy, complexity appropriate for SeQF 6
- **Process:**
  - Identify key theoretical concepts
  - Determine appropriate depth per module
  - Select relevant research/literature
  - Ensure scientific rigor
- **Output:** Content framework med theoretical structure
- **Runs:** PARALLEL med andra persona agents

**YH_Vocational_Consultant_Agent**
- **Role:** Expert på Swedish YH, SeQF, arbetsmarknad
- **Focus:** Industry relevance, workplace connection, vocational competencies
- **Process:**
  - Identify industry-specific requirements
  - Design authentic workplace cases
  - Ensure YH compliance (credits, structure)
  - Connect to arbetsmarknad needs
- **Output:** Vocational context framework
- **Runs:** PARALLEL med andra persona agents

**Strategic_Synthesizer**
- **Role:** Combine outputs från alla persona agents
- **Input:** Outputs från 3 persona agents + Kursplan_Analyzer
- **Process:**
  - Integrate pedagogical, theoretical, och vocational perspectives
  - Resolve conflicts (e.g., depth vs accessibility)
  - Create unified strategic design
  - Apply CLT_Processor principles
  - Generate module outline
- **Output:** Unified strategic design document (Stage 1 output)
- **Runs:** AFTER persona agents complete

**Module_Planner**
- **Role:** Determine antal modules och scope per module
- **Input:** Strategic design + kursplan data
- **Process:**
  - Calculate modules based on credits (e.g., 30 YH-poäng → X modules)
  - Divide learning objectives across modules
  - Plan progression (simple → complex)
  - Define dependencies mellan modules
- **Output:** Module plan (antal, scope, learning objectives per module)

---

#### STAGE 1.5: INTEGRATED VALIDATION (NEW)

**CLT_Validator**
- **Role:** Validate Cognitive Load Theory principles
- **Input:** Strategic design document
- **Checks:**
  - ✓ Jargon_Management: Alla branschtermer definierade?
  - ✓ Intrinsic_Load: Progressiv komplexitet? Scaffolding?
  - ✓ Extraneous_Load: Klart, koncist språk? Redundans eliminerad?
  - ✓ Germane_Load: Elaborative interrogation? Teori-praktik koppling?
- **Output:** Validation report + feedback
- **Action:** If fails → route back to Strategic_Synthesizer för correction

**Alignment_Checker**
- **Role:** Verify constructive alignment
- **Input:** Strategic design document
- **Checks:**
  - ✓ Varje learning objective har motsvarande content?
  - ✓ Varje learning objective har motsvarande assessment?
  - ✓ Assessment difficulty matches SeQF Level 6?
  - ✓ Formative + summative mix finns?
- **Output:** Alignment matrix + gaps
- **Action:** If gaps → feedback till Strategic_Synthesizer

**SeQF_Validator**
- **Role:** Ensure SeQF Level 6 compliance
- **Input:** Strategic design document
- **Checks:**
  - ✓ Content depth appropriate för Level 6? (critical understanding, complex problems)
  - ✓ Autonomy och leadership elements present?
  - ✓ Independent project capability developed?
  - ✓ Analysis, evaluation competencies addressed?
- **Output:** SeQF compliance report
- **Action:** If non-compliant → feedback för adjustment

**Feedback_Router**
- **Role:** Route validation feedback till rätt agents
- **Input:** Validation reports från alla validators
- **Process:**
  - Aggregate feedback
  - Prioritize issues (blocking vs nice-to-have)
  - Route till relevant agents (Strategic_Synthesizer eller specific persona agents)
  - Track iterations
- **Output:** Routing decisions + iteration tracking

---

#### STAGE 2: CONTENT GENERATION (Modularized & Parallelized)

För VARJE MODULE (kör PARALLELLT):

**Module_Content_Generator**
- **Role:** Generate complete content för en modul
- **Input:** Module plan för denna modul + strategic design
- **Sub-components (kör PARALLELLT):**

  **Chapter_1_Generator: Teoretisk Grund**
  - Focus: Vetenskap & litteratur
  - Content: Research, theory, scientific foundation
  - Includes: References, citations
  - Output: Chapter 1 content

  **Chapter_2_Generator: Professionell Praxis**
  - Focus: Expertis & branschkunskap
  - Content: Industry practices, expert insights
  - Includes: Case studies från industry
  - Output: Chapter 2 content

  **Chapter_3_Generator: Praktisk Tillämpning**
  - Focus: Experiment & hands-on
  - Content: Practical exercises, labs, experiments
  - Includes: Step-by-step instructions
  - Output: Chapter 3 content

**PARALLEL Component Generators (kör samtidigt):**

**Advance_Organizer_Generator**
- **Priority:** HIGH (effect size d=1.24)
- **Role:** Create graphic advance organizer (visual concept map)
- **Output:** Visual representation av module's key concepts och relationships

**Worked_Example_Creator**
- **Priority:** HIGH (effect size d=0.67)
- **Role:** Create step-by-step worked examples med annotations
- **Requirements:**
  - Reasoning explained at each step
  - Color-coded eller numbered
  - Demonstrates problem-solving process
- **Output:** 2-3 worked examples per module

**Glossary_Builder**
- **Priority:** HIGH (pre-training d=0.75-0.92)
- **Role:** Build glossary av key terms
- **Requirements:**
  - 5-7 key terms per module
  - Clear definitions
  - Visual representations där relevant
  - Swedish terms med English equivalents där relevant
- **Output:** Glossary section

**Case_Study_Generator**
- **Priority:** MEDIUM (authentic assessment, problem-based learning)
- **Role:** Create verkliga, industry-relevant cases
- **Requirements:**
  - Authentic workplace problem
  - Relevant för IndustryFocus
  - Appropriate complexity för SeQF Level 6
  - Open-ended (inte single right answer)
- **Output:** 1-2 case studies per module

**Exercise_Creator**
- **Priority:** MEDIUM (retrieval practice g=0.50)
- **Role:** Create practical exercises och retrieval prompts
- **Types:**
  - Embedded retrieval questions ("Without looking back, explain...")
  - Metacognitive prompts ("What strategy worked? Why?")
  - Application exercises
- **Output:** Exercise set per module

**Module_Synthesizer**
- **Role:** Combine all components into cohesive module
- **Input:** All outputs från chapter generators + component generators
- **Process:**
  - Integrate chapters (1, 2, 3)
  - Insert components (advance organizer, worked examples, glossary, cases, exercises)
  - Add ExecutiveSummary
  - Add InteractiveComponent suggestions
  - Add ModuleSynthesisAndReflection
  - Ensure flow och coherence
- **Output:** Complete module content (för denna modul)

---

#### STAGE 3: EVIDENCE-BASED OPTIMIZATION (Enhanced)

För VARJE MODULE (kör PARALLELLT):

**Cognitive_Load_Optimizer**
- **Role:** Optimize för cognitive load principles
- **Optimizations:**
  - Segmentation (d=0.79-0.98): Break into digestible chunks
  - Pre-training: Ensure key terms taught first (d=0.75-0.92)
  - Worked examples before practice (d=0.67)
  - Progressive complexity med fading scaffolds
  - Integrate info (text near visuals)
  - Eliminate decorative elements
- **Output:** Optimized module content

**Autonomy_Support_Enhancer**
- **Priority:** HIGHEST (g=1.14)
- **Role:** Enhance learner autonomy throughout module
- **Enhancements:**
  - Add meaningful choices (sequence, examples, assessment options)
  - Use non-controlling language ("you might consider")
  - Explain rationale för requirements (transparent teaching)
  - Acknowledge diverse backgrounds
  - Add self-pacing options med recommended timeline
- **Output:** Autonomy-enhanced module content

**Language_Clarity_Refiner**
- **Priority:** HIGH (d=0.75-0.93)
- **Role:** Refine language för maximum clarity
- **Refinements:**
  - Teacher clarity: Clear objectives, logical sequence, explicit transitions
  - Sentence length: 15-20 words för technical content
  - Active voice, SVO order för key concepts
  - Plain language (high-frequency words when precision permits)
  - Define technical terms immediately after first use
  - Concrete examples BEFORE abstract principles
  - Signaling: Headers every 3-4 paragraphs, bold key terms, transitions
- **Output:** Language-refined module content

**Accessibility_Auditor**
- **Priority:** HIGH (Total Effect 3.56)
- **Role:** Ensure full accessibility
- **Checks & Enhancements:**
  - ✓ Multiple representations (text + visual + example)?
  - ✓ Multiple expression options (varied assessments)?
  - ✓ Multiple engagement pathways (choice)?
  - ✓ ≤5 main choices per screen?
  - ✓ Memory-independent (show previous info when needed)?
  - ✓ Context-sensitive help available?
  - ✓ Culturally diverse examples?
- **Output:** Accessibility-enhanced module + audit report

**Spacing_Integration_Agent**
- **Priority:** MEDIUM (supports long-term retention)
- **Role:** Integrate spaced repetition principles
- **Additions:**
  - End-of-section questions (immediate retrieval)
  - End-of-module cumulative review (15 min)
  - Opening recall prompt för next module (1 day spacing)
  - Note: "Review in 1 week" med specific concepts
  - Connection preview to next module
- **Output:** Spacing-integrated module content

**Module_Quality_Validator**
- **Role:** Validate module mot all Stage 3 requirements
- **Checks:** Run all 11 quality checks från Prompt2:
  - ✓ Effect sizes > 0.60 prioritized?
  - ✓ Autonomy support evident (g=1.14)?
  - ✓ Advance organizers present (d=1.24)?
  - ✓ Segmented appropriately (d=0.79-0.98)?
  - ✓ Pre-training för new terms (d=0.75-0.92)?
  - ✓ Retrieval practice integrated (g=0.50)?
  - ✓ Metacognitive prompts included (g=0.48)?
  - ✓ Self-assessment opportunities (d=1.16)?
  - ✓ Teacher clarity principles applied (d=0.75-0.93)?
  - ✓ Accessible and inclusive (effect 3.56)?
  - ✓ SeQF Level 6 appropriate?
- **Output:** Quality validation report + scores

---

#### STAGE 4: FINAL ASSEMBLY & QA

**Course_Assembler**
- **Role:** Combine all modules into complete course
- **Input:** All optimized modules från Stage 3
- **Process:**
  - Arrange modules in logical sequence
  - Add StrategicIntroduction (course overview, relevance, pedagogical approach)
  - Ensure consistency across modules (terminology, formatting)
  - Add navigation/references between modules
- **Output:** Complete assembled course

**Assessment_Package_Designer**
- **Role:** Design FinalAssessmentPackage
- **Input:** All learning objectives + module content
- **Process:**
  - Design SummativeProject (authentic, workplace-relevant)
  - Create AssessmentCriteria aligned med learning objectives
  - Include formative assessment suggestions
  - Add peer review rubric (d=0.58)
  - Add self-assessment checklist (d=1.16)
- **Output:** Complete assessment package

**Final_QA_Checker**
- **Role:** Run comprehensive final quality assurance
- **Checks:** Combined checklist från both Prompt1 och Prompt2:
  - Prompt1 QA (5 checks):
    * ✓ ALLA learning objectives från kursplan täckta?
    * ✓ Content depth/complexity motsvarar SeQF Level?
    * ✓ PedagogyEngine principles tillämpade konsekvent?
    * ✓ Koppling till IndustryFocus tydlig och relevant?
    * ✓ Språk klart, koncist, anpassat för målgrupp?
  - Prompt2 QA (11 checks): [already listed above]
  - Additional:
    * ✓ All modules present och complete?
    * ✓ Assessment package complete?
    * ✓ Formatting consistent?
- **Output:** Comprehensive QA report + pass/fail

**Format_Converter**
- **Role:** Convert till final output format (Markdown)
- **Input:** Assembled course + assessment package
- **Process:**
  - Convert från internal representation → Markdown
  - Apply formatting requirements från Prompt2:
    * Clear heading hierarchy (H1, H2, H3)
    * Visual elements indicated [INSERT: ...]
    * Bold för key terms at introduction only
    * Numbered lists för procedures
    * Bullet points för non-sequential (max 2 per module)
    * Tables för comparisons
    * Margin notes för retrieval prompts [MARGIN PROMPT]
  - Ensure all links, references work
- **Output:** Final course document (Markdown format)

---

#### CROSS-CUTTING AGENTS (Available to all stages)

**Swedish_Language_Expert**
- **Role:** Ensure korrekt svensk terminologi och språk
- **Available to:** All agents som genererar content
- **Responsibilities:**
  - Validate Swedish grammar, spelling
  - Ensure appropriate academic Swedish tone
  - Provide Swedish terms för technical concepts
  - Ensure consistency in terminology
  - Balance Swedish/English (per kursplan requirements)

**Evidence_Based_Pedagogy_Expert**
- **Role:** Validate och advise på evidence-based practices
- **Available to:** All agents, especially optimization agents
- **Responsibilities:**
  - Verify effect sizes cited correctly
  - Suggest interventions med highest impact
  - Ensure research-backed approaches
  - Provide citations där relevant

**Industry_Context_Agent**
- **Role:** Provide industry-specific context
- **Available to:** Content generators, case study creators
- **Responsibilities:**
  - Provide authentic industry examples
  - Ensure workplace relevance
  - Validate case studies för realism
  - Connect theoretical concepts till industry practice
- **Specialization:** Customized per IndustryFocus från kursplan

**Metadata_Manager**
- **Role:** Track metadata throughout pipeline
- **Available to:** All agents
- **Responsibilities:**
  - Track versions, iterations
  - Manage dependencies mellan agents
  - Log decisions made
  - Track quality metrics over time
  - Enable traceability (which agent generated what?)

---

## 3. Implementation Plan: Phased Approach

### Phase 0: Foundation & Baseline
**Duration:** 1-2 timmar
**Priority:** CRITICAL (foundational)

**Tasks:**
1. Setup project structure
   - Create directory structure för agents
   - Setup configuration files
   - Define agent interfaces/contracts

2. Create testing framework
   - Define test kursplan (use existing Kursplan.pdf)
   - Define success metrics:
     * Generation time
     * Quality scores (QA checklist compliance)
     * Alignment scores
     * Effect size compliance
   - Setup comparison methodology

3. Run baseline
   - Generate course using CURRENT two-stage pipeline (Prompt1 → Prompt2)
   - Measure baseline metrics:
     * Time to complete
     * Quality scores
     * Output size/completeness
   - Document baseline för comparison

4. Create agent templates
   - Master template för all agents
   - Include: Input/Output spec, Responsibilities, Dependencies
   - Create mock agents för testing orchestration

**Deliverables:**
- [ ] Project structure setup
- [ ] Testing framework ready
- [ ] Baseline metrics documented
- [ ] Agent templates created

**Success Criteria:**
- Can run baseline generation successfully
- Metrics clearly defined och measurable
- Ready to implement Phase 1

---

### Phase 1: Module-Level Parallelization (QUICK WIN)
**Duration:** 3-4 timmar
**Priority:** HIGHEST (biggest impact på speed)

**Rationale:** Addresses största bottleneck (monolithic processing). Förväntad 40-60% speed improvement.

**Agents to Implement:**
1. **Kursplan_Analyzer**
   - Parse Kursplan.pdf
   - Extract structured data
   - Test: Verify correct extraction av all fields

2. **Module_Planner**
   - Input: Kursplan data
   - Determine antal modules (e.g., based on YH-poäng, learning objectives)
   - Divide learning objectives across modules
   - Test: Verify reasonable module plan (e.g., 30 poäng → 3-5 modules)

3. **Simplified Module_Content_Generator** (initial version)
   - Input: Module plan för ONE module
   - Generate basic module structure (3 chapters)
   - Use SIMPLIFIED version av Prompt1 + Prompt2 combined
   - Test: Verify coherent module output

4. **Basic Orchestrator**
   - Launch multiple Module_Content_Generators in PARALLEL
   - Wait för all to complete
   - Aggregate results
   - Test: Verify parallel execution works

**Testing:**
- Test med Kursplan.pdf (Examensarbete, 30 poäng)
- Expected modules: ~3 (based on complexity)
- Run 3 Module_Content_Generators in parallel
- Measure: Time vs baseline (sequential)

**Success Criteria:**
- [ ] Kursplan correctly parsed
- [ ] Reasonable module plan generated
- [ ] Modules generated in parallel (verified via logs/timing)
- [ ] Speed improvement: ≥40% vs baseline
- [ ] Output quality: ≥80% av baseline quality

**Expected Impact:**
- **Speed:** 40-60% faster (parallelization av 3-5 modules)
- **Quality:** Similar to baseline (simplified agents, så potential slight decrease)

---

### Phase 2: Integrated Quality Gates
**Duration:** 2-3 timmar
**Priority:** HIGH (proactive validation)

**Rationale:** Early validation reduces costly late-stage revisions. Improves quality without slowing down (quality checks run in parallel med generation).

**Agents to Implement:**
1. **CLT_Validator**
   - Input: Module content (from Phase 1)
   - Run 4 CLT checks (Jargon, Intrinsic Load, Extraneous Load, Germane Load)
   - Output: Validation report + specific feedback
   - Test: Run på Phase 1 outputs, verify catches violations

2. **Alignment_Checker**
   - Input: Module content + learning objectives
   - Check: Each objective → content mapping, assessment mapping
   - Output: Alignment matrix + gaps
   - Test: Verify identifies missing alignments

3. **SeQF_Validator**
   - Input: Module content
   - Check: Depth appropriate för Level 6?
   - Output: Compliance report
   - Test: Verify identifies content that's too shallow/deep

4. **Quality_Gate_Manager**
   - Coordinate all validators
   - Run validators in PARALLEL (not sequential)
   - Aggregate results
   - Decide: Pass to next stage OR route feedback
   - Test: Verify correctly routes feedback

5. **Feedback_Router** (simple version)
   - If validation fails: Route feedback till relevant agent
   - Track iterations (max 2 retries)
   - Test: Verify feedback loop works

**Integration:**
- Add validation stage AFTER module generation (Phase 1)
- Validators run in parallel för all modules
- If fail: Module regenerated med feedback

**Testing:**
- Deliberately introduce violations (e.g., undefined jargon, missing assessment)
- Verify validators catch them
- Verify feedback routes correctly
- Verify re-generation fixes issues

**Success Criteria:**
- [ ] All 3 validators implemented och working
- [ ] Validators run in parallel (verified via timing)
- [ ] Validation reports clear och actionable
- [ ] Feedback loop successfully triggers re-generation
- [ ] Quality improvement: ≥95% QA checklist compliance (vs ~80% baseline)

**Expected Impact:**
- **Quality:** Significant improvement (fewer gaps, better alignment)
- **Speed:** Minimal impact (validators run in parallel, ~5-10% overhead)
- **Revisions:** Fewer late-stage revisions needed

---

### Phase 3: Persona Agent Parallelization
**Duration:** 3-4 timmar
**Priority:** MEDIUM-HIGH (enhances Stage 1 depth)

**Rationale:** Nuvarande Prompt1 har implicit personas. Explicit parallelization ger richer, multi-perspective content.

**Agents to Implement:**
1. **Instructional_Designer_Agent**
   - Focus: Pedagogical structure, learning design
   - Input: Kursplan data
   - Output: Pedagogical design framework
   - Uses: Constructivist principles, assessment strategy

2. **Subject_Matter_Expert_Agent**
   - Focus: Theoretical depth, content accuracy
   - Input: Kursplan data + subject matter
   - Output: Content framework med theoretical structure
   - Uses: Research, scientific rigor

3. **YH_Vocational_Consultant_Agent**
   - Focus: Industry relevance, workplace connection
   - Input: Kursplan data + IndustryFocus
   - Output: Vocational context framework
   - Uses: Authentic cases, arbetsmarknad needs

4. **Strategic_Synthesizer**
   - Input: Outputs från alla 3 personas + kursplan
   - Process: Integrate perspectives, resolve conflicts
   - Output: Unified strategic design
   - Uses: CLT principles

**Integration:**
- Replace simplified Module_Planner (Phase 1) med this richer process:
  1. Kursplan_Analyzer (from Phase 1)
  2. Run 3 persona agents in PARALLEL
  3. Strategic_Synthesizer combines results
  4. Module_Planner uses synthesized design

**Testing:**
- Compare outputs:
  - Phase 1: Simplified module plan
  - Phase 3: Multi-persona strategic design
- Evaluate: Depth, breadth, industry relevance
- Expert review (användaren själv)

**Success Criteria:**
- [ ] 3 persona agents implemented
- [ ] Agents run in parallel (verified)
- [ ] Strategic_Synthesizer successfully integrates perspectives
- [ ] Output richer than Phase 1 (measurable via word count, concept coverage)
- [ ] No conflicts/contradictions in synthesized output
- [ ] Industry relevance improved (user validation)

**Expected Impact:**
- **Quality:** Richer content, better industry connection, deeper pedagogy
- **Speed:** Minimal impact (personas run in parallel)
- **Authenticity:** More authentic cases och workplace relevance

---

### Phase 4: Evidence-Based Optimizers
**Duration:** 4-5 timmar
**Priority:** MEDIUM (enhances Stage 3 optimization)

**Rationale:** Nuvarande Prompt2 är monolithic. Breaking into specialized optimizers enables:
- Parallel optimization
- Focused expertise per optimizer
- Better compliance med effect sizes

**Agents to Implement:**
1. **Cognitive_Load_Optimizer**
   - Focus: Segmentation, pre-training, worked examples, progressive complexity
   - Effect sizes: d=0.67 to d=0.98
   - Input: Module content
   - Output: Cognitively optimized content

2. **Autonomy_Support_Enhancer**
   - Focus: Meaningful choices, non-controlling language, transparent teaching
   - Effect size: g=1.14 (HIGHEST PRIORITY)
   - Input: Module content
   - Output: Autonomy-enhanced content

3. **Language_Clarity_Refiner**
   - Focus: Teacher clarity, plain language, signaling
   - Effect size: d=0.75-0.93
   - Input: Module content
   - Output: Language-refined content
   - Specific: 15-20 words/sentence, active voice, define terms

4. **Accessibility_Auditor**
   - Focus: Multiple representations, UDL principles
   - Effect: 3.56 (total)
   - Input: Module content
   - Output: Accessibility-enhanced content + audit report

5. **Spacing_Integration_Agent**
   - Focus: Spaced repetition, retrieval practice
   - Input: Module content + adjacent modules (för cross-module spacing)
   - Output: Spacing-integrated content

6. **Module_Quality_Validator**
   - Run all 11 quality checks från Prompt2
   - Input: Optimized module
   - Output: Compliance scores + report

**Integration:**
- Add optimization stage AFTER module generation (Phase 1) och validation (Phase 2)
- Run optimizers in PARALLEL för each module (5 optimizers × N modules concurrently)
- Module_Quality_Validator runs after all optimizers complete

**Pipeline so far:**
```
Kursplan → Analyzer → Personas (parallel) → Synthesizer → Module Plan
  → Modules (parallel):
      Generate → Validate (Phase 2) → Optimize (Phase 4, parallel) → QA
  → Assemble → Final
```

**Testing:**
- Compare outputs:
  - Phase 3 output (before optimization)
  - Phase 4 output (after optimization)
- Measure:
  - Effect size compliance (all 11 checks)
  - Autonomy support presence (g=1.14)
  - Language metrics (sentence length, etc.)
  - Accessibility score

**Success Criteria:**
- [ ] All 5 optimizers implemented
- [ ] Optimizers run in parallel (verified)
- [ ] Module_Quality_Validator: ≥95% compliance på all 11 checks
- [ ] Autonomy support measurably increased
- [ ] Language clarity improved (sentence length within 15-20 words)
- [ ] Accessibility audit: ≥90% compliance

**Expected Impact:**
- **Quality:** Highest quality, evidence-based compliant
- **Effect Size Compliance:** 95%+ (vs ~70% baseline)
- **Speed:** Minimal impact (parallel optimization)

---

### Phase 5: Specialized Component Generators
**Duration:** 3-4 timmar
**Priority:** MEDIUM-LOW (adds sophistication)

**Rationale:** Vissa komponenter (advance organizers, worked examples) har very high effect sizes och deserve dedicated agents.

**Agents to Implement:**
1. **Advance_Organizer_Generator**
   - Effect size: d=1.24 (VERY HIGH)
   - Generate: Graphic concept maps showing module structure
   - Output: Visual representation (beskrivning för designer att implementera)

2. **Worked_Example_Creator**
   - Effect size: d=0.67 (HIGH)
   - Generate: Step-by-step examples med annotations
   - Requirements: Reasoning at each step, color-coded
   - Output: 2-3 worked examples per module

3. **Glossary_Builder**
   - Effect size: d=0.75-0.92 (pre-training)
   - Generate: 5-7 key terms per module
   - Requirements: Clear definitions, visual representations
   - Output: Glossary section

4. **Case_Study_Generator**
   - Authentic assessment, problem-based learning
   - Generate: Workplace-relevant cases för IndustryFocus
   - Requirements: Open-ended, SeQF Level 6 complexity
   - Output: 1-2 cases per module

5. **Exercise_Creator**
   - Effect size: g=0.50 (retrieval practice)
   - Generate: Embedded retrieval, metacognitive prompts
   - Types: Recall questions, application exercises
   - Output: Exercise set per module

**Integration:**
- Run component generators in PARALLEL during module generation (Phase 1)
- Module_Synthesizer (new agent) combines chapters + components

**Updated Module Generation (Phase 1 enhanced):**
```
Per Module (parallel):
  - Chapter_1_Generator (Theoretical)    ]
  - Chapter_2_Generator (Professional)   ] Parallel
  - Chapter_3_Generator (Practical)      ]
  - Advance_Organizer_Generator          ]
  - Worked_Example_Creator               ] Parallel
  - Glossary_Builder                     ]
  - Case_Study_Generator                 ]
  - Exercise_Creator                     ]
  → Module_Synthesizer → Complete Module
```

**Testing:**
- Verify each component generator produces high-quality output
- Verify Module_Synthesizer integrates components coherently
- Expert review av advance organizers, worked examples (user validation)

**Success Criteria:**
- [ ] All 5 component generators implemented
- [ ] Components run in parallel (verified)
- [ ] Module_Synthesizer successfully integrates all components
- [ ] Advance organizers clear och useful (user validation)
- [ ] Worked examples demonstrate reasoning at each step
- [ ] Glossary complete (5-7 terms per module)
- [ ] Cases authentic och appropriate complexity
- [ ] Exercises support retrieval practice

**Expected Impact:**
- **Quality:** Highest-impact components (d=1.24, d=0.67) consistently included
- **Completeness:** All modules have all required components
- **Speed:** Faster than sequential (parallel generation)

---

### Phase 6: Cross-Cutting Experts
**Duration:** 2-3 timmar
**Priority:** LOW (adds polish)

**Rationale:** Certain expertise (Swedish language, evidence-based pedagogy, industry context) är relevant för ALLA agents. Cross-cutting agents provide denna expertise on-demand.

**Agents to Implement:**
1. **Swedish_Language_Expert**
   - Available to: All content-generating agents
   - Provides: Swedish terminology, grammar validation, tone guidance
   - Called: When agents need språk guidance

2. **Evidence_Based_Pedagogy_Expert**
   - Available to: All optimization agents
   - Provides: Effect size verification, research citations, intervention advice
   - Called: When agents need pedagogy guidance

3. **Industry_Context_Agent**
   - Available to: Case generators, content generators
   - Provides: Industry-specific examples, workplace context
   - Customized: Per IndustryFocus från kursplan
   - Called: When agents need industry context

4. **Metadata_Manager**
   - Available to: All agents
   - Tracks: Versions, iterations, decisions, quality metrics
   - Provides: Traceability (which agent generated what?)

**Integration:**
- Make these agents callable från all other agents
- Implement as "helper" agents (not in main pipeline)
- Use caching för efficiency (e.g., Swedish terms looked up once)

**Testing:**
- Verify agents can successfully call cross-cutting experts
- Verify Swedish_Language_Expert improves terminology consistency
- Verify Evidence_Based_Pedagogy_Expert correctly validates effect sizes
- Verify Industry_Context_Agent provides relevant context

**Success Criteria:**
- [ ] All 4 cross-cutting agents implemented
- [ ] Agents callable från other agents
- [ ] Swedish terminology consistent across all modules
- [ ] Effect sizes correctly cited (verified by Evidence expert)
- [ ] Industry examples authentic (verified by Industry expert)
- [ ] Metadata tracked throughout pipeline

**Expected Impact:**
- **Quality:** Final polish (terminology, research rigor, industry authenticity)
- **Consistency:** Cross-module consistency
- **Traceability:** Clear provenance av all content

---

### Phase 7: Integration & Optimization
**Duration:** 2-3 timmar
**Priority:** MEDIUM (finalize system)

**Rationale:** Integrate all phases into unified system, optimize performance, validate end-to-end.

**Tasks:**
1. **Full Pipeline Integration**
   - Connect all phases into single orchestrated pipeline
   - Implement Master_Orchestrator (final version)
   - Implement Quality_Gate_Manager (final version)

2. **Performance Optimization**
   - Profile: Identify bottlenecks
   - Optimize: Caching, parallel execution limits, resource management
   - Measure: End-to-end generation time

3. **End-to-End Testing**
   - Run complete pipeline på Kursplan.pdf
   - Generate complete course (all modules, assessment package)
   - Measure: Time, quality, compliance

4. **Comparison med Baseline**
   - Compare Phase 7 output vs baseline (Phase 0)
   - Metrics:
     * Generation time (target: ≥50% faster)
     * Quality (QA checklist compliance, target: ≥95%)
     * Effect size compliance (target: ≥95%)
     * Completeness (all components present)

5. **Documentation**
   - Document agent responsibilities
   - Document pipeline flow
   - Document how to run pipeline
   - Document how to add new agents

**Testing:**
- Full end-to-end test med Kursplan.pdf
- Verify all modules generated
- Verify all components present
- Verify final QA passes
- Verify output format correct (Markdown)

**Success Criteria:**
- [ ] Complete pipeline runs end-to-end without errors
- [ ] Generation time: ≥50% faster than baseline
- [ ] Quality: ≥95% QA checklist compliance
- [ ] Effect size compliance: ≥95%
- [ ] All modules complete (chapters, components, assessments)
- [ ] Final output: Well-formatted Markdown
- [ ] Documentation complete

**Expected Impact:**
- **Speed:** 50-70% faster than baseline (from parallelization)
- **Quality:** 95%+ compliance (from quality gates + optimizers)
- **Completeness:** 100% (all components present)
- **Maintainability:** Clear documentation, easy to extend

---

## 4. Success Metrics & Validation

### 4.1 Quantitative Metrics

**Speed (Primary Goal: ≥50% reduction)**
- Baseline time: [measure in Phase 0]
- Target time: ≤50% av baseline
- Measured: End-to-end generation time för complete course

**Quality (Primary Goal: ≥95% compliance)**
- Baseline: ~70-80% QA checklist compliance (estimated)
- Target: ≥95% compliance
- Measured: Combined checklist från Prompt1 (5 items) + Prompt2 (11 items)

**Effect Size Compliance (Goal: ≥95%)**
- All interventions med ES > 0.60 implemented?
- Measured: Presence av:
  - Advance organizers (d=1.24)
  - Autonomy support (g=1.14)
  - Self-assessment (d=1.16)
  - Segmentation (d=0.79-0.98)
  - Pre-training (d=0.75-0.92)
  - Teacher clarity (d=0.75-0.93)
  - Worked examples (d=0.67)
  - Retrieval practice (g=0.50)
  - Metacognitive prompts (g=0.48)

**Alignment Score (Goal: 100%)**
- All learning objectives → content mapping: 100%
- All learning objectives → assessment mapping: 100%

**Completeness (Goal: 100%)**
- All modules present?
- All chapters per module (3)?
- All components per module (glossary, cases, exercises, etc.)?
- Assessment package complete?

### 4.2 Qualitative Metrics

**Content Depth**
- Appropriate för SeQF Level 6?
- Critical understanding demonstrated?
- Complex problem-solving addressed?
- Evaluation: Expert review (användaren)

**Industry Relevance**
- Authentic workplace cases?
- Industry-specific examples?
- Professional practice connection clear?
- Evaluation: User validation

**Pedagogical Quality**
- LowThreshold_HighCeiling strategy evident?
- Progressive complexity?
- Scaffolding appropriate?
- Evaluation: Instructional design expert review

**Language Quality**
- Clear, concise Swedish?
- Terminology consistent?
- Academic but accessible tone?
- Evaluation: Swedish language expert + user

### 4.3 System Metrics

**Modularity**
- Can individual agents be updated independently?
- Can agents be reused för different courses?
- Evaluation: Attempt to modify one agent, verify no breaks

**Maintainability**
- Is pipeline easy to understand?
- Is documentation clear?
- Can new agents be added easily?
- Evaluation: Attempt to add new agent, measure effort

**Parallelization Effectiveness**
- How many agents run in parallel (peak)?
- What % av time är parallelized vs sequential?
- Measured: Logging, profiling

### 4.4 Validation Strategy

**Phase-by-Phase Validation**
- After each phase: Compare outputs vs previous phase
- Measure: Improvement in speed, quality
- Decision: Proceed to next phase only if improvements evident

**End-to-End Validation (Phase 7)**
- Generate complete course från Kursplan.pdf
- Expert review (användaren själv)
- Student pilot (om möjligt): Test med actual students
- Iterate based på feedback

**Comparison Points**
1. **Baseline (Phase 0):** Current two-stage pipeline
2. **Phase 1:** Module parallelization (speed focus)
3. **Phase 2:** + Quality gates (quality focus)
4. **Phase 3:** + Persona agents (depth focus)
5. **Phase 4:** + Optimizers (evidence-based focus)
6. **Phase 5:** + Component generators (completeness focus)
7. **Phase 7:** Full system (integration)

At each phase, ask:
- Faster than previous?
- Higher quality than previous?
- Worth the added complexity?

---

## 5. Architecture Diagrams

### 5.1 Current State (Two-Stage Pipeline)

```
┌─────────────┐
│ Kursplan.   │
│ pdf         │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│   STAGE 1: Prompt1.rtf (G-OPAF)    │
│                                     │
│   - Personas (implicit)             │
│   - PedagogyEngine                  │
│   - Module generation               │
│   - QA checklist (5 items)          │
│                                     │
│   Output: XML                       │
└──────┬──────────────────────────────┘
       │ (Sequential, no parallelization)
       ▼
┌─────────────────────────────────────┐
│ Utbildningsdokument1 (XML)          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ STAGE 2: Prompt2.rtf (Evidence-     │
│          Based)                     │
│                                     │
│   - Apply effect size interventions │
│   - Optimize cognitive load         │
│   - Add spacing, accessibility      │
│   - QA checklist (11 items)         │
│                                     │
│   Output: Markdown                  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│ Final       │
│ Module      │
│ (Markdown)  │
└─────────────┘

BOTTLENECKS:
❌ Sequential processing (Stage 2 waits för Stage 1)
❌ Monolithic (whole course as one unit)
❌ No parallelization within stages
❌ Redundant processing (overlapping concerns)
❌ Late QA (after generation)
```

### 5.2 Proposed State (Sub-Agent Architecture)

```
┌─────────────┐
│ Kursplan.   │
│ pdf         │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              MASTER ORCHESTRATOR                            │
│  (Coordinates all stages, manages parallelization)          │
└───┬──────────────────────────────────────────────────┬──────┘
    │                                                   │
    │                                            ┌──────▼──────┐
    │                                            │ Quality_    │
    │                                            │ Gate_       │
    │                                            │ Manager     │
    │                                            └──────┬──────┘
    │                                                   │
    ▼                                                   │
┌─────────────────────────────────────┐                │
│  STAGE 1: STRATEGIC DESIGN          │                │
│                                     │                │
│  ┌───────────────────┐              │                │
│  │ Kursplan_Analyzer │              │                │
│  └────────┬──────────┘              │                │
│           │                         │                │
│           ▼                         │                │
│  ┌────────────────────────────┐    │                │
│  │  PARALLEL PERSONA AGENTS   │    │                │
│  │  ┌──────────────────────┐  │    │                │
│  │  │ Instructional_       │  │    │                │
│  │  │ Designer             │  │    │                │
│  │  └──────────────────────┘  │    │                │
│  │  ┌──────────────────────┐  │    │                │
│  │  │ Subject_Matter_      │  │    │                │
│  │  │ Expert               │  │    │                │
│  │  └──────────────────────┘  │    │                │
│  │  ┌──────────────────────┐  │    │                │
│  │  │ YH_Vocational_       │  │    │                │
│  │  │ Consultant           │  │    │                │
│  │  └──────────────────────┘  │    │                │
│  └────────┬───────────────────┘    │                │
│           │                        │                │
│           ▼                        │                │
│  ┌───────────────────┐             │                │
│  │ Strategic_        │             │                │
│  │ Synthesizer       │             │                │
│  └────────┬──────────┘             │                │
│           │                        │                │
│           ▼                        │                │
│  ┌───────────────────┐             │                │
│  │ Module_Planner    │             │                │
│  └────────┬──────────┘             │                │
└───────────┼────────────────────────┘                │
            │                                         │
            ▼                                         │
┌───────────────────────────────────┐                 │
│  STAGE 1.5: VALIDATION (NEW)     │◄────────────────┘
│                                   │
│  ┌─────────────────────────────┐ │
│  │ PARALLEL VALIDATORS         │ │
│  │ - CLT_Validator             │ │
│  │ - Alignment_Checker         │ │
│  │ - SeQF_Validator            │ │
│  └────────┬────────────────────┘ │
│           │                      │
│           ▼                      │
│  ┌───────────────────┐           │
│  │ Feedback_Router   │           │
│  └────────┬──────────┘           │
└───────────┼──────────────────────┘
            │ (Pass/Fail + Feedback)
            │
            ▼
┌───────────────────────────────────────────────────────────┐
│  STAGE 2: CONTENT GENERATION (Modularized)               │
│                                                           │
│  FOR EACH MODULE (PARALLEL):                             │
│  ┌────────────────────────────────────────────────────┐  │
│  │  PARALLEL GENERATORS:                              │  │
│  │  ┌──────────────────┐  ┌──────────────────┐       │  │
│  │  │ Chapter_1        │  │ Advance_         │       │  │
│  │  │ (Theoretical)    │  │ Organizer        │       │  │
│  │  └──────────────────┘  └──────────────────┘       │  │
│  │  ┌──────────────────┐  ┌──────────────────┐       │  │
│  │  │ Chapter_2        │  │ Worked_Example   │       │  │
│  │  │ (Professional)   │  │ Creator          │       │  │
│  │  └──────────────────┘  └──────────────────┘       │  │
│  │  ┌──────────────────┐  ┌──────────────────┐       │  │
│  │  │ Chapter_3        │  │ Glossary_        │       │  │
│  │  │ (Practical)      │  │ Builder          │       │  │
│  │  └──────────────────┘  └──────────────────┘       │  │
│  │  ┌──────────────────┐  ┌──────────────────┐       │  │
│  │  │ Case_Study       │  │ Exercise_        │       │  │
│  │  │ Generator        │  │ Creator          │       │  │
│  │  └──────────────────┘  └──────────────────┘       │  │
│  │                                                    │  │
│  │           ▼                                        │  │
│  │  ┌────────────────────┐                           │  │
│  │  │ Module_Synthesizer │                           │  │
│  │  └────────────────────┘                           │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────┬───────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────┐
│  STAGE 3: EVIDENCE-BASED OPTIMIZATION                    │
│                                                           │
│  FOR EACH MODULE (PARALLEL):                             │
│  ┌────────────────────────────────────────────────────┐  │
│  │  PARALLEL OPTIMIZERS:                              │  │
│  │  - Cognitive_Load_Optimizer                        │  │
│  │  - Autonomy_Support_Enhancer (g=1.14 priority)     │  │
│  │  - Language_Clarity_Refiner (d=0.75-0.93)          │  │
│  │  - Accessibility_Auditor (effect 3.56)             │  │
│  │  - Spacing_Integration_Agent                       │  │
│  │           ▼                                        │  │
│  │  ┌────────────────────┐                           │  │
│  │  │ Module_Quality_    │                           │  │
│  │  │ Validator          │                           │  │
│  │  └────────────────────┘                           │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────┬───────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────┐
│  STAGE 4: FINAL ASSEMBLY & QA                            │
│                                                           │
│  ┌───────────────────┐    ┌──────────────────────┐       │
│  │ Course_Assembler  │    │ Assessment_Package_  │       │
│  │                   │    │ Designer             │       │
│  └────────┬──────────┘    └──────────┬───────────┘       │
│           │                          │                   │
│           └──────────┬───────────────┘                   │
│                      ▼                                   │
│           ┌───────────────────┐                          │
│           │ Final_QA_Checker  │                          │
│           └────────┬──────────┘                          │
│                    │                                     │
│                    ▼                                     │
│           ┌───────────────────┐                          │
│           │ Format_Converter  │                          │
│           └────────┬──────────┘                          │
└────────────────────┼──────────────────────────────────────┘
                     │
                     ▼
            ┌─────────────┐
            │ Final       │
            │ Course      │
            │ (Markdown)  │
            └─────────────┘

CROSS-CUTTING AGENTS (Available to all stages):
┌────────────────────────────────────────────────────┐
│ - Swedish_Language_Expert                          │
│ - Evidence_Based_Pedagogy_Expert                   │
│ - Industry_Context_Agent                           │
│ - Metadata_Manager                                 │
└────────────────────────────────────────────────────┘

IMPROVEMENTS:
✅ Parallel processing at multiple levels
✅ Proactive quality gates (Stage 1.5)
✅ Modular, reusable components
✅ Specialized expertise (cross-cutting agents)
✅ Bi-directional feedback loops
✅ Unified quality framework
```

### 5.3 Parallelization Visualization

**Current (Sequential):**
```
Time →
│
├─ Stage 1 (Prompt1) ──────────────────┤
│                                      │
│                                      ├─ Stage 2 (Prompt2) ──────────────────┤
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
Total Time: T1 + T2
```

**Proposed (Parallel):**
```
Time →
│
├─ Kursplan Analyze ─┤
│                    │
│                    ├─ Personas (parallel) ──┤
│                                             │
│                                             ├─ Synthesize ─┤
│                                                            │
│                    ┌────────────────────────────────────────────────────────┐
│                    │  MODULES IN PARALLEL:                                  │
│                    │  Module 1: Gen → Val → Opt → QA ─────────────┤         │
│                    │  Module 2: Gen → Val → Opt → QA ─────────────┤         │
│                    │  Module 3: Gen → Val → Opt → QA ─────────────┤         │
│                    └──────────────────────────────────────────────┼─────────┘
│                                                                   │
│                                                                   ├─ Assemble ─┤
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
Total Time: ≈ (T1_analysis + T1_personas + T1_synth) + max(T_module1, T_module2, T_module3) + T_assemble
           ≈ 40-60% av sequential time
```

---

## 6. Risk Assessment & Mitigation

### 6.1 Technical Risks

**Risk 1: Coordination Complexity**
- **Description:** Managing många parallel agents är complex
- **Impact:** HIGH (kan leda till bugs, race conditions)
- **Mitigation:**
  - Start med Phase 1 (simple parallelization)
  - Incremental complexity (phase by phase)
  - Thorough testing at each phase
  - Clear agent interfaces/contracts

**Risk 2: Output Quality Degradation**
- **Description:** Breaking monolithic prompts into agents kan reduce quality
- **Impact:** HIGH (defeats purpose)
- **Mitigation:**
  - Baseline comparison at each phase
  - Quality gates (Phase 2) catch issues early
  - Expert review (användaren) at key phases
  - Iterative refinement based på feedback

**Risk 3: Over-Engineering**
- **Description:** Too many agents, too complex
- **Impact:** MEDIUM (maintenance burden)
- **Mitigation:**
  - Phased approach (stop if no improvement)
  - Keep agents simple, focused
  - Document clearly
  - Only add agents that provide measurable value

**Risk 4: Performance Overhead**
- **Description:** Agent coordination overhead kan negate parallelization gains
- **Impact:** MEDIUM (slower instead of faster)
- **Mitigation:**
  - Profile at each phase
  - Optimize bottlenecks
  - Use caching where appropriate
  - Measure: If not faster, rollback

### 6.2 Process Risks

**Risk 5: Scope Creep**
- **Description:** Adding more och more agents indefinitely
- **Impact:** MEDIUM (never finish)
- **Mitigation:**
  - Phased plan med clear stopping points
  - Success criteria per phase (if not met, stop)
  - Focus på highest-impact agents first (Phase 1-4)

**Risk 6: Insufficient Testing**
- **Description:** Not enough validation av outputs
- **Impact:** HIGH (poor quality undetected)
- **Mitigation:**
  - Testing framework (Phase 0)
  - Comparison at each phase
  - Expert review at Phase 3, 4, 7
  - Real student pilot (om möjligt)

### 6.3 User Adoption Risks

**Risk 7: Too Complex to Use**
- **Description:** System becomes too complex för användaren
- **Impact:** MEDIUM (won't use it)
- **Mitigation:**
  - Simple interface (användaren provides kursplan, gets course)
  - Hide complexity behind orchestrator
  - Clear documentation
  - Examples och tutorials

**Risk 8: Lack of Customization**
- **Description:** System too rigid, doesn't fit all courses
- **Impact:** MEDIUM (limited applicability)
- **Mitigation:**
  - Configurable agents (e.g., Industry_Context_Agent customized per course)
  - Allow user to override agent decisions
  - Modular design (user can swap agents)

---

## 7. Next Steps & Recommendations

### 7.1 Immediate Actions (Start Now)

1. **Review This Plan med Användaren**
   - Discuss proposed architecture
   - Validate assumptions (e.g., expected speed improvement)
   - Get feedback på priorities
   - Decide: Proceed med Phase 0?

2. **Setup Development Environment**
   - Create project repository
   - Setup Claude Code workspace
   - Organize files (agents/, tests/, outputs/)

3. **Run Phase 0 (Baseline)**
   - Generate course med current pipeline (Prompt1 → Prompt2)
   - Measure time, quality
   - Document baseline för comparison

### 7.2 Recommended Approach

**Option A: Full Phased Implementation (Recommended)**
- Execute Phase 0 → 7 in order
- Duration: ~20-25 timmar total
- Outcome: Complete sub-agent system
- Best för: Long-term improvement, multiple courses

**Option B: Quick Wins Only**
- Execute Phase 0, 1, 2 only
- Duration: ~6-9 timmar
- Outcome: 40-60% speed improvement + quality gates
- Best för: Immediate needs, proof of concept

**Option C: Hybrid (Balanced)**
- Execute Phase 0, 1, 2, 3, 4 (skip 5, 6)
- Duration: ~12-16 timmar
- Outcome: Major improvements without full complexity
- Best för: Balance mellan effort och impact

**Recommendation:** Start med Option B (Quick Wins), validate improvements, then decide whether to continue med rest.

### 7.3 Success Criteria för "Go/No-Go" Decisions

**After Phase 1:**
- Go to Phase 2 IF: ≥40% speed improvement AND quality ≥80% av baseline
- Else: Stop, investigate, fix

**After Phase 2:**
- Go to Phase 3 IF: Quality ≥95% AND feedback loops working
- Else: Stop, refine Phase 2

**After Phase 4:**
- Go to Phase 5 IF: Effect size compliance ≥95% AND measurable quality improvement
- Else: Stop här (Phase 5-6 är nice-to-have)

**After Phase 7:**
- Deploy IF: ≥50% speed improvement AND ≥95% quality AND user satisfaction
- Else: Iterate based på feedback

### 7.4 Long-Term Vision

**Beyond This Plan:**
1. **Template Library:** Build reusable module templates över time
2. **Multi-Course Support:** Adapt system för different types av YH courses
3. **Student Feedback Loop:** Incorporate student feedback into quality metrics
4. **AI-Assisted Authoring:** Help användaren author case studies, examples (not just generate)
5. **Continuous Improvement:** Agents learn från previous generations

---

## 8. Appendix

### 8.1 Agent Responsibility Matrix

| Agent Name | Stage | Input | Output | Priority | Effect Size |
|-----------|-------|-------|--------|----------|-------------|
| Master_Orchestrator | All | Kursplan | Coordinated execution | CRITICAL | - |
| Quality_Gate_Manager | All | Agent outputs | Validation reports | HIGH | - |
| Kursplan_Analyzer | 1 | Kursplan.pdf | Structured data | HIGH | - |
| Instructional_Designer_Agent | 1 | Kursplan data | Pedagogical design | MEDIUM | - |
| Subject_Matter_Expert_Agent | 1 | Kursplan data | Content framework | MEDIUM | - |
| YH_Vocational_Consultant_Agent | 1 | Kursplan data | Vocational framework | MEDIUM | - |
| Strategic_Synthesizer | 1 | Persona outputs | Unified design | HIGH | - |
| Module_Planner | 1 | Strategic design | Module plan | HIGH | - |
| CLT_Validator | 1.5 | Strategic design | CLT compliance | HIGH | - |
| Alignment_Checker | 1.5 | Strategic design | Alignment matrix | HIGH | - |
| SeQF_Validator | 1.5 | Strategic design | SeQF compliance | HIGH | - |
| Feedback_Router | 1.5 | Validation reports | Routing decisions | MEDIUM | - |
| Chapter_1_Generator | 2 | Module plan | Chapter 1 | MEDIUM | - |
| Chapter_2_Generator | 2 | Module plan | Chapter 2 | MEDIUM | - |
| Chapter_3_Generator | 2 | Module plan | Chapter 3 | MEDIUM | - |
| Advance_Organizer_Generator | 2 | Module plan | Visual organizer | HIGH | 1.24 |
| Worked_Example_Creator | 2 | Module plan | Worked examples | HIGH | 0.67 |
| Glossary_Builder | 2 | Module plan | Glossary | HIGH | 0.75-0.92 |
| Case_Study_Generator | 2 | Module plan | Case studies | MEDIUM | - |
| Exercise_Creator | 2 | Module plan | Exercises | MEDIUM | 0.50 |
| Module_Synthesizer | 2 | All components | Complete module | HIGH | - |
| Cognitive_Load_Optimizer | 3 | Module content | Optimized content | HIGH | 0.67-0.98 |
| Autonomy_Support_Enhancer | 3 | Module content | Enhanced content | HIGHEST | 1.14 |
| Language_Clarity_Refiner | 3 | Module content | Refined content | HIGH | 0.75-0.93 |
| Accessibility_Auditor | 3 | Module content | Accessible content | HIGH | 3.56 |
| Spacing_Integration_Agent | 3 | Module content | Spaced content | MEDIUM | - |
| Module_Quality_Validator | 3 | Optimized module | Quality report | HIGH | - |
| Course_Assembler | 4 | All modules | Complete course | HIGH | - |
| Assessment_Package_Designer | 4 | Learning objectives | Assessment package | HIGH | 1.16 |
| Final_QA_Checker | 4 | Complete course | Final QA report | HIGH | - |
| Format_Converter | 4 | Course content | Markdown | MEDIUM | - |
| Swedish_Language_Expert | Cross | Any text | Language guidance | MEDIUM | - |
| Evidence_Based_Pedagogy_Expert | Cross | Any content | Pedagogy guidance | MEDIUM | - |
| Industry_Context_Agent | Cross | Any content | Industry context | MEDIUM | - |
| Metadata_Manager | Cross | All | Metadata tracking | LOW | - |

### 8.2 Glossary

**Agent:** A specialized Claude Code sub-agent responsible för a specific task

**CLT:** Cognitive Load Theory - pedagogical framework för managing mental effort

**Constructive Alignment:** Ensuring learning objectives, teaching activities, och assessment tasks are aligned

**Effect Size:** Statistical measure av intervention effectiveness (d för Cohen's d, g för Hedges' g)

**G-OPAF:** G-Oriented Pedagogical Architecture Framework (från Prompt1.rtf)

**Orchestrator:** Master agent that coordinates other agents

**Persona:** Role-based agent (e.g., Instructional Designer, Subject Matter Expert)

**Quality Gate:** Validation checkpoint in pipeline

**SeQF:** Swedish Qualifications Framework (svenskt kvalifikationsramverk)

**YH:** Yrkeshögskola (Swedish vocational higher education)

**YH-poäng:** Vocational higher education credits

### 8.3 References

**Evidence-Based Pedagogy (Prompt2.rtf):**
- Effect sizes från meta-analyses
- Highest impact: Autonomy support (g=1.14), Advance organizers (d=1.24), Self-assessment (d=1.16)

**G-OPAF Framework (Prompt1.rtf):**
- Persona-based approach
- CLT principles
- Constructivist design
- "LowThreshold_HighCeiling" strategy

**Swedish YH Context:**
- SeQF Level 6: Critical understanding, complex problems, leadership
- Authentic assessment required
- Industry connection essential

---

## Summary

This plan proposes transforming the current sequential two-stage pipeline into a modular, parallelized sub-agent architecture. Key improvements:

1. **Speed:** 50-70% faster through parallelization (modules, personas, components)
2. **Quality:** 95%+ compliance through proactive quality gates och specialized optimizers
3. **Modularity:** Reusable, maintainable agents
4. **Evidence-Based:** Consistent application av high-impact interventions (ES > 0.60)

**Recommended Approach:** Phased implementation, starting med Phase 0-2 (quick wins), then evaluate before proceeding.

**Next Step:** Review this plan med användaren, get feedback, decide on approach (Option A/B/C), then execute Phase 0.
