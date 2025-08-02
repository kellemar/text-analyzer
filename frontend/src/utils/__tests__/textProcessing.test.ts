import { describe, it, expect } from 'vitest';
import { detectLanguages, extractNationalities, mapApiResponseToPRD } from '../textProcessing';

describe('textProcessing utilities', () => {
  describe('detectLanguages', () => {
    it('should detect English text', () => {
      const text = 'The quick brown fox jumps over the lazy dog. This is a test sentence with common English words.';
      const languages = detectLanguages(text);
      expect(languages).toContain('English');
    });

    it('should detect Spanish text', () => {
      const text = 'El gato está en la casa. Los niños juegan en el parque con sus amigos.';
      const languages = detectLanguages(text);
      expect(languages).toContain('Spanish');
    });

    it('should detect French text', () => {
      const text = 'Le chat est dans la maison. Les enfants jouent dans le parc avec leurs amis.';
      const languages = detectLanguages(text);
      expect(languages).toContain('French');
    });

    it('should default to English for undetectable text', () => {
      const text = '123 456 789';
      const languages = detectLanguages(text);
      expect(languages).toEqual(['English']);
    });

    it('should detect multiple languages in mixed text', () => {
      const text = 'Hello, this is English. Bonjour, ceci est français. Hola, esto es español.';
      const languages = detectLanguages(text);
      expect(languages.length).toBeGreaterThan(0);
      expect(languages).toContain('English');
    });
  });

  describe('extractNationalities', () => {
    it('should extract nationalities from country names', () => {
      const countries = ['United States', 'France', 'Japan'];
      const nationalities = extractNationalities(countries);
      expect(nationalities).toEqual(['American', 'French', 'Japanese']);
    });

    it('should handle variations of country names', () => {
      const countries = ['USA', 'UK', 'South Korea'];
      const nationalities = extractNationalities(countries);
      expect(nationalities).toContain('American');
      expect(nationalities).toContain('British');
      expect(nationalities).toContain('South Korean');
    });

    it('should handle empty array', () => {
      const nationalities = extractNationalities([]);
      expect(nationalities).toEqual([]);
    });

    it('should handle unknown countries gracefully', () => {
      const countries = ['Unknown Country', 'France'];
      const nationalities = extractNationalities(countries);
      expect(nationalities).toContain('French');
      expect(nationalities).not.toContain('Unknown Country');
    });

    it('should remove duplicates', () => {
      const countries = ['USA', 'United States', 'America'];
      const nationalities = extractNationalities(countries);
      expect(nationalities).toEqual(['American']);
    });
  });

  describe('mapApiResponseToPRD', () => {
    it('should map API response to PRD structure', () => {
      const apiResponse = {
        summary: 'This is a test summary',
        countries: ['France', 'Germany'],
        organizations: ['UN', 'WHO'],
        people: ['John Doe', 'Jane Smith']
      };
      
      const prdResponse = mapApiResponseToPRD(apiResponse, 'Sample English text');
      
      expect(prdResponse).toEqual({
        article_summary: 'This is a test summary',
        nationalities: ['French', 'German'],
        organizations: ['UN', 'WHO'],
        people: ['John Doe', 'Jane Smith'],
        languages: ['English']
      });
    });

    it('should detect language from provided text', () => {
      const apiResponse = {
        summary: 'Résumé en français',
        countries: ['France'],
        organizations: ['ONU'],
        people: ['Jean Dupont']
      };
      
      const frenchText = 'Ceci est un texte en français avec des mots communs comme le, la, les, et, ou, mais.';
      const prdResponse = mapApiResponseToPRD(apiResponse, frenchText);
      
      expect(prdResponse.languages).toContain('French');
    });

    it('should default to English when no text provided', () => {
      const apiResponse = {
        summary: 'Summary',
        countries: [],
        organizations: [],
        people: []
      };
      
      const prdResponse = mapApiResponseToPRD(apiResponse);
      
      expect(prdResponse.languages).toEqual(['English']);
    });
  });
});