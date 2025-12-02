# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This repository contains a **two-stage instructional design pipeline** for creating optimized educational materials from course syllabi (kursplaner) for Swedish vocational higher education (Yrkeshögskola, YH).

**Pipeline Overview:**
1. **Stage 1 (Prompt1.rtf):** Transform kursplan → utbildningsdokument1 (using G-OPAF framework)
2. **Stage 2 (Prompt2.rtf):** Optimize utbildningsdokument1 → final educational module (applying evidence-based pedagogy)

**Current Objective:** Study and improve this approach by implementing specialized sub-agents in Claude Code to enhance the pipeline's effectiveness and quality.

## Key Files

### Kursplan.pdf
Course syllabus (Swedish: "kursplan") for "Examensarbete" (Thesis Work) in the program "Fastighetstekniker hållbar drift" (Property Technician - Sustainable Operations).

**Key Information:**
- Credits: 30 YH-poäng
- SeQF Level: 6 (Swedish Qualifications Framework - equivalent to advanced vocational/bachelor's level)
- Language: Swedish (with some English requirements)
- Assessment: Written report, oral presentation, peer review (opposition)

**Learning Objectives (Läranderesultat):**
1. Apply in-depth knowledge within the professional field
2. Present relevant research questions for development/specialization work
3. Formulate, identify, and present questions; conduct independent information searches; evaluate relevance; use correct referencing
4. Evaluate own thesis considering societal and ethical aspects
5. Analyze, evaluate, and critically review another student's thesis

### Prompt1.rtf (G-OPAF Instruction Set v2.1)
**Stage 1 Prompt:** Transforms kursplan.pdf into utbildningsdokument1 using XML-structured framework.

**Core Principles:**
- **Language:** Swedish (sv-SE)
- **Tone:** Academic but pedagogical, focusing on essential information
- **Target Audience:** Adult learners at SeQF Level 6
- **Strategy:** "LowThreshold_HighCeiling" - accessible to beginners but with expert-level depth
- **Output Format:** XML

**Pedagogical Framework:**
- **CLT (Cognitive Load Theory):** Define all jargon, use scaffolding/chunking, reduce extraneous load, enhance germane load through elaborative interrogation
- **Constructivist Design:** Use analogies, activate prior knowledge, problem-based learning, reflective practice
- **Assessment:** Authentic assessment aligned with learning objectives, mix of formative and summative evaluation

**Module Structure:**
Each module contains three chapters:
1. Theoretical Foundation (Science & Literature)
2. Professional Practice (Expertise & Industry Knowledge)
3. Practical Application (Experiments & Hands-on)

Plus: glossary, case studies, practical exercises, interactive components, synthesis/reflection

### Prompt2.rtf (Evidence-Based Pedagogy Framework)
**Stage 2 Prompt:** Takes utbildningsdokument1 and optimizes it using research-backed instructional design principles with specific effect sizes for interventions.

**Priority Interventions (Effect Size > 0.60):**
- Graphic advance organizers (d=1.24)
- Autonomy support (g=1.14 - HIGHEST PRIORITY)
- Self-assessment with clear criteria (d=1.16)
- Pre-training for key terms (d=0.75-0.92)
- Segmentation (d=0.79-0.98)
- Worked examples (d=0.67)
- Teacher clarity (d=0.75-0.93)

**Module Structure Requirements:**
- BLUF opening (Bottom Line Up Front)
- 3-5 sections, 10-15 pages each
- 15-20 words per sentence for technical content
- Embedded retrieval practice (g=0.50)
- Metacognitive prompts (g=0.48)
- Spaced repetition integration
- Authentic assessment tasks

**Output Format:** Markdown with clear heading hierarchy

## Current Workflow (Two-Stage Pipeline)

### Stage 1: Kursplan → Utbildningsdokument1
1. Input: Kursplan.pdf (course syllabus)
2. Process: Apply Prompt1.rtf (G-OPAF framework)
3. Output: Utbildningsdokument1 (XML-formatted educational document)

### Stage 2: Utbildningsdokument1 → Optimized Module
1. Input: Utbildningsdokument1
2. Process: Apply Prompt2.rtf (evidence-based optimization)
3. Output: Final educational module (Markdown format)

## Improvement Strategy

The goal is to enhance this pipeline using specialized sub-agents in Claude Code. See planning documents for detailed analysis and implementation strategy.

### Working with Swedish Educational Context

**SeQF Level 6 Characteristics:**
- Critical understanding of complex problems
- Ability to lead and develop work processes
- Independent project completion
- Analysis, problem formulation, solution, documentation, communication

**YH Context:**
- Vocational higher education for adult learners
- Direct connection to industry/workplace needs
- Practical, competency-based assessment
- Often includes LIA (workplace learning)

## Language and Terminology

- **Kursplan:** Course syllabus
- **Examensarbete:** Thesis work / final project
- **YH-poäng:** YH credits (vocational higher education credits)
- **SeQF:** Swedish Qualifications Framework
- **Läranderesultat:** Learning outcomes
- **Opposition:** Peer review/critique of another student's thesis
- **Godkänd (G):** Pass
- **Väl Godkänd (VG):** Pass with distinction
- **Icke Godkänd (IG):** Fail

## Important Constraints

- Content must be accessible to beginners while maintaining expert-level depth
- All industry-specific terms must be defined on first use
- Assessment must reflect real workplace tasks
- Swedish language is primary, with some English components
- Must align with SeQF Level 6 requirements
- Educational materials should be evidence-based with preference for interventions with effect size > 0.60
