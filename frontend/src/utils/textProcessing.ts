// Language detection patterns - basic implementation
const languagePatterns: Record<string, RegExp[]> = {
  english: [
    /\b(the|and|or|but|in|on|at|to|for|of|with|by|from|up|about|into|through|during|before|after)\b/gi,
    /\b(is|are|was|were|been|being|have|has|had|do|does|did)\b/gi
  ],
  spanish: [
    /\b(el|la|los|las|un|una|y|o|pero|en|de|con|para|por)\b/gi,
    /\b(es|son|está|están|fue|fueron|ser|estar|haber|hacer)\b/gi
  ],
  french: [
    /\b(le|la|les|un|une|et|ou|mais|dans|de|avec|pour|par)\b/gi,
    /\b(est|sont|était|étaient|être|avoir|faire)\b/gi
  ],
  german: [
    /\b(der|die|das|ein|eine|und|oder|aber|in|auf|mit|für|von)\b/gi,
    /\b(ist|sind|war|waren|sein|haben|werden)\b/gi
  ],
  chinese: [
    /[\u4e00-\u9fa5]/g // Chinese characters
  ],
  japanese: [
    /[\u3040-\u309f\u30a0-\u30ff]/g // Hiragana and Katakana
  ],
  arabic: [
    /[\u0600-\u06ff]/g // Arabic script
  ]
};

// Nationality patterns mapping countries to nationalities
const countryToNationality: Record<string, string> = {
  'united states': 'American',
  'usa': 'American',
  'america': 'American',
  'united kingdom': 'British',
  'uk': 'British',
  'britain': 'British',
  'england': 'English',
  'scotland': 'Scottish',
  'wales': 'Welsh',
  'france': 'French',
  'germany': 'German',
  'spain': 'Spanish',
  'italy': 'Italian',
  'canada': 'Canadian',
  'australia': 'Australian',
  'japan': 'Japanese',
  'china': 'Chinese',
  'india': 'Indian',
  'brazil': 'Brazilian',
  'mexico': 'Mexican',
  'russia': 'Russian',
  'south korea': 'South Korean',
  'korea': 'Korean',
  'netherlands': 'Dutch',
  'belgium': 'Belgian',
  'switzerland': 'Swiss',
  'sweden': 'Swedish',
  'norway': 'Norwegian',
  'denmark': 'Danish',
  'finland': 'Finnish',
  'poland': 'Polish',
  'austria': 'Austrian',
  'greece': 'Greek',
  'portugal': 'Portuguese',
  'ireland': 'Irish',
  'new zealand': 'New Zealander',
  'singapore': 'Singaporean',
  'malaysia': 'Malaysian',
  'thailand': 'Thai',
  'indonesia': 'Indonesian',
  'philippines': 'Filipino',
  'vietnam': 'Vietnamese',
  'turkey': 'Turkish',
  'egypt': 'Egyptian',
  'south africa': 'South African',
  'nigeria': 'Nigerian',
  'kenya': 'Kenyan',
  'israel': 'Israeli',
  'saudi arabia': 'Saudi',
  'uae': 'Emirati',
  'argentina': 'Argentinian',
  'chile': 'Chilean',
  'colombia': 'Colombian',
  'peru': 'Peruvian',
  'venezuela': 'Venezuelan',
  // Chinese country names
  '肯尼亚': 'Kenyan',
  '加拿大': 'Canadian', 
  '西班牙': 'Spanish',
  '韩国': 'South Korean',
  '阿根廷': 'Argentinian',
  '埃及': 'Egyptian',
  '瑞典': 'Swedish',
  '芬兰': 'Finnish',
  '泰国': 'Thai',
  '印度尼西亚': 'Indonesian',
  '巴西': 'Brazilian',
  '美国': 'American',
  '中国': 'Chinese',
  '日本': 'Japanese',
  '法国': 'French',
  '德国': 'German',
  '意大利': 'Italian',
  '英国': 'British',
  '澳大利亚': 'Australian',
  '印度': 'Indian',
  '俄国': 'Russian',
  '俄罗斯': 'Russian'
};

export function detectLanguages(text: string): string[] {
  const detectedLanguages: string[] = [];
  const textLower = text.toLowerCase();
  
  // Count matches for each language
  const languageScores: Record<string, number> = {};
  
  for (const [language, patterns] of Object.entries(languagePatterns)) {
    let score = 0;
    for (const pattern of patterns) {
      const matches = textLower.match(pattern);
      if (matches) {
        score += matches.length;
      }
    }
    if (score > 0) {
      languageScores[language] = score;
    }
  }
  
  // Sort languages by score and return those with significant matches
  const sortedLanguages = Object.entries(languageScores)
    .sort(([, a], [, b]) => b - a)
    .filter(([, score]) => score > 5); // Threshold for significance
  
  // Return top languages detected
  for (const [language] of sortedLanguages.slice(0, 3)) {
    detectedLanguages.push(language.charAt(0).toUpperCase() + language.slice(1));
  }
  
  // Default to English if no language detected
  if (detectedLanguages.length === 0) {
    detectedLanguages.push('English');
  }
  
  return detectedLanguages;
}

export function extractNationalities(countries: string[]): string[] {
  // Ensure countries is an array
  if (!Array.isArray(countries)) {
    return [];
  }
  
  const nationalities = new Set<string>();
  
  for (const country of countries) {
    // Ensure country is a string
    if (typeof country !== 'string') continue;
    
    const countryTrimmed = country.trim();
    const countryLower = countryTrimmed.toLowerCase();
    
    // Direct mapping (try both original and lowercase)
    if (countryToNationality[countryTrimmed]) {
      nationalities.add(countryToNationality[countryTrimmed]);
    } else if (countryToNationality[countryLower]) {
      nationalities.add(countryToNationality[countryLower]);
    } else {
      // Try to find partial matches
      for (const [key, nationality] of Object.entries(countryToNationality)) {
        if (countryLower.includes(key) || key.includes(countryLower) ||
            countryTrimmed.includes(key) || key.includes(countryTrimmed)) {
          nationalities.add(nationality);
          break;
        }
      }
    }
  }
  
  return Array.from(nationalities);
}

// Map API response to PRD structure
export interface PRDAnalysisResponse {
  article_summary: string;
  nationalities: string[];
  organizations: string[];
  people: string[];
  languages: string[];
}

export function mapApiResponseToPRD(
  apiResponse: {
    summary?: string;
    article_summary?: string | string[];
    countries?: string[] | any;
    nationalities?: string[] | any;
    organizations?: string[] | any;
    people?: string[] | any;
    language?: string[] | any;
    languages?: string[] | any;
  },
  originalText?: string
): PRDAnalysisResponse {
  // Handle article_summary (could be string or array)
  let summary = '';
  if (apiResponse.article_summary) {
    if (Array.isArray(apiResponse.article_summary)) {
      summary = apiResponse.article_summary.join(' ');
    } else {
      summary = apiResponse.article_summary;
    }
  } else if (apiResponse.summary) {
    summary = apiResponse.summary;
  }

  // Handle countries vs nationalities
  let countries: string[] = [];
  if (apiResponse.countries && Array.isArray(apiResponse.countries)) {
    countries = apiResponse.countries;
  } else if (apiResponse.nationalities && Array.isArray(apiResponse.nationalities)) {
    // If we get nationalities that are actually countries (especially in Chinese), treat them as countries
    countries = apiResponse.nationalities;
  }

  // Ensure other arrays are actually arrays and provide defaults
  const organizations = Array.isArray(apiResponse.organizations) ? apiResponse.organizations : [];
  const people = Array.isArray(apiResponse.people) ? apiResponse.people : [];
  
  // Handle languages (could be 'language' or 'languages')
  let languages: string[] = [];
  if (apiResponse.languages && Array.isArray(apiResponse.languages)) {
    languages = apiResponse.languages;
  } else if (apiResponse.language && Array.isArray(apiResponse.language)) {
    languages = apiResponse.language;
  } else if (originalText) {
    languages = detectLanguages(originalText);
  } else {
    languages = ['English']; // Default fallback
  }
  
  return {
    article_summary: summary,
    nationalities: extractNationalities(countries),
    organizations: organizations,
    people: people,
    languages: languages
  };
}