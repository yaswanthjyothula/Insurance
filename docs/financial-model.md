# LifeSure AI - Financial Assessment Methodology & Engine Specification

## 1. Overview
The LifeSure AI Financial Calculation Engine provides dual-method evaluation for life coverage requirements in the Indian demographic context:
1. **Capital Needs Analysis (Net Needs Method)**
2. **Human Life Value (HLV) Method**

Both models operate deterministically without reliance on language model synthesis, stochastic assumptions without disclosure, or unstated multiple multipliers.

---

## 2. Capital Needs Analysis (Net Needs Method)

### 2.1 Formula
$$\text{Total Gross Need} = \text{Income Replacement} + \text{Future Goals} + \text{Outstanding Liabilities} + \text{Immediate Expenses}$$

$$\text{Net Coverage Gap} = \max(0, \text{Total Gross Need} - \text{Eligible Financial Assets} - \text{Existing Life Cover})$$

### 2.2 Income Replacement Model
Income replacement represents the capitalized fund needed to replace annual household expenses for the support horizon $N$, factoring in household expense inflation $i$ and nominal safe investment discount rate $r$.

The real discount rate $r_{\text{real}}$ is:
$$r_{\text{real}} = \frac{1 + r}{1 + i} - 1$$

If $r_{\text{real}} \neq 0$:
$$\text{PV}_{\text{Income}} = E_0 \times \frac{1 - (1 + r_{\text{real}})^{-N}}{r_{\text{real}}}$$
where:
- $E_0$ = Current annual household expenses (excluding self-maintenance of the earning member)
- $N$ = Dependency support horizon in years (default: $\max(1, 60 - \text{age})$ or until youngest dependent turns independent)
- $i$ = Expected annual inflation rate (default: $6.0\%$ p.a.)
- $r$ = Risk-free / debt yield discount rate (default: $7.5\%$ p.a.)

### 2.3 Future Goals Present Value
For each future milestone (e.g. child education at year $T$, marriage at year $T_m$):
$$\text{PV}_{\text{Goal}} = \frac{\text{Future Estimated Cost}}{(1 + r)^T} \quad \text{or} \quad \text{Current Value} \times \left(\frac{1 + i_{\text{edu}}}{1 + r}\right)^T$$
where education inflation $i_{\text{edu}}$ is defaulted to $8.0\%$ p.a.

### 2.4 Outstanding Liabilities
Includes outstanding home loans, vehicle loans, education loans, and personal borrowings.

### 2.5 Immediate Expenses
Contingency emergency reserve (default: 6 months living expenses) plus final medical/funeral expenses (default: ₹3,00,000 to ₹5,00,000).

---

## 3. Human Life Value (HLV) Method
HLV measures the economic loss to the family from the premature death of the income earner:
$$\text{HLV} = \sum_{t=1}^{T_{\text{retire}} - \text{Age}} \frac{\text{Net Income}_t \times (1 - c_p)}{(1 + r)^t}$$
where:
- $c_p$ = Personal consumption ratio of earner (default: $25\%$ for married with children, $30\%$ for married without children, $40\%$ for single)
- $T_{\text{retire}}$ = Expected retirement age (default: 60)
- Net Income increases at wage growth rate $g$ (default: $7.0\%$ p.a.)
- Discount rate $r = 7.5\%$ p.a.

---

## 4. Boundary & Edge Case Handling
1. **Existing cover > Total Need:** Net Gap returns ₹0.
2. **Zero or negative income/liabilities:** Validated with minimum non-negative constraints.
3. **Retirement age reached:** Minimum emergency + estate transition need computed.
4. **Rounding:** Stored to 2 decimal places, formatted to nearest ₹1,000 or Lakhs/Crores in UI.
