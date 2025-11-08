/**
 * Advanced Content Analysis using NLP Algorithms
 * 
 * ALGORITHMS USED:
 * 1. TF-IDF (Term Frequency-Inverse Document Frequency) - Keyword extraction
 * 2. Cosine Similarity - Semantic coherence measurement
 * 3. VADER Sentiment Analysis - Emotion/opinion detection
 * 4. Named Entity Recognition (NER) - Entity extraction
 * 5. Jaccard Similarity - Text overlap measurement
 */

export interface ContentMetrics {
  coherenceScore: number; // 0-100, semantic consistency between sentences
  keywordRelevance: number; // 0-100, topic relevance via TF-IDF
  sentimentScore: number; // -100 to 100, VADER-like sentiment
  sentimentLabel: string; // 'positive', 'neutral', 'negative'
  entityCount: number; // Number of named entities detected
  topKeywords: string[]; // Top 5 keywords by TF-IDF score
  topEntities: string[]; // Top entities (names, places, organizations)
  vocabularyRichness: number; // 0-100, unique words / total words
  readabilityScore: number; // 0-100, based on sentence complexity
}

export class ContentAnalyzer {
  private documentHistory: string[] = [];
  private vocabularyIDF: Map<string, number> = new Map();
  private readonly MAX_HISTORY = 20; // Limit memory usage
  
  /**
   * VADER Sentiment Lexicon (Valence Aware Dictionary and sEntiment Reasoner)
   * Assigns sentiment scores to words: positive (1-5), negative (-1 to -5)
   */
  private readonly sentimentLexicon = new Map<string, number>([
    // Strong positive (5)
    ['amazing', 5], ['excellent', 5], ['outstanding', 5], ['perfect', 5], 
    ['brilliant', 5], ['exceptional', 5], ['superb', 5], ['magnificent', 5],
    
    // Positive (3-4)
    ['good', 3], ['great', 4], ['wonderful', 4], ['fantastic', 4], ['awesome', 4],
    ['love', 3], ['best', 4], ['beautiful', 3], ['happy', 3], ['excited', 3],
    ['confident', 4], ['success', 3], ['win', 3], ['nice', 3], ['enjoy', 3],
    ['pleased', 3], ['delighted', 4], ['proud', 3], ['thrilled', 4],
    
    // Strong negative (-5 to -4)
    ['terrible', -4], ['awful', -4], ['horrible', -4], ['worst', -4],
    ['disgusting', -5], ['hate', -4], ['disaster', -5], ['nightmare', -5],
    
    // Negative (-3 to -2)
    ['bad', -3], ['fail', -3], ['problem', -2], ['issue', -2], ['difficult', -2],
    ['sad', -3], ['angry', -3], ['frustrated', -2], ['confused', -2], ['weak', -2],
    ['poor', -2], ['wrong', -2], ['mistake', -2], ['concerned', -2],
    
    // Modifiers (amplifiers and diminishers)
    ['very', 1.5], ['really', 1.5], ['extremely', 2], ['absolutely', 2],
    ['incredibly', 2], ['totally', 1.8], ['completely', 1.8],
    ['not', -1], ['never', -1.5], ['no', -1], ['hardly', -0.8], ['barely', -0.8],
    
    // Context modifiers
    ['but', 0.5], ['however', 0.5], ['although', 0.3],

    // Hindi - Strong positive (5)
    ['अद्भुत', 5], ['उत्कृष्ट', 5], ['बेहतरीन', 5], ['सर्वोत्तम', 5],
    ['प्रतिभाशाली', 5], ['असाधारण', 5], ['शानदार', 5], ['भव्य', 5],

    // Hindi - Positive (3-4)
    ['अच्छा', 3], ['बड़ा', 4], ['अद्भुत', 4], ['शानदार', 4], ['बहुत बढ़िया', 4],
    ['प्यार', 3], ['सर्वश्रेष्ठ', 4], ['सुंदर', 3], ['खुश', 3], ['उत्तेजित', 3],
    ['आत्मविश्वासी', 4], ['सफलता', 3], ['जीत', 3], ['अच्छा', 3], ['आनंद', 3],
    ['संतुष्ट', 3], ['प्रसन्न', 4], ['गर्वित', 3], ['उत्साहित', 4],

    // Hindi - Strong negative (-5 to -4)
    ['भयानक', -4], ['घृणित', -4], ['भयंकर', -4], ['सबसे खराब', -4],
    ['घिनौना', -5], ['नफरत', -4], ['आपदा', -5], ['दुःस्वप्न', -5],

    // Hindi - Negative (-3 to -2)
    ['खराब', -3], ['विफल', -3], ['समस्या', -2], ['मुद्दा', -2], ['कठिन', -2],
    ['दुखी', -3], ['गुस्सा', -3], ['परेशान', -2], ['भ्रमित', -2], ['कमजोर', -2],
    ['गरीब', -2], ['गलत', -2], ['गलती', -2], ['चिंतित', -2],

    // Hindi - Modifiers
    ['बहुत', 1.5], ['सच्चाई से', 1.5], ['अत्यंत', 2], ['पूरी तरह से', 2],
    ['अद्भुत रूप से', 2], ['पूरी तरह', 1.8], ['संपूर्ण रूप से', 1.8],
    ['नहीं', -1], ['कभी नहीं', -1.5], ['कोई नहीं', -1], ['कठिनाई से', -0.8], ['मुश्किल से', -0.8],

    // Telugu - Strong positive (5)
    ['అద్భుతమైన', 5], ['ఉత్తమమైన', 5], ['అంతులేని', 5], ['పరిపూర్ణమైన', 5],
    ['ప్రతిభావంతమైన', 5], ['అసాధారణమైన', 5], ['శానితమైన', 5], ['భవ్యమైన', 5],

    // Telugu - Positive (3-4)
    ['మంచి', 3], ['పెద్ద', 4], ['అద్భుతమైన', 4], ['శానితమైన', 4], ['చాలా మంచి', 4],
    ['ప్రేమ', 3], ['ఉత్తమమైన', 4], ['సుందరమైన', 3], ['సంతోషకరమైన', 3], ['ఉత్సాహకరమైన', 3],
    ['ఆత్మవిశ్వాసం', 4], ['విజయం', 3], ['గెలుపు', 3], ['మంచి', 3], ['ఆనందం', 3],
    ['సంతృప్తి', 3], ['ఆనందకరమైన', 4], ['గర్వపడే', 3], ['ఉత్సాహభరితమైన', 4],

    // Telugu - Strong negative (-5 to -4)
    ['భయంకరమైన', -4], ['ఘృణించే', -4], ['భయంకరమైన', -4], ['అత్యంత చెడు', -4],
    ['ఘృణించే', -5], ['ద్వేషం', -4], ['విపత్తు', -5], ['దురదృష్టం', -5],

    // Telugu - Negative (-3 to -2)
    ['చెడు', -3], ['విఫలం', -3], ['సమస్య', -2], ['సమస్య', -2], ['కష్టమైన', -2],
    ['దుఃఖకరమైన', -3], ['కోపం', -3], ['చింతించే', -2], ['గందరగోళం', -2], ['బలహీనమైన', -2],
    ['పేద', -2], ['తప్పు', -2], ['తప్పు', -2], ['చింతించే', -2],

    // Telugu - Modifiers
    ['చాలా', 1.5], ['నిజంగా', 1.5], ['అత్యంత', 2], ['పూర్తిగా', 2],
    ['అద్భుతంగా', 2], ['పూర్తిగా', 1.8], ['సంపూర్ణంగా', 1.8],
    ['లేదు', -1], ['ఎప్పుడూ లేదు', -1.5], ['ఏదీ లేదు', -1], ['కష్టంగా', -0.8], ['కొంచెం', -0.8],
  ]);
  
  /**
   * Stopwords - Common words to filter out from analysis
   * Multi-language support: English, Hindi, Telugu
   */
  private readonly stopwords = new Set([
    // English - Articles & Determiners
    'the', 'a', 'an', 'this', 'that', 'these', 'those',
    // English - Conjunctions
    'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while',
    // English - Prepositions
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    // English - Pronouns
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
    // English - Verbs (auxiliary)
    'is', 'am', 'are', 'was', 'were', 'been', 'be', 'being',
    'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must',
    // English - Question words
    'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how',
    // English - Quantifiers
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'just', 'also', 'much', 'many',

    // Hindi - Articles & Determiners (का, की, के, etc.)
    'का', 'की', 'के', 'को', 'से', 'में', 'पर', 'तक', 'बाद', 'पहले',
    'ऊपर', 'नीचे', 'भीतर', 'बाहर', 'साथ', 'के साथ', 'द्वारा', 'से',
    // Hindi - Pronouns
    'मैं', 'तू', 'वह', 'वह', 'यह', 'हम', 'वे', 'मुझे', 'उसे', 'उसे',
    'हमें', 'उन्हें', 'मेरा', 'तेरा', 'उसका', 'हमारा', 'उनका',
    // Hindi - Conjunctions
    'और', 'या', 'लेकिन', 'अगर', 'क्योंकि', 'जब तक', 'जबकि', 'कि',
    // Hindi - Question words
    'क्या', 'कौन', 'कब', 'कहाँ', 'क्यों', 'कैसे', 'कितना', 'कौन सा',
    // Hindi - Common verbs
    'है', 'हैं', 'था', 'थे', 'हो', 'कर', 'करना', 'जाना', 'आना',
    // Hindi - Quantifiers
    'सब', 'हर', 'दोनों', 'कुछ', 'अधिक', 'सबसे', 'अन्य', 'कोई',
    'ऐसा', 'नहीं', 'न', 'सिर्फ', 'अपना', 'वही', 'इसलिए', 'बहुत',

    // Telugu - Articles & Determiners
    'ది', 'అ', 'ఇ', 'ఆ', 'ఈ', 'ఎ', 'ఏ', 'ఓ', 'ఒ',
    // Telugu - Pronouns
    'నేను', 'నువ్వు', 'వాడు', 'ఆమె', 'ఇది', 'మేము', 'వారు', 'నాకు', 'అతనికి', 'ఆమెకు',
    'మాకు', 'వారికి', 'నా', 'నీ', 'అతని', 'మా', 'వారి',
    // Telugu - Conjunctions
    'మరియు', 'లేదా', 'కానీ', 'ఒకవేళ', 'ఎందుకంటే', 'వరకు', 'అయితే',
    // Telugu - Prepositions
    'లో', 'పై', 'వద్ద', 'కు', 'కోసం', 'తో', 'ద్వారా', 'నుండి', 'గురించి',
    'లోపల', 'వెలుపల', 'తో', 'ముందు', 'తర్వాత', 'పైన', 'కింద',
    // Telugu - Question words
    'ఏమి', 'ఎవరు', 'ఎప్పుడు', 'ఎక్కడ', 'ఎందుకు', 'ఎలా', 'ఎంత', 'ఏది',
    // Telugu - Common verbs
    'ఉన్నాడు', 'ఉన్నారు', 'ఉండేవాడు', 'ఉండేవారు', 'ఉండు', 'చేయు', 'వెళ్ళు', 'రా',
    // Telugu - Quantifiers
    'అన్ని', 'ప్రతి', 'రెండు', 'కొన్ని', 'మరిన్ని', 'ఎక్కువ', 'ఇతర', 'కొంత',
    'అలాంటి', 'లేదు', 'కాదు', 'మాత్రమే', 'స్వంత', 'అదే', 'కాబట్టి', 'చాలా',
  ]);

  /**
   * Main analysis function - processes transcript and returns comprehensive metrics
   * @param transcript - The text to analyze
   * @param topic - Optional topic for relevance scoring
   * @returns ContentMetrics object with all analysis results
   */
  analyzeContent(transcript: string, topic?: string): ContentMetrics {
    // Validate input
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 10) {
      return this.getDefaultMetrics();
    }

    try {
      const cleanTranscript = transcript.trim();

      // Update document history for IDF calculation
      this.updateDocumentHistory(cleanTranscript);

      // Tokenize and clean text
      const tokens = this.tokenize(cleanTranscript);
      
      if (tokens.length === 0) {
        return this.getDefaultMetrics();
      }

      // 1. COHERENCE: Cosine Similarity between consecutive sentences
      const coherence = this.calculateCoherence(cleanTranscript);
      
      // 2. TF-IDF: Extract keywords and calculate relevance
      const tfIdfScores = this.calculateTFIDF(tokens);
      const topKeywords = this.extractTopKeywords(tfIdfScores, 5);
      
      // 3. KEYWORD RELEVANCE: Compare to topic or use TF-IDF density
      const keywordRelevance = topic 
        ? this.calculateTopicRelevance(tokens, topic)
        : this.calculateOverallRelevance(tfIdfScores, tokens.length);
      
      // 4. SENTIMENT: VADER-like analysis with modifiers
      const sentiment = this.analyzeSentiment(cleanTranscript);
      
      // 5. NER: Extract named entities (proper nouns)
      const entities = this.extractEntities(cleanTranscript);
      
      // 6. VOCABULARY RICHNESS: Unique word ratio
      const vocabularyRichness = this.calculateVocabularyRichness(tokens);
      
      // 7. READABILITY: Based on sentence structure
      const readabilityScore = this.calculateReadability(cleanTranscript);

      return {
        coherenceScore: Math.round(Math.max(0, Math.min(100, coherence))),
        keywordRelevance: Math.round(Math.max(0, Math.min(100, keywordRelevance))),
        sentimentScore: Math.round(Math.max(-100, Math.min(100, sentiment.score))),
        sentimentLabel: sentiment.label,
        entityCount: entities.length,
        topKeywords,
        topEntities: entities.slice(0, 5),
        vocabularyRichness: Math.round(Math.max(0, Math.min(100, vocabularyRichness))),
        readabilityScore: Math.round(Math.max(0, Math.min(100, readabilityScore))),
      };
    } catch (error) {
      console.error('Content analysis error:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * ALGORITHM 1: Tokenization
   * Converts text into normalized, meaningful tokens
   * Steps: lowercase -> remove punctuation -> split -> filter stopwords
   */
  private tokenize(text: string): string[] {
    try {
      return text
        .toLowerCase()
        .replace(/[^\w\s'-]/g, ' ') // Keep hyphens and apostrophes
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(word => word.trim())
        .filter(word => word.length > 2 && !this.stopwords.has(word))
        .filter(word => !/^\d+$/.test(word)); // Remove pure numbers
    } catch (error) {
      console.error('Tokenization error:', error);
      return [];
    }
  }

  /**
   * ALGORITHM 2: Coherence via Cosine Similarity
   * Measures semantic consistency between consecutive sentences
   * Formula: similarity = (A ∩ B) / (|A| × |B|)^0.5
   */
  private calculateCoherence(text: string): number {
    try {
      // Split into sentences
      const sentences = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10);
      
      if (sentences.length < 2) {
        return sentences.length === 1 ? 70 : 25; // Single sentence = decent coherence
      }
      
      let totalSimilarity = 0;
      let comparisons = 0;
      
      // Compare each sentence with the next
      for (let i = 0; i < sentences.length - 1; i++) {
        const tokens1 = this.tokenize(sentences[i]);
        const tokens2 = this.tokenize(sentences[i + 1]);
        
        if (tokens1.length > 0 && tokens2.length > 0) {
          const similarity = this.cosineSimilarity(tokens1, tokens2);
          totalSimilarity += similarity;
          comparisons++;
        }
      }
      
      if (comparisons === 0) return 40;
      
      // Average similarity, scaled to 0-100
      const avgSimilarity = totalSimilarity / comparisons;
      
      // Apply non-linear scaling for better UX
      // Low similarity (0-0.2) → 25-50
      // Medium similarity (0.2-0.5) → 50-75
      // High similarity (0.5-1.0) → 75-95
      if (avgSimilarity < 0.2) {
        return 25 + (avgSimilarity / 0.2) * 25;
      } else if (avgSimilarity < 0.5) {
        return 50 + ((avgSimilarity - 0.2) / 0.3) * 25;
      } else {
        return 75 + ((avgSimilarity - 0.5) / 0.5) * 20;
      }
    } catch (error) {
      console.error('Coherence calculation error:', error);
      return 40;
    }
  }

  /**
   * Cosine Similarity calculation between two token sets
   * Measures word overlap adjusted for set sizes
   */
  private cosineSimilarity(tokens1: string[], tokens2: string[]): number {
    try {
      const set1 = new Set(tokens1);
      const set2 = new Set(tokens2);
      
      if (set1.size === 0 || set2.size === 0) return 0;
      
      // Count intersection
      const intersection = [...set1].filter(token => set2.has(token)).length;
      
      // Calculate magnitude
      const magnitude = Math.sqrt(set1.size * set2.size);
      
      return intersection / magnitude;
    } catch (error) {
      console.error('Cosine similarity error:', error);
      return 0;
    }
  }

  /**
   * ALGORITHM 3: TF-IDF (Term Frequency - Inverse Document Frequency)
   * Identifies important keywords by balancing frequency and rarity
   * TF-IDF = (term_count / total_terms) × log(total_docs / docs_with_term)
   */
  private calculateTFIDF(tokens: string[]): Map<string, number> {
    const tfIdf = new Map<string, number>();
    
    try {
      if (tokens.length === 0) return tfIdf;
      
      // Calculate Term Frequency (TF)
      const termFreq = new Map<string, number>();
      tokens.forEach(token => {
        termFreq.set(token, (termFreq.get(token) || 0) + 1);
      });
      
      // Calculate TF-IDF for each term
      termFreq.forEach((count, term) => {
        const tf = count / tokens.length;
        const idf = this.vocabularyIDF.get(term) || 1;
        tfIdf.set(term, tf * idf);
      });
      
    } catch (error) {
      console.error('TF-IDF calculation error:', error);
    }
    
    return tfIdf;
  }

  /**
   * Update IDF (Inverse Document Frequency) from document history
   * IDF = log(total_documents / documents_containing_term)
   * Higher IDF = rarer, more distinctive term
   */
  private updateIDF(): void {
    try {
      const docCount = this.documentHistory.length;
      if (docCount === 0) return;
      
      // Count how many documents contain each term
      const termDocCount = new Map<string, number>();
      
      this.documentHistory.forEach(doc => {
        const uniqueTerms = new Set(this.tokenize(doc));
        uniqueTerms.forEach(term => {
          termDocCount.set(term, (termDocCount.get(term) || 0) + 1);
        });
      });
      
      // Calculate IDF for each term
      termDocCount.forEach((count, term) => {
        const idf = Math.log((docCount + 1) / (count + 1)) + 1; // +1 for smoothing
        this.vocabularyIDF.set(term, idf);
      });
    } catch (error) {
      console.error('IDF update error:', error);
    }
  }

  /**
   * Extract top N keywords by TF-IDF score
   */
  private extractTopKeywords(tfIdfScores: Map<string, number>, topN: number): string[] {
    try {
      return Array.from(tfIdfScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([word]) => word);
    } catch (error) {
      console.error('Keyword extraction error:', error);
      return [];
    }
  }

  /**
   * Calculate overall keyword relevance based on TF-IDF density
   */
  private calculateOverallRelevance(tfIdfScores: Map<string, number>, totalTokens: number): number {
    try {
      if (tfIdfScores.size === 0 || totalTokens === 0) return 30;
      
      // Sum of top TF-IDF scores
      const topScores = Array.from(tfIdfScores.values())
        .sort((a, b) => b - a)
        .slice(0, 10);
      
      const avgTopScore = topScores.reduce((a, b) => a + b, 0) / topScores.length;
      
      // Normalize to 0-100 range
      return Math.min(100, avgTopScore * 50 + tfIdfScores.size * 2);
    } catch (error) {
      console.error('Relevance calculation error:', error);
      return 40;
    }
  }

  /**
   * Calculate relevance to a specific topic
   * Uses Jaccard similarity: intersection / union
   */
  private calculateTopicRelevance(tokens: string[], topic: string): number {
    try {
      const topicTokens = new Set(this.tokenize(topic));
      
      if (topicTokens.size === 0) return 50;
      
      const transcriptTokens = new Set(tokens);
      
      // Jaccard Similarity
      const intersection = [...topicTokens].filter(t => transcriptTokens.has(t)).length;
      const union = new Set([...topicTokens, ...transcriptTokens]).size;
      
      if (union === 0) return 0;
      
      const jaccardSim = intersection / union;
      
      // Also check partial matches (substrings)
      let partialMatches = 0;
      topicTokens.forEach(topicToken => {
        if (tokens.some(token => token.includes(topicToken) || topicToken.includes(token))) {
          partialMatches++;
        }
      });
      
      const partialScore = partialMatches / topicTokens.size;
      
      // Combine both scores
      return ((jaccardSim * 0.7 + partialScore * 0.3) * 100);
    } catch (error) {
      console.error('Topic relevance error:', error);
      return 40;
    }
  }

  /**
   * ALGORITHM 4: VADER Sentiment Analysis
   * Valence Aware Dictionary for sEntiment Reasoning
   * Handles modifiers, negations, and context
   */
  private analyzeSentiment(text: string): { score: number; label: string } {
    try {
      const words = text.toLowerCase().split(/\s+/);
      let score = 0;
      let modifier = 1;
      let negationWindow = 0;
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i].replace(/[^\w]/g, '');
        const sentimentValue = this.sentimentLexicon.get(word);
        
        if (sentimentValue !== undefined) {
          // Check if it's a modifier or sentiment word
          if (Math.abs(sentimentValue) < 2) {
            // It's a modifier (very, extremely, not, etc.)
            modifier = sentimentValue;
            
            // Handle negation
            if (sentimentValue < 0) {
              negationWindow = 3; // Negate next 3 words
            }
          } else {
            // It's a sentiment word
            let adjustedValue = sentimentValue * modifier;
            
            // Apply negation if in negation window
            if (negationWindow > 0) {
              adjustedValue *= -0.75;
              negationWindow--;
            }
            
            score += adjustedValue;
            modifier = 1; // Reset modifier
          }
        } else if (negationWindow > 0) {
          negationWindow--;
        }
      }
      
      // Normalize score to -100 to 100 range
      const normalizedScore = Math.max(-100, Math.min(100, score * 3));
      
      // Classify sentiment
      let label = 'neutral';
      if (normalizedScore > 15) label = 'positive';
      else if (normalizedScore < -15) label = 'negative';
      
      return { score: normalizedScore, label };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return { score: 0, label: 'neutral' };
    }
  }

  /**
   * ALGORITHM 5: Named Entity Recognition (NER)
   * Pattern-based extraction of proper nouns (names, places, organizations)
   * Looks for capitalized word sequences
   */
  private extractEntities(text: string): string[] {
    try {
      const entities = new Set<string>();
      
      // Pattern 1: Capitalized sequences (2+ words)
      const multiWordPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
      const multiWordMatches = text.match(multiWordPattern);
      if (multiWordMatches) {
        multiWordMatches.forEach(entity => entities.add(entity));
      }
      
      // Pattern 2: Single capitalized words (not sentence start)
      const sentences = text.split(/[.!?]+/);
      sentences.forEach(sentence => {
        const words = sentence.trim().split(/\s+/);
        // Skip first word (might be sentence start)
        for (let i = 1; i < words.length; i++) {
          const word = words[i].replace(/[^\w]/g, '');
          if (/^[A-Z][a-z]{2,}$/.test(word) && !this.isCommonWord(word)) {
            entities.add(word);
          }
        }
      });
      
      return Array.from(entities)
        .filter(e => e.length > 2)
        .sort();
    } catch (error) {
      console.error('Entity extraction error:', error);
      return [];
    }
  }

  /**
   * Check if a word is too common to be an entity
   */
  private isCommonWord(word: string): boolean {
    const common = ['The', 'This', 'That', 'These', 'Those', 'Then', 'There', 
                    'When', 'Where', 'Why', 'How', 'What', 'Which', 'Who'];
    return common.includes(word);
  }

  /**
   * Calculate vocabulary richness (lexical diversity)
   * Measures unique words / total words ratio
   */
  private calculateVocabularyRichness(tokens: string[]): number {
    try {
      if (tokens.length === 0) return 0;
      
      const uniqueTokens = new Set(tokens).size;
      const richness = (uniqueTokens / tokens.length) * 100;
      
      // Apply logarithmic scaling for better distribution
      return Math.min(100, richness * 1.5);
    } catch (error) {
      console.error('Vocabulary richness error:', error);
      return 40;
    }
  }

  /**
   * Calculate readability score based on sentence complexity
   * Considers average sentence length and word length
   */
  private calculateReadability(text: string): number {
    try {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
      
      if (sentences.length === 0) return 50;
      
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const avgSentenceLength = words.length / sentences.length;
      const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
      
      // Optimal: 15-20 words per sentence, 4-6 chars per word
      const sentenceScore = Math.max(0, 100 - Math.abs(avgSentenceLength - 17.5) * 4);
      const wordScore = Math.max(0, 100 - Math.abs(avgWordLength - 5) * 15);
      
      return (sentenceScore * 0.6 + wordScore * 0.4);
    } catch (error) {
      console.error('Readability calculation error:', error);
      return 50;
    }
  }

  /**
   * Update document history for IDF calculation
   */
  private updateDocumentHistory(text: string): void {
    try {
      this.documentHistory.push(text);
      if (this.documentHistory.length > this.MAX_HISTORY) {
        this.documentHistory.shift();
      }
      this.updateIDF();
    } catch (error) {
      console.error('Document history update error:', error);
    }
  }

  /**
   * Return default metrics when analysis fails or input is invalid
   */
  private getDefaultMetrics(): ContentMetrics {
    return {
      coherenceScore: 0,
      keywordRelevance: 0,
      sentimentScore: 0,
      sentimentLabel: 'neutral',
      entityCount: 0,
      topKeywords: [],
      topEntities: [],
      vocabularyRichness: 0,
      readabilityScore: 0,
    };
  }

  /**
   * Reset analyzer state (clear history and IDF cache)
   */
  reset(): void {
    try {
      this.documentHistory = [];
      this.vocabularyIDF.clear();
    } catch (error) {
      console.error('Reset error:', error);
    }
  }
}
