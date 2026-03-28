const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-US');

const costOfLivingIndexes = {
  'Austin, TX': 119,
  'Boston, MA': 162,
  'Charlotte, NC': 104,
  'Chicago, IL': 108,
  'Dallas, TX': 107,
  'Denver, CO': 129,
  'Miami, FL': 141,
  'Nashville, TN': 112,
  'New York, NY': 185,
  'San Francisco, CA': 191,
  'Seattle, WA': 158,
};

function formatCurrency(value) {
  return currencyFormatter.format(Math.round(value));
}

function formatPercent(value) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function loanPayment(principal, annualRate, months) {
  if (months === 0) {
    return 0;
  }

  if (annualRate === 0) {
    return principal / months;
  }

  const monthlyRate = annualRate / 100 / 12;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}

function remainingBalance(principal, annualRate, months, paymentsMade) {
  if (paymentsMade <= 0) {
    return principal;
  }

  if (annualRate === 0) {
    return Math.max(0, principal - (principal / months) * paymentsMade);
  }

  const monthlyRate = annualRate / 100 / 12;
  const growth = Math.pow(1 + monthlyRate, months);
  const paidGrowth = Math.pow(1 + monthlyRate, paymentsMade);

  return principal * ((growth - paidGrowth) / (growth - 1));
}

function resaleValue(carPrice, ownershipYears) {
  const retention = Math.max(0.22, 0.68 - ownershipYears * 0.09);
  return carPrice * retention;
}

export const calculatorConfigs = [
  {
    slug: 'cost-of-living',
    eyebrow: 'Lifestyle Planning',
    title: 'Cost of Living Calculator',
    metaTitle: 'Cost of Living Calculator for Salary and Rent Comparison',
    metaDescription:
      'Compare your current city to a target city, estimate salary changes, and see how rent shifts with this cost of living calculator.',
    description:
      'Compare your current city with a potential move, estimate your adjusted rent, and see the salary you would need to keep roughly the same standard of living.',
    cardDescription:
      'See how a relocation changes your required salary, rent pressure, and purchasing power.',
    explanationIntro:
      'A cost of living calculator is most helpful when you want a quick first-pass estimate before you commit to interviews, apartment tours, or a relocation package. This version uses indexed city multipliers so you can test how a move may affect housing pressure and salary needs without waiting for a full budget spreadsheet.',
    explanationSections: [
      {
        heading: 'What this calculator does',
        body:
          'The tool compares two cities using a simple cost index. Your current salary and monthly rent are treated as the lifestyle baseline. When the target city has a higher index, the calculator raises the salary needed to keep pace. When the target city is cheaper, it shows how much breathing room you could gain instead. This is useful for screening offers, negotiating pay, or deciding whether a move improves your day-to-day cash flow.',
      },
      {
        heading: 'How to interpret the results',
        body:
          'Focus on the required salary and adjusted rent together rather than on just one number. A city can offer a higher salary while still being harder to afford if rent rises even faster. If the salary gap is small, the move may still work if you expect lower commuting costs or better career upside. If the gap is large, you may need either a stronger offer or a lower fixed-expense plan before relocating.',
      },
      {
        heading: 'Common mistakes',
        body:
          'People often compare only rent and forget taxes, transportation, insurance, and small recurring costs that compound over a year. Another mistake is assuming a headline salary increase automatically means progress. In expensive cities, a raise can disappear quickly if housing, childcare, or dining costs climb faster than income. It also helps to remember that city averages may not reflect your exact neighborhood or lifestyle choices.',
      },
      {
        heading: 'When to use this',
        body:
          'Use this calculator when you are evaluating a job transfer, planning a move to a new metro area, or comparing remote-work options. It is especially helpful early in the process, when you want a directional answer fast. Once a move looks realistic, pair this estimate with a deeper monthly budget and real local housing listings so your final decision is grounded in both broad trends and real prices.',
      },
    ],
    faqs: [
      {
        question: 'Does this calculator use live city data?',
        answer:
          'No. It uses realistic mock cost indexes for now, which makes it useful for planning and product design without depending on a live dataset.',
      },
      {
        question: 'Why does the required salary change more than rent?',
        answer:
          'The salary estimate reflects the broader city index, not just housing. It captures the idea that transportation, groceries, and other recurring costs move with the market too.',
      },
      {
        question: 'Can a lower salary still work in a higher-cost city?',
        answer:
          'Yes, if your personal spending pattern differs from the city average or if you expect stronger career growth. The tool is directional, not a guarantee.',
      },
      {
        question: 'Should I negotiate based on the required salary number?',
        answer:
          'It is a good starting point for negotiation because it frames the move in purchasing-power terms rather than only in headline pay.',
      },
    ],
    related: ['net-worth', 'emergency-fund', 'car-lease-vs-buy'],
    inputs: [
      {
        id: 'currentCity',
        label: 'Current city',
        type: 'select',
        defaultValue: 'Austin, TX',
        options: Object.keys(costOfLivingIndexes).map((city) => ({ label: city, value: city })),
      },
      {
        id: 'targetCity',
        label: 'Target city',
        type: 'select',
        defaultValue: 'Seattle, WA',
        options: Object.keys(costOfLivingIndexes).map((city) => ({ label: city, value: city })),
      },
      {
        id: 'monthlyRent',
        label: 'Monthly rent',
        type: 'number',
        defaultValue: 1850,
        min: 0,
        prefix: '$',
      },
      {
        id: 'salary',
        label: 'Current salary',
        type: 'number',
        defaultValue: 90000,
        min: 0,
        prefix: '$',
      },
    ],
    calculate(values) {
      const currentIndex = costOfLivingIndexes[values.currentCity];
      const targetIndex = costOfLivingIndexes[values.targetCity];
      const multiplier = targetIndex / currentIndex;
      const percentChange = (multiplier - 1) * 100;
      const requiredSalary = values.salary * multiplier;
      const adjustedRent = values.monthlyRent * multiplier;
      const gap = requiredSalary - values.salary;
      const maxBar = Math.max(requiredSalary, values.salary, adjustedRent * 12);

      return {
        heroValue: formatCurrency(requiredSalary),
        heroText:
          gap >= 0
            ? `To maintain roughly the same purchasing power in ${values.targetCity}, you would aim for about ${formatCurrency(requiredSalary)} in annual income.`
            : `${values.targetCity} looks cheaper than ${values.currentCity}, so the same lifestyle may require about ${formatCurrency(requiredSalary)} in annual income.`,
        cards: [
          {
            label: 'Current Salary',
            value: formatCurrency(values.salary),
            note: `${values.currentCity} baseline`,
          },
          {
            label: 'Required Salary',
            value: formatCurrency(requiredSalary),
            accent: gap >= 0 ? 'var(--red)' : 'var(--green)',
            note: `${formatPercent(percentChange)} vs current city`,
          },
          {
            label: 'Adjusted Rent',
            value: formatCurrency(adjustedRent),
            note: 'Estimated equivalent housing cost',
          },
          {
            label: 'Salary Gap',
            value: formatCurrency(Math.abs(gap)),
            accent: gap >= 0 ? 'var(--red)' : 'var(--green)',
            note: gap >= 0 ? 'Additional annual pay needed' : 'Potential annual cushion',
          },
        ],
        comparisons: [
          {
            label: 'Current salary',
            valueLabel: formatCurrency(values.salary),
            value: values.salary,
            max: maxBar,
            tone: 'var(--gold)',
          },
          {
            label: 'Target salary',
            valueLabel: formatCurrency(requiredSalary),
            value: requiredSalary,
            max: maxBar,
            tone: gap >= 0 ? 'var(--red)' : 'var(--green)',
          },
          {
            label: 'Adjusted annual rent',
            valueLabel: formatCurrency(adjustedRent * 12),
            value: adjustedRent * 12,
            max: maxBar,
            tone: 'var(--ink)',
          },
        ],
        chartData: [
          {
            name: 'Salary',
            left: values.salary,
            right: requiredSalary,
          },
          {
            name: 'Annual rent',
            left: values.monthlyRent * 12,
            right: adjustedRent * 12,
          },
        ],
        chartLabels: {
          leftLabel: values.currentCity,
          rightLabel: values.targetCity,
        },
        takeaway:
          gap >= 0
            ? `This move points to a higher-cost environment. If your offer does not close a ${formatCurrency(gap)} salary gap, review housing and transportation assumptions before relocating.`
            : `This move appears to reduce living costs. That could improve your monthly flexibility, but it is still worth checking taxes, commuting, and neighborhood-level housing prices.`,
      };
    },
  },
  {
    slug: 'net-worth',
    eyebrow: 'Balance Sheet',
    title: 'Net Worth Calculator',
    metaTitle: 'Net Worth Calculator to Track Assets and Liabilities',
    metaDescription:
      'Add up your cash, investments, property, loans, and credit card debt to calculate net worth and understand your financial position.',
    description:
      'Measure what you own against what you owe so you can see your current net worth and the balance between assets and liabilities.',
    cardDescription:
      'Add assets and debts to see your true financial position in one clean snapshot.',
    explanationIntro:
      'Net worth is one of the clearest ways to measure financial progress because it captures the whole picture, not just your paycheck or account balance. This calculator helps you total core assets and subtract major liabilities so you can track whether your overall financial position is strengthening over time.',
    explanationSections: [
      {
        heading: 'What this calculator does',
        body:
          'The calculator adds up liquid cash, investments, and property value on one side of the ledger. It then subtracts major debts such as loans and credit card balances. The result is your estimated net worth. A positive number means your assets exceed your liabilities. A negative number means debt still outweighs what you own today, which is common early in a career or during large purchase years.',
      },
      {
        heading: 'How to interpret results',
        body:
          'The total net worth number matters, but the composition matters just as much. Two people can have the same net worth and very different financial flexibility if one has mostly cash and the other has mainly home equity. The assets-versus-liabilities split helps you spot whether your balance sheet is durable, leveraged, or concentrated in one category. That makes it easier to set better savings and debt-paydown priorities.',
      },
      {
        heading: 'Common mistakes',
        body:
          'A common mistake is counting only checking and savings balances while leaving out debts or property values. Another is using outdated estimates that make the number feel more precise than it really is. Net worth works best when it is directionally honest and updated consistently over time. You also do not want to confuse income with net worth. High income can support growth, but it does not automatically mean strong accumulated wealth.',
      },
      {
        heading: 'When to use this',
        body:
          'This calculator is useful for monthly check-ins, annual reviews, and major life decisions like buying a home or changing jobs. It can also help you track whether paying down debt or investing new cash will have the greater impact on your balance sheet. Over time, your net worth trend is often more useful than any single snapshot because it reveals whether your financial system is moving in the right direction.',
      },
    ],
    faqs: [
      {
        question: 'Is home equity part of net worth?',
        answer:
          'Yes. Property value is an asset, and any associated debt belongs under liabilities. This simplified version uses the gross property value input because the liability side is entered separately.',
      },
      {
        question: 'Why can net worth be negative?',
        answer:
          'It usually means your debts are larger than your assets right now. That is common for students, recent graduates, or anyone early in a debt payoff journey.',
      },
      {
        question: 'How often should I calculate net worth?',
        answer:
          'Monthly or quarterly is usually enough. Consistency matters more than frequency because trends tell you more than one isolated number.',
      },
      {
        question: 'Should I include retirement accounts as investments?',
        answer:
          'Yes. If you want a fuller picture, retirement balances fit naturally in the investments field because they are still assets you own.',
      },
    ],
    related: ['emergency-fund', 'cost-of-living', 'car-lease-vs-buy'],
    inputs: [
      {
        id: 'cash',
        label: 'Cash',
        type: 'number',
        defaultValue: 18000,
        min: 0,
        prefix: '$',
      },
      {
        id: 'investments',
        label: 'Investments',
        type: 'number',
        defaultValue: 72000,
        min: 0,
        prefix: '$',
      },
      {
        id: 'propertyValue',
        label: 'Property value',
        type: 'number',
        defaultValue: 320000,
        min: 0,
        prefix: '$',
      },
      {
        id: 'loans',
        label: 'Loans',
        type: 'number',
        defaultValue: 110000,
        min: 0,
        prefix: '$',
      },
      {
        id: 'creditCardDebt',
        label: 'Credit card debt',
        type: 'number',
        defaultValue: 4500,
        min: 0,
        prefix: '$',
      },
    ],
    calculate(values) {
      const assets = values.cash + values.investments + values.propertyValue;
      const liabilities = values.loans + values.creditCardDebt;
      const netWorth = assets - liabilities;
      const maxBar = Math.max(assets, liabilities, values.propertyValue, values.investments, values.cash);

      return {
        heroValue: formatCurrency(netWorth),
        heroText:
          netWorth >= 0
            ? `Your estimated net worth is positive, which means your assets currently exceed your liabilities by ${formatCurrency(netWorth)}.`
            : `Your estimated net worth is currently negative by ${formatCurrency(Math.abs(netWorth))}, meaning debt is still larger than total assets.`,
        cards: [
          {
            label: 'Total Assets',
            value: formatCurrency(assets),
            accent: 'var(--green)',
            note: 'Cash, investments, and property',
          },
          {
            label: 'Total Liabilities',
            value: formatCurrency(liabilities),
            accent: 'var(--red)',
            note: 'Loans plus revolving debt',
          },
          {
            label: 'Net Worth',
            value: formatCurrency(netWorth),
            accent: netWorth >= 0 ? 'var(--green)' : 'var(--red)',
            note: 'Assets minus liabilities',
          },
          {
            label: 'Debt Load',
            value: `${assets ? ((liabilities / assets) * 100).toFixed(1) : '0.0'}%`,
            note: 'Liabilities as a share of assets',
          },
        ],
        comparisons: [
          {
            label: 'Assets',
            valueLabel: formatCurrency(assets),
            value: assets,
            max: maxBar,
            tone: 'var(--green)',
          },
          {
            label: 'Liabilities',
            valueLabel: formatCurrency(liabilities),
            value: liabilities,
            max: maxBar,
            tone: 'var(--red)',
          },
          {
            label: 'Property concentration',
            valueLabel: `${assets ? ((values.propertyValue / assets) * 100).toFixed(0) : 0}%`,
            value: values.propertyValue,
            max: maxBar,
            tone: 'var(--gold)',
          },
        ],
        chartData: [
          {
            name: 'Balance sheet',
            left: assets,
            right: liabilities,
          },
        ],
        chartLabels: {
          leftLabel: 'Assets',
          rightLabel: 'Liabilities',
        },
        takeaway:
          netWorth >= 0
            ? 'A positive net worth is a strong foundation, but the mix still matters. If most of your wealth is tied to property, consider whether you want more liquid reserves too.'
            : 'A negative net worth is a signal, not a verdict. Reducing high-interest debt and steadily building liquid assets usually changes the picture faster than chasing complexity.',
      };
    },
  },
  {
    slug: 'car-lease-vs-buy',
    eyebrow: 'Auto Decision',
    title: 'Car Lease vs Buy Calculator',
    metaTitle: 'Car Lease vs Buy Calculator for Ownership Cost Comparison',
    metaDescription:
      'Compare the estimated cost of leasing versus buying a car based on vehicle price, down payment, interest rate, lease cost, and ownership timeline.',
    description:
      'Compare the estimated cost of leasing and buying a car over your intended ownership period, including financing, depreciation, and basic cost assumptions.',
    cardDescription:
      'Test a vehicle decision with side-by-side lease and buy cost estimates over time.',
    explanationIntro:
      'Lease-versus-buy decisions are rarely about the monthly payment alone. The real question is how much value you keep or give up over the time you actually plan to drive the car. This calculator compares leasing and buying over a shared ownership window so you can judge the total cost, not just the most comfortable monthly option.',
    explanationSections: [
      {
        heading: 'What this calculator does',
        body:
          'The lease side estimates your monthly lease cost over the full ownership horizon and layers in standard transaction fees for each lease cycle. The buy side estimates your financed payment using the car price, down payment, and loan rate, then subtracts an estimated resale value when you exit the vehicle. It also includes a simple maintenance assumption so buying is not unrealistically flattering.',
      },
      {
        heading: 'How to interpret the results',
        body:
          'The biggest number to watch is the total ownership cost over your chosen time horizon. If buying costs less, it usually means your resale value and equity are offsetting the financing expense. If leasing wins, the combination of depreciation, rate, and ownership duration may be making ownership less efficient. The monthly equivalent helps you compare the decision to your cash flow without losing sight of total dollars spent.',
      },
      {
        heading: 'Common mistakes',
        body:
          'Many buyers fixate on the monthly payment and ignore depreciation. Many lessees overlook repeated acquisition and disposition fees when they lease again after the first term. Another mistake is comparing a short lease to a long ownership plan without matching the time horizon. The most useful comparison puts both choices on equal time and includes the cost of exiting each path cleanly.',
      },
      {
        heading: 'When to use this',
        body:
          'Use this calculator when you are deciding between a lease offer and a financed purchase on a similar vehicle. It is particularly helpful if you know roughly how many years you will keep the car. The answer can change a lot between a three-year ownership window and a six-year one, so a quick scenario comparison often reveals which direction is more efficient for your actual habits.',
      },
    ],
    faqs: [
      {
        question: 'Does the calculator assume a specific loan term?',
        answer:
          'Yes. The buy comparison assumes a standard 60-month auto loan because loan term was not provided as a direct input.',
      },
      {
        question: 'Why is resale value included in the buy option?',
        answer:
          'Because ownership lets you recover value when you sell or trade the car. Ignoring resale would overstate the true cost of buying.',
      },
      {
        question: 'Can leasing still make sense if it costs more?',
        answer:
          'Yes. Some drivers value warranty coverage, predictable turnover, or lower maintenance friction enough to justify the higher total cost.',
      },
      {
        question: 'What if I keep cars much longer than five years?',
        answer:
          'Buying often becomes more attractive the longer you keep a vehicle, especially after the loan is paid down and you still have usable resale value.',
      },
    ],
    related: ['emergency-fund', 'net-worth', 'cost-of-living'],
    inputs: [
      {
        id: 'carPrice',
        label: 'Car price',
        type: 'number',
        defaultValue: 42000,
        min: 0,
        prefix: '$',
      },
      {
        id: 'downPayment',
        label: 'Down payment',
        type: 'number',
        defaultValue: 5000,
        min: 0,
        prefix: '$',
      },
      {
        id: 'loanInterestRate',
        label: 'Loan interest rate',
        type: 'number',
        defaultValue: 6.2,
        min: 0,
        step: 0.1,
        suffix: '%',
      },
      {
        id: 'leaseMonthlyCost',
        label: 'Lease monthly cost',
        type: 'number',
        defaultValue: 489,
        min: 0,
        prefix: '$',
      },
      {
        id: 'leaseDuration',
        label: 'Lease duration',
        type: 'number',
        defaultValue: 3,
        min: 1,
        max: 6,
        suffix: 'yr',
      },
      {
        id: 'ownershipDuration',
        label: 'Ownership duration',
        type: 'number',
        defaultValue: 5,
        min: 1,
        max: 10,
        suffix: 'yr',
      },
    ],
    calculate(values) {
      const ownershipMonths = values.ownershipDuration * 12;
      const leaseMonths = values.leaseDuration * 12;
      const leaseCycles = Math.ceil(ownershipMonths / leaseMonths);
      const leaseFees = leaseCycles * (695 + 395);
      const totalLeaseCost = values.leaseMonthlyCost * ownershipMonths + leaseFees;

      const principal = Math.max(values.carPrice - values.downPayment, 0);
      const loanMonths = 60;
      const monthlyPayment = loanPayment(principal, values.loanInterestRate, loanMonths);
      const paymentsMade = Math.min(ownershipMonths, loanMonths);
      const remaining = remainingBalance(principal, values.loanInterestRate, loanMonths, paymentsMade);
      const estimatedResale = resaleValue(values.carPrice, values.ownershipDuration);
      const maintenance = values.carPrice * 0.015 * values.ownershipDuration;
      const totalBuyCost =
        values.downPayment + monthlyPayment * paymentsMade + maintenance + remaining - estimatedResale;
      const cheaperOption = totalBuyCost <= totalLeaseCost ? 'Buying' : 'Leasing';
      const difference = Math.abs(totalLeaseCost - totalBuyCost);
      const maxBar = Math.max(totalLeaseCost, totalBuyCost, estimatedResale);

      return {
        heroValue: `${cheaperOption} saves ${formatCurrency(difference)}`,
        heroText: `Over ${values.ownershipDuration} years, the model estimates ${cheaperOption.toLowerCase()} is the lower-cost path based on financing, lease cycle fees, maintenance, and estimated resale value.`,
        cards: [
          {
            label: 'Lease Cost',
            value: formatCurrency(totalLeaseCost),
            accent: cheaperOption === 'Leasing' ? 'var(--green)' : 'var(--red)',
            note: `${leaseCycles} lease cycle${leaseCycles > 1 ? 's' : ''} across ${ownershipMonths} months`,
          },
          {
            label: 'Buy Cost',
            value: formatCurrency(totalBuyCost),
            accent: cheaperOption === 'Buying' ? 'var(--green)' : 'var(--red)',
            note: 'Includes maintenance and resale offset',
          },
          {
            label: 'Buy Payment',
            value: formatCurrency(monthlyPayment),
            note: 'Estimated 60-month loan payment',
          },
          {
            label: 'Estimated Resale',
            value: formatCurrency(estimatedResale),
            accent: 'var(--gold)',
            note: 'Value recovered at exit',
          },
        ],
        comparisons: [
          {
            label: 'Lease total',
            valueLabel: formatCurrency(totalLeaseCost),
            value: totalLeaseCost,
            max: maxBar,
            tone: 'var(--red)',
          },
          {
            label: 'Buy total',
            valueLabel: formatCurrency(totalBuyCost),
            value: totalBuyCost,
            max: maxBar,
            tone: 'var(--green)',
          },
          {
            label: 'Resale value',
            valueLabel: formatCurrency(estimatedResale),
            value: estimatedResale,
            max: maxBar,
            tone: 'var(--gold)',
          },
        ],
        chartData: [
          {
            name: 'Ownership cost',
            left: totalLeaseCost,
            right: totalBuyCost,
          },
        ],
        chartLabels: {
          leftLabel: 'Lease',
          rightLabel: 'Buy',
        },
        takeaway:
          cheaperOption === 'Buying'
            ? 'Buying comes out ahead here because the resale value you keep offsets a meaningful chunk of the financing cost. The longer you hold the car, the stronger that effect can become.'
            : 'Leasing comes out ahead in this scenario, usually because the ownership window is short or the financing and depreciation drag make buying less efficient. Check mileage terms before deciding.',
      };
    },
  },
  {
    slug: 'emergency-fund',
    eyebrow: 'Cash Reserve',
    title: 'Emergency Fund Calculator',
    metaTitle: 'Emergency Fund Calculator for 3, 6, or 12 Months of Expenses',
    metaDescription:
      'Estimate how much emergency savings you need based on monthly expenses and a 3-, 6-, or 12-month reserve target.',
    description:
      'Calculate a practical emergency fund target based on your monthly expenses and the level of cushion you want for uncertain income or surprise costs.',
    cardDescription:
      'Set a cash reserve target with a fast 3-, 6-, or 12-month emergency fund estimate.',
    explanationIntro:
      'An emergency fund is meant to buy time, not generate returns. The right target depends on how stable your income is, how quickly you could cut costs, and how much uncertainty you face. This calculator gives you a clear savings number tied to your monthly expenses so you can stop guessing and set a target with purpose.',
    explanationSections: [
      {
        heading: 'What this calculator does',
        body:
          'The calculator multiplies your monthly expenses by a reserve window of three, six, or twelve months. That simple math is powerful because it turns a vague idea like “I should save more” into a concrete cash target. A smaller reserve may fit stable dual-income households, while a larger reserve often makes sense for variable income, self-employment, or major upcoming transitions.',
      },
      {
        heading: 'How to interpret the results',
        body:
          'Think of the recommendation as a runway estimate. Three months can cover short disruptions. Six months offers a more durable cushion for job changes or health setbacks. Twelve months is often appropriate when income is highly cyclical or responsibilities are large. The result is not a fixed rule, but it gives you a disciplined benchmark for cash reserves before you take on more risk elsewhere.',
      },
      {
        heading: 'Common mistakes',
        body:
          'A common mistake is using total spending from a busy month instead of essential monthly expenses. Another is parking too little cash while assuming credit cards can fill the gap. Debt can solve timing, but it usually increases stress and cost during an emergency. It is also easy to over-save in cash if your job is extremely stable, so use the risk level thoughtfully instead of defaulting to the biggest number.',
      },
      {
        heading: 'When to use this',
        body:
          'Use this calculator when you are building a first emergency fund, adjusting after a move, or deciding whether your savings account is large enough for a new season of life. It is especially valuable before a job change, a new lease, a home purchase, or a move to self-employment. A clear reserve goal helps you separate emergency cash from longer-term investing money.',
      },
    ],
    faqs: [
      {
        question: 'What expenses should I include?',
        answer:
          'Use essential monthly expenses first, such as housing, food, insurance, debt minimums, utilities, and transportation. Optional spending can be layered in if you want a larger buffer.',
      },
      {
        question: 'When should I choose 12 months?',
        answer:
          'A 12-month reserve often makes sense if your income is volatile, you are self-employed, or your household would have a hard time replacing lost income quickly.',
      },
      {
        question: 'Should my emergency fund stay in cash?',
        answer:
          'Usually yes. The goal is accessibility and stability, not long-term growth. High-yield savings accounts are a common home for this type of money.',
      },
      {
        question: 'Can I build the fund in stages?',
        answer:
          'Yes. Many people target one month first, then three, then six. Hitting milestones tends to feel more realistic than chasing the full amount at once.',
      },
    ],
    related: ['net-worth', 'cost-of-living', 'car-lease-vs-buy'],
    inputs: [
      {
        id: 'monthlyExpenses',
        label: 'Monthly expenses',
        type: 'number',
        defaultValue: 4200,
        min: 0,
        prefix: '$',
      },
      {
        id: 'riskLevel',
        label: 'Risk level',
        type: 'select',
        defaultValue: '6',
        options: [
          { label: 'Lower risk cushion (3 months)', value: '3' },
          { label: 'Balanced cushion (6 months)', value: '6' },
          { label: 'High cushion (12 months)', value: '12' },
        ],
      },
    ],
    calculate(values) {
      const months = Number(values.riskLevel);
      const target = values.monthlyExpenses * months;
      const threeMonth = values.monthlyExpenses * 3;
      const sixMonth = values.monthlyExpenses * 6;
      const twelveMonth = values.monthlyExpenses * 12;
      const maxBar = Math.max(threeMonth, sixMonth, twelveMonth);
      const label =
        months === 3
          ? 'a lean reserve'
          : months === 6
            ? 'a balanced reserve'
            : 'a deeper reserve';

      return {
        heroValue: formatCurrency(target),
        heroText: `Based on ${formatCurrency(values.monthlyExpenses)} in monthly expenses, ${label} points to about ${formatCurrency(target)} in emergency savings.`,
        cards: [
          {
            label: 'Recommended Fund',
            value: formatCurrency(target),
            accent: 'var(--green)',
            note: `${months} months of expenses`,
          },
          {
            label: 'Monthly Burn',
            value: formatCurrency(values.monthlyExpenses),
            note: 'Core monthly spending estimate',
          },
          {
            label: 'Six-Month Target',
            value: formatCurrency(sixMonth),
            note: 'Popular middle-ground benchmark',
          },
          {
            label: 'Year Reserve',
            value: formatCurrency(twelveMonth),
            note: 'Useful for volatile income',
          },
        ],
        comparisons: [
          {
            label: '3 months',
            valueLabel: formatCurrency(threeMonth),
            value: threeMonth,
            max: maxBar,
            tone: months === 3 ? 'var(--green)' : 'var(--ink)',
          },
          {
            label: '6 months',
            valueLabel: formatCurrency(sixMonth),
            value: sixMonth,
            max: maxBar,
            tone: months === 6 ? 'var(--green)' : 'var(--gold)',
          },
          {
            label: '12 months',
            valueLabel: formatCurrency(twelveMonth),
            value: twelveMonth,
            max: maxBar,
            tone: months === 12 ? 'var(--green)' : 'var(--red)',
          },
        ],
        chartData: [
          {
            name: 'Reserve target',
            left: threeMonth,
            right: sixMonth,
          },
          {
            name: 'Extended reserve',
            left: sixMonth,
            right: twelveMonth,
          },
        ],
        chartLabels: {
          leftLabel: 'Lower',
          rightLabel: 'Higher',
        },
        takeaway:
          months === 3
            ? 'A three-month fund is a solid first milestone when income is stable and your fixed costs are manageable.'
            : months === 6
              ? 'A six-month fund gives many households the best balance between safety and keeping too much cash on the sidelines.'
              : 'A twelve-month reserve favors flexibility and resilience, especially when income is irregular or responsibilities are high.',
      };
    },
  },
];

export function getCalculatorConfig(slug) {
  return calculatorConfigs.find((calculator) => calculator.slug === slug);
}

export const calculatorDirectory = calculatorConfigs.map((calculator) => ({
  slug: calculator.slug,
  title: calculator.title,
  cardDescription: calculator.cardDescription,
}));

export const calculatorStats = {
  count: calculatorConfigs.length,
  totalFaqs: calculatorConfigs.reduce((total, calculator) => total + calculator.faqs.length, 0),
  totalInputs: calculatorConfigs.reduce((total, calculator) => total + calculator.inputs.length, 0),
  supportedCities: numberFormatter.format(Object.keys(costOfLivingIndexes).length),
};
