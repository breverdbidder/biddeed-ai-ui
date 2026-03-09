// src/lib/lien-search.ts
// CP-14: AcclaimWeb Lien Search — FREE automated search
// PropertyOnion charges $50/property. We do it for FREE.
//
// Two-tier approach:
//   Tier 1 (V1): Smart deep-link to AcclaimWeb pre-populated with owner/case
//   Tier 2 (V2): Supabase Edge Function scrapes and returns structured JSON
//
// AcclaimWeb URL structure:
//   Name search: vaclmweb1.brevardclerk.us/AcclaimWeb/search/SearchTypeName
//   Case search: vaclmweb1.brevardclerk.us/AcclaimWeb/search/SearchTypeCaseNumber
//   Doc search:  vaclmweb1.brevardclerk.us/AcclaimWeb/search/SearchTypeDocType

export interface LienRecord {
  docType: string;       // MORTGAGE, LIEN, JUDGMENT, LIS PENDENS, etc.
  recordDate: string;    // Date recorded
  grantorName: string;   // Who granted (usually bank/lender)
  granteeName: string;   // Who received (usually borrower/owner)
  consideration: string; // Dollar amount
  bookPage: string;      // Official record reference
  clerkFileNum: string;  // Clerk file number
  caseNumber?: string;   // Associated case number
}

export interface LienSearchResult {
  status: 'success' | 'error' | 'pending';
  ownerName: string;
  records: LienRecord[];
  summary: {
    totalLiens: number;
    mortgages: number;
    judgments: number;
    lispendens: number;
    satisfactions: number;
    otherLiens: number;
    estimatedDebt: number;
  };
  riskFlags: string[];
  searchUrl: string;  // Direct link to AcclaimWeb results
}

// ── Tier 1: Generate deep-link URL to AcclaimWeb ──
export function getAcclaimWebUrl(ownerName: string, searchType: 'name' | 'case' = 'name'): string {
  if (searchType === 'case') {
    return `https://vaclmweb1.brevardclerk.us/AcclaimWeb/search/SearchTypeCaseNumber`;
  }
  return `https://vaclmweb1.brevardclerk.us/AcclaimWeb/search/SearchTypeName`;
}

// ── Tier 2: Call Supabase Edge Function for automated search ──
export async function searchLiens(
  ownerName: string,
  caseNumber?: string,
  supabaseUrl?: string,
  anonKey?: string,
): Promise<LienSearchResult> {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    const res = await fetch(`${url}/functions/v1/lien-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({ ownerName, caseNumber }),
    });

    if (!res.ok) {
      // Fallback to deep-link mode
      return {
        status: 'pending',
        ownerName,
        records: [],
        summary: { totalLiens: 0, mortgages: 0, judgments: 0, lispendens: 0, satisfactions: 0, otherLiens: 0, estimatedDebt: 0 },
        riskFlags: [],
        searchUrl: getAcclaimWebUrl(ownerName),
      };
    }

    return await res.json();
  } catch {
    // Edge function not deployed yet — return deep-link mode
    return {
      status: 'pending',
      ownerName,
      records: [],
      summary: { totalLiens: 0, mortgages: 0, judgments: 0, lispendens: 0, satisfactions: 0, otherLiens: 0, estimatedDebt: 0 },
      riskFlags: [],
      searchUrl: getAcclaimWebUrl(ownerName),
    };
  }
}

// ── Lien Priority Analysis (runs client-side on any results) ──
export function analyzeLienPriority(records: LienRecord[]): {
  analysis: string;
  seniorLiens: LienRecord[];
  juniorLiens: LienRecord[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
} {
  const mortgages = records.filter(r =>
    r.docType.includes('MORTGAGE') || r.docType.includes('MTG')
  );
  const liens = records.filter(r =>
    r.docType.includes('LIEN') || r.docType.includes('JUDGMENT')
  );
  const lispendens = records.filter(r =>
    r.docType.includes('LIS PENDENS') || r.docType.includes('LP')
  );
  const satisfactions = records.filter(r =>
    r.docType.includes('SATISFACTION') || r.docType.includes('SAT')
  );

  // Senior liens = first mortgage (earliest recorded)
  const sortedMtg = mortgages.sort((a, b) =>
    new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime()
  );
  const seniorLiens = sortedMtg.slice(0, 1);
  const juniorLiens = [...sortedMtg.slice(1), ...liens];

  // Risk assessment
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  const riskReasons: string[] = [];

  if (mortgages.length > 2) {
    riskLevel = 'HIGH';
    riskReasons.push(`${mortgages.length} mortgages recorded — possible overleveraged`);
  }
  if (liens.length > 0) {
    riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : 'HIGH';
    riskReasons.push(`${liens.length} liens/judgments — may survive foreclosure`);
  }
  if (lispendens.length > 1) {
    riskLevel = 'CRITICAL';
    riskReasons.push(`${lispendens.length} lis pendens — multiple legal actions`);
  }
  if (satisfactions.length < mortgages.length - 1) {
    riskReasons.push(`Unsatisfied mortgages detected — verify payoff status`);
  }

  const analysis = riskReasons.length > 0
    ? riskReasons.join('. ')
    : 'No significant lien risks detected. Standard first mortgage only.';

  return { analysis, seniorLiens, juniorLiens, riskLevel };
}
