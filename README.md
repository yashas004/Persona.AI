# Persona.AI - Master Your Communication Skills

An advanced AI-powered communication coaching platform that provides real-time feedback on presentation skills using multi-modal analysis.

## Features

- **Real-time AI Analysis**: Advanced computer vision and audio analysis using MediaPipe and TensorFlow.js
- **Multi-modal Feedback**: Analyzes facial expressions, posture, voice quality, speech clarity, and content engagement
- **Category-specific Coaching**: Tailored analysis for job seekers, professionals, speakers, sales teams, remote workers, and students
- **Privacy-first**: All processing happens locally in the browser with optional backend analysis
- **Comprehensive Metrics**: Eye contact, posture, gesture analysis, speech patterns, and emotional recognition

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: ShadCN/UI, Tailwind CSS, Radix UI
- **AI/ML**: MediaPipe (Face Mesh, Pose, Gesture), TensorFlow.js, Hugging Face Transformers
- **Audio Processing**: Web Audio API, YIN Pitch Detection, SNR Analysis
- **Backend**: Supabase (optional for extended analysis)
- **State Management**: TanStack Query, React Router

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
├── lib/                # Core analysis algorithms
│   ├── visionAnalysis.ts    # MediaPipe-based vision analysis
│   ├── audioAnalysis.ts     # Audio processing and analysis
│   ├── speechRecognition.ts # Speech-to-text and analysis
│   ├── contentAnalysis.ts   # NLP content analysis
│   └── fusionAlgorithm.ts   # Multi-modal metric fusion
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
└── types/              # TypeScript type definitions
```

## Key Components

### Vision Analysis
- **Face Detection**: MediaPipe Face Mesh (468 landmarks)
- **Emotion Recognition**: FACS-based emotion detection with blendshapes
- **Eye Contact Tracking**: Iris position analysis with gaze vector calculation
- **Posture Analysis**: 3D pose estimation with joint angle analysis

### Audio Analysis
- **Pitch Detection**: YIN algorithm for fundamental frequency
- **Voice Quality**: SNR (Signal-to-Noise Ratio) for clarity
- **Speech Patterns**: Filler word detection, WPM calculation

### Content Analysis
- **NLP Processing**: TF-IDF keyword extraction, sentiment analysis
- **Readability Metrics**: Sentence complexity and vocabulary richness
- **Named Entity Recognition**: Pattern-based entity extraction

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
