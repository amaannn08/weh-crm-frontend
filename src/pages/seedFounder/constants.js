// ─── Presets ────────────────────────────────────────────────────────────────
export const PRESETS = {
  college:        { label: '🎓 College',        backgrounds: ['IIT','IIM','BITS','IISc','ISB','NIT','Harvard','MIT','Stanford'], sectors: [] },
  digital_lending:{ label: '💳 Digital Lending', backgrounds: ['Moneyview','Incred','Oxyzo','Slice','Kreditbee','Fibe','Lendingkart','Navi','Onecard','Niyo','Kissht'], sectors: ['Fintech','Lending'] },
  payments:       { label: '📱 Payments',         backgrounds: ['PhonePe','Razorpay','PineLabs','BharatPe','Juspay','Zeta','Jupiter','Fi','Cred','PayTM'], sectors: ['Fintech','Payments'] },
  wealthtech:     { label: '📈 Wealthtech',       backgrounds: ['Zerodha','Groww','Upstox','Dhan','IndMoney','Scripbox','Jar','Smallcase','CoinDCX','Dezerv'], sectors: ['Wealthtech'] },
  insurtech:      { label: '🛡️ Insurtech',        backgrounds: ['Policybazaar','PB Fintech','Digit','Acko','InsuranceDekho','Turtlemint','Onsurity'], sectors: ['Insurtech'] },
  collections:    { label: '🔄 Collections',      backgrounds: ['Credgenics','Spocto','DPDZero','CredRezolv'], sectors: ['Collections'] },
  working_capital:{ label: '🏦 Working Capital',  backgrounds: ['Yubi','Mintifi','Progcap','Mintoak'], sectors: ['Working Capital'] },
  fintech_infra:  { label: '⚙️ Fintech Infra',    backgrounds: ['Perfios','Lentra','PayU','Setu','Signzy','Idfy','Zolve','NPCI','Finbox','Open'], sectors: ['Infrastructure','B2B'] },
  non_fintech:    { label: '🌐 Non-Fintech',       backgrounds: ['Flipkart','ICICI Bank','Swiggy','Amazon','Mckinsey','Bain','BCG'], sectors: [] },
  faang:          { label: '💻 Ex-FAANG',          backgrounds: ['Google','Meta','Amazon','Apple','Microsoft','Netflix','LinkedIn','Stripe'], sectors: [] },
  global:         { label: '🌍 Global Tech',       backgrounds: ['Google','Meta','Microsoft','Uber','Airbnb','OpenAI','Notion','Stripe','Stanford','MIT'], sectors: ['AI','SaaS'] },
}

export const FOUNDED_YEARS = ['2026', '2025', '2024', '2023', '2022']
export const STATUS_OPTIONS = ['New', 'Contacted', 'In Review', 'Pass', 'Invested']

export const STATUS_STYLES = {
  'New':       'bg-blue-50 text-blue-700 border-blue-200',
  'Contacted': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'In Review': 'bg-purple-50 text-purple-700 border-purple-200',
  'Pass':      'bg-red-50 text-red-600 border-red-200',
  'Invested':  'bg-green-50 text-green-700 border-green-200',
}

export const STATUS_TAB_COLORS = {
  'All':       { active: 'border-[#FF7102] text-[#FF7102] bg-[#FFEFE2]', inactive: 'border-transparent text-[#5A5650] hover:text-[#1A1815]' },
  'New':       { active: 'border-blue-400 text-blue-700 bg-blue-50',     inactive: 'border-transparent text-[#5A5650] hover:text-[#1A1815]' },
  'Contacted': { active: 'border-yellow-400 text-yellow-700 bg-yellow-50', inactive: 'border-transparent text-[#5A5650] hover:text-[#1A1815]' },
  'In Review': { active: 'border-purple-400 text-purple-700 bg-purple-50', inactive: 'border-transparent text-[#5A5650] hover:text-[#1A1815]' },
  'Pass':      { active: 'border-red-400 text-red-600 bg-red-50',         inactive: 'border-transparent text-[#5A5650] hover:text-[#1A1815]' },
  'Invested':  { active: 'border-green-400 text-green-700 bg-green-50',   inactive: 'border-transparent text-[#5A5650] hover:text-[#1A1815]' },
}

export const STAGE_CLASSES = {
  'seed':      'bg-[#FFF3E0] text-[#C85A1A] border-[#FFD0AB]',
  'pre-seed':  'bg-[#FEF3F2] text-[#9A4C00] border-[#FFD0AB]',
  'stealth':   'bg-[#F0EDE6] text-[#5A5650] border-[#E8E5DE]',
  'series a':  'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
  'series b':  'bg-[#F0F9FF] text-[#075985] border-[#BAE6FD]',
  'series c':  'bg-[#F5F3FF] text-[#5B21B6] border-[#DDD6FE]',
}
