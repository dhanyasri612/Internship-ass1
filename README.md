

---

## Overview

This project aims to build an AI-driven system that automates **key clause extraction** and **risk assessment** in contracts.  
It also provides **contract modification suggestions** based on regulatory updates and identified risks.

---

## Objective

- **Assignment 1:** Build a system that automatically identifies key clauses in contracts and assesses associated risks.  
- **Assignment 2:** Extend the system to **modify contracts** by adding missing clauses or mitigating risk clauses.

---

## Assignment 1 - Clause Extraction & Risk Assessment

### Tasks

1. Gather initial contract documents. Focus on identifying:
   - Key clauses  
   - Associated risk factors for model training

2. Implement **LLMs** (OpenAI GPT, Meta LLaMA, or other) to extract clauses.  

3. Build a **risk assessment algorithm** that flags potential compliance issues based on regulatory standards.

### Workflow


- **Phase 1:** Clause Type Classification  
- **Phase 2:** Risk Analysis  

---

## Assignment 2 - Contract Modification Module

### Objective

Develop a system that tracks regulatory updates and **automatically modifies contracts** based on identified risks or missing clauses.

### Tasks

1. Integrate APIs or monitoring systems to track legal changes (e.g., GDPR, HIPAA).  

2. Automatically update contracts with:
   - Missing key clauses  
   - Clauses that reduce risks

3. Example Scenarios:

| Scenario | Action | Outcome |
|----------|--------|---------|
| HIPAA | Add missing clause "Data Privacy Protection Right" | Modified contract contains the new clause |
| GDPR | Add missing risk clause | Reduces contract compliance risk |


