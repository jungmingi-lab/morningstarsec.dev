export const profile = {
  name: '정민기',
  romanizedName: 'Minki Jung',
  handle: 'luxferre',
  title: 'Cybersecurity Student & Security Researcher',
  email: 'minki@morningstarsec.dev',
  github: 'https://github.com/jungmingi-lab',
  domain: 'https://morningstarsec.dev',
  university: 'Daejeon University',
  department: 'AISW (Artificial Intelligence Software) Department',
}

export const interests = [
  'Web Security',
  'Vulnerability Research',
  'CTF',
  'Digital Forensics',
  'AI Security',
]

export const skills = [
  'React',
  'TypeScript',
  'Python',
  'Linux',
  'Burp Suite',
  'Nmap',
  'Wireshark',
  'Ghidra',
  'Forensics',
  'Threat Modeling',
  'Secure Coding',
  'Machine Learning',
]

export const projects = [
  {
    name: 'MorningStar',
    eyebrow: 'AI Platform',
    description:
      'Information ecosystem health analysis AI platform for evaluating trust, coordination signals, and public-interest risk in online information flows.',
    stack: ['AI Analysis', 'Data Pipeline', 'Security Research'],
    status: 'Research platform',
  },
  {
    name: '주차왕 (Parking King)',
    eyebrow: 'Service Platform',
    description:
      'Parking sharing and reservation service designed around real-time availability, host listings, and practical urban mobility workflows.',
    stack: ['Reservation UX', 'Maps', 'Web App'],
    status: 'Product prototype',
  },
  {
    name: '식탁 위의 처방',
    eyebrow: 'Personalization AI',
    description:
      'AI-powered personalized meal recommendation service that maps health goals, dietary context, and meal choices into daily recommendations.',
    stack: ['Recommendation AI', 'Health Data', 'Mobile UX'],
    status: 'Applied AI project',
  },
  {
    name: 'IoT Hackathon',
    eyebrow: 'Security Challenge',
    description:
      'Time-series prediction and security challenge project combining sensor data analysis, anomaly awareness, and practical IoT defense thinking.',
    stack: ['IoT', 'Time Series', 'Security'],
    status: 'Hackathon project',
  },
]

export const contactLinks = [
  {
    label: 'Email',
    value: profile.email,
    href: `mailto:${profile.email}`,
    active: true,
  },
  {
    label: 'GitHub',
    value: 'github.com/jungmingi-lab',
    href: profile.github,
    active: true,
  },
  {
    label: 'Blog',
    value: 'Coming soon',
    href: undefined,
    active: false,
  },
  {
    label: 'LinkedIn',
    value: 'Coming soon',
    href: undefined,
    active: false,
  },
  {
    label: 'X (Twitter)',
    value: 'Coming soon',
    href: undefined,
    active: false,
  },
]
