import streamlit as st
import cv2
import numpy as np
import time
import threading
import speech_recognition as sr
import pandas as pd
import matplotlib.pyplot as plt
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe.framework.formats import landmark_pb2
import random
import os
from datetime import datetime
import tensorflow as tf
import librosa
import soundfile as sf
from typing import List, Tuple, Dict
import altair as alt
import json
import requests

# Set page configuration
st.set_page_config(page_title="Persona.AI", page_icon="🎭", layout="wide")

# Initialize session state variables if they don't exist
if 'history' not in st.session_state:
    st.session_state.history = []
if 'badges' not in st.session_state:
    st.session_state.badges = []
if 'sessions_completed' not in st.session_state:
    st.session_state.sessions_completed = 0
if 'streak' not in st.session_state:
    st.session_state.streak = 0
if 'last_session_date' not in st.session_state:
    st.session_state.last_session_date = None
if 'gemini_api_key' not in st.session_state:
    st.session_state.gemini_api_key = ""

# MediaPipe Face Landmark detector
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Load Face Mesh model
@st.cache_resource
def load_face_mesh():
    return mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

# Function to process face landmarks
def process_face_landmarks(image, face_mesh):
    # Convert the BGR image to RGB
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    # Process the image and get the face landmarks
    results = face_mesh.process(image_rgb)
    
    # Create a dictionary to store facial metrics
    facial_metrics = {
        "expression_diversity": 0,
        "eye_movement": 0,
        "mouth_movement": 0,
        "head_position": 0,
    }
    
    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            # Draw the face mesh on the image
            mp_drawing.draw_landmarks(
                image=image,
                landmark_list=face_landmarks,
                connections=mp_face_mesh.FACEMESH_TESSELATION,
                landmark_drawing_spec=None,
                connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style()
            )
            
            # Extract key facial features for analysis
            # Eyes landmarks (simplified for example)
            left_eye = [face_landmarks.landmark[145], face_landmarks.landmark[159]]
            right_eye = [face_landmarks.landmark[374], face_landmarks.landmark[386]]
            
            # Mouth landmarks
            mouth_landmarks = [face_landmarks.landmark[61], face_landmarks.landmark[291]]
            
            # Calculate metrics (simplified example)
            eye_distance = np.sqrt((left_eye[0].x - right_eye[0].x)**2 + 
                                 (left_eye[0].y - right_eye[0].y)**2)
            mouth_openness = np.abs(mouth_landmarks[0].y - mouth_landmarks[1].y)
            
            # Update facial metrics
            facial_metrics["eye_movement"] = eye_distance * 100  # Scaled for visibility
            facial_metrics["mouth_movement"] = mouth_openness * 100  # Scaled for visibility
            facial_metrics["head_position"] = (face_landmarks.landmark[0].z + 0.5) * 100  # Example
            
    return image, facial_metrics

# Function to analyze audio
def analyze_audio(audio_file_path: str) -> Dict:
    # Load audio file
    y, sr = librosa.load(audio_file_path, sr=None)
    
    # Extract audio features
    # Volume/energy
    energy = np.sum(y**2) / len(y)
    
    # Pitch variation
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    pitch_variation = np.std(pitches[pitches > 0])
    
    # Speech rate (simplified)
    zero_crossings = librosa.zero_crossings(y)
    speech_rate = sum(zero_crossings)
    
    # Create audio metrics dictionary
    audio_metrics = {
        "volume": min(100, energy * 1000),  # Scale for readability
        "pitch_variation": min(100, pitch_variation * 10),  # Scale for readability
        "speech_rate": min(100, speech_rate / 1000),  # Scale for readability
        "clarity": random.uniform(60, 95)  # Placeholder for a more complex clarity metric
    }
    
    return audio_metrics

# Function to call Gemini API for AI feedback
def get_gemini_feedback(facial_metrics: Dict, audio_metrics: Dict, prompt: str) -> Dict:
    """
    Send metrics to Google's Gemini API and get AI feedback.
    
    Args:
        facial_metrics: Dictionary of facial expression metrics
        audio_metrics: Dictionary of audio/voice metrics
        prompt: The practice prompt the user was responding to
        
    Returns:
        Dictionary containing AI feedback
    """
    # Check if API key is available
    api_key = st.session_state.gemini_api_key
    if not api_key:
        # Return fallback feedback if no API key
        return generate_feedback_fallback(facial_metrics, audio_metrics)
    
    # Gemini API endpoint
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
    
    # Calculate overall scores for prompt context
    expression_score = np.mean([facial_metrics["expression_diversity"], 
                                facial_metrics["eye_movement"],
                                facial_metrics["mouth_movement"]])
    voice_score = np.mean([audio_metrics["volume"], 
                          audio_metrics["pitch_variation"],
                          audio_metrics["speech_rate"],
                          audio_metrics["clarity"]])
    overall_score = (expression_score + voice_score) / 2
    
    # Create prompt for Gemini
    gemini_prompt = f"""
    You are an expert speaking coach analyzing a practice session. The user was responding to this prompt: "{prompt}"
    
    Here are the metrics from their performance:
    
    FACIAL METRICS (scored 0-100):
    - Expression Diversity: {facial_metrics['expression_diversity']:.1f}
    - Eye Movement: {facial_metrics['eye_movement']:.1f}
    - Mouth Movement: {facial_metrics['mouth_movement']:.1f}
    - Head Position: {facial_metrics['head_position']:.1f}
    
    AUDIO METRICS (scored 0-100):
    - Volume: {audio_metrics['volume']:.1f}
    - Pitch Variation: {audio_metrics['pitch_variation']:.1f}
    - Speech Rate: {audio_metrics['speech_rate']:.1f}
    - Clarity: {audio_metrics['clarity']:.1f}
    
    OVERALL SCORES:
    - Expression Score: {expression_score:.1f}/100
    - Voice Score: {voice_score:.1f}/100  
    - Overall Score: {overall_score:.1f}/100
    
    Provide helpful feedback as a speaking coach in this JSON format. Keep descriptions brief but meaningful:
    {{
        "overall_score": {overall_score},
        "expression_score": {expression_score},
        "voice_score": {voice_score},
        "strengths": ["strength 1", "strength 2", "strength 3"],
        "areas_to_improve": ["area 1", "area 2"],
        "tips": ["specific tip 1", "specific tip 2", "specific tip 3"]
    }}
    
    Only respond with the JSON, nothing else.
    """
    
    # Prepare the request
    payload = {
        "contents": [{
            "parts": [{
                "text": gemini_prompt
            }]
        }]
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        # Make request to Gemini API
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()  # Raise exception for HTTP errors
        
        # Parse the response
        result = response.json()
        
        # Extract the text content from the response
        if 'candidates' in result and len(result['candidates']) > 0:
            text_content = result['candidates'][0]['content']['parts'][0]['text']
            
            # Parse JSON response
            feedback = json.loads(text_content)
            
            # Ensure all required fields are present
            required_fields = ["overall_score", "expression_score", "voice_score", 
                              "strengths", "areas_to_improve", "tips"]
            
            for field in required_fields:
                if field not in feedback:
                    # Fall back to generated feedback if missing fields
                    return generate_feedback_fallback(facial_metrics, audio_metrics)
            
            return feedback
        else:
            # Fall back to generated feedback if response format is unexpected
            return generate_feedback_fallback(facial_metrics, audio_metrics)
            
    except Exception as e:
        st.error(f"Error connecting to Gemini AI: {str(e)}")
        # Fall back to locally generated feedback
        return generate_feedback_fallback(facial_metrics, audio_metrics)

# Fallback function for generating feedback without API
def generate_feedback_fallback(facial_metrics: Dict, audio_metrics: Dict) -> Dict:
    """Fallback function when Gemini API is unavailable"""
    # Calculate overall scores
    expression_score = np.mean([facial_metrics["expression_diversity"], 
                                facial_metrics["eye_movement"],
                                facial_metrics["mouth_movement"]])
    voice_score = np.mean([audio_metrics["volume"], 
                           audio_metrics["pitch_variation"],
                           audio_metrics["speech_rate"],
                           audio_metrics["clarity"]])
    overall_score = (expression_score + voice_score) / 2
    
    # Generate feedback based on scores
    feedback = {
        "overall_score": overall_score,
        "expression_score": expression_score,
        "voice_score": voice_score,
        "strengths": [],
        "areas_to_improve": [],
        "tips": []
    }
    
    # Identify strengths
    if facial_metrics["eye_movement"] > 70:
        feedback["strengths"].append("Good eye expressiveness")
    if audio_metrics["pitch_variation"] > 70:
        feedback["strengths"].append("Excellent vocal variety")
    if audio_metrics["clarity"] > 80:
        feedback["strengths"].append("Clear pronunciation")
    
    # Identify areas to improve
    if facial_metrics["mouth_movement"] < 60:
        feedback["areas_to_improve"].append("Facial expressions")
        feedback["tips"].append("Try to be more expressive with your mouth when speaking")
    if audio_metrics["speech_rate"] < 50:
        feedback["areas_to_improve"].append("Speech pace")
        feedback["tips"].append("Consider speaking a bit faster to maintain audience engagement")
    elif audio_metrics["speech_rate"] > 85:
        feedback["areas_to_improve"].append("Speech pace")
        feedback["tips"].append("Try slowing down a bit to ensure clarity")
    
    # Ensure we have at least some feedback
    if not feedback["strengths"]:
        feedback["strengths"].append("Consistent delivery")
    if not feedback["areas_to_improve"]:
        feedback["areas_to_improve"].append("Fine-tuning your natural style")
        feedback["tips"].append("Continue practicing to build on your strengths")
    
    return feedback

# Function to update user progress and award badges
def update_progress(feedback: Dict) -> List[str]:
    new_badges = []
    
    # Update streak
    today = datetime.now().date()
    if st.session_state.last_session_date is None or st.session_state.last_session_date != today:
        st.session_state.sessions_completed += 1
        
        if st.session_state.last_session_date is not None:
            days_diff = (today - st.session_state.last_session_date).days
            if days_diff == 1:
                st.session_state.streak += 1
            elif days_diff > 1:
                st.session_state.streak = 1
        else:
            st.session_state.streak = 1
            
        st.session_state.last_session_date = today
    
    # Award badges based on performance and milestones
    if feedback["overall_score"] > 85:
        new_badge = "⭐ Star Performer"
        if new_badge not in st.session_state.badges:
            new_badges.append(new_badge)
            st.session_state.badges.append(new_badge)
    
    if st.session_state.sessions_completed == 5:
        new_badge = "🏆 Dedicated Learner"
        if new_badge not in st.session_state.badges:
            new_badges.append(new_badge)
            st.session_state.badges.append(new_badge)
    
    if st.session_state.streak >= 3:
        new_badge = "🔥 3-Day Streak"
        if new_badge not in st.session_state.badges:
            new_badges.append(new_badge)
            st.session_state.badges.append(new_badge)
    
    if feedback["expression_score"] > 80:
        new_badge = "😊 Expression Master"
        if new_badge not in st.session_state.badges:
            new_badges.append(new_badge)
            st.session_state.badges.append(new_badge)
    
    if feedback["voice_score"] > 80:
        new_badge = "🎤 Voice Pro"
        if new_badge not in st.session_state.badges:
            new_badges.append(new_badge)
            st.session_state.badges.append(new_badge)
    
    return new_badges

# Main application UI
def main():
    # Load face mesh model
    face_mesh = load_face_mesh()
    
    # Title and intro
    st.title("🎭 Persona.AI")
    st.markdown("### Improve your speaking and expression skills with AI feedback")
    
    # Sidebar for navigation and user info
    with st.sidebar:
        st.header("Your Progress")
        st.metric("Sessions Completed", st.session_state.sessions_completed)
        st.metric("Current Streak", f"{st.session_state.streak} days")
        
        st.header("Your Badges")
        if st.session_state.badges:
            for badge in st.session_state.badges:
                st.markdown(f"**{badge}**")
        else:
            st.markdown("Complete sessions to earn badges!")
        
        # API key input for Gemini
        st.header("Settings")
        gemini_api_key = st.text_input("Gemini API Key", 
                                       value=st.session_state.gemini_api_key, 
                                       type="password", 
                                       help="Enter your Google Gemini API key")
        if gemini_api_key != st.session_state.gemini_api_key:
            st.session_state.gemini_api_key = gemini_api_key
            if gemini_api_key:
                st.success("API key updated!")
        
        st.header("Session Options")
        practice_duration = st.slider("Practice Duration (seconds)", 10, 60, 20)
        practice_prompt = st.text_area("Practice Prompt (optional)", 
                                     "Introduce yourself and describe what you're passionate about.")
    
    # Main content area - tabs for different sections
    tab1, tab2, tab3 = st.tabs(["Practice", "Results & Feedback", "History"])
    
    # Practice Tab
    with tab1:
        st.subheader("Practice Session")
        st.markdown(f"**Your prompt:** {practice_prompt}")
        
        # Placeholder for webcam
        video_placeholder = st.empty()
        
        # Metrics to display during recording
        col1, col2, col3 = st.columns(3)
        facial_metrics_placeholder = col1.empty()
        audio_metrics_placeholder = col2.empty()
        timer_placeholder = col3.empty()
        
        # Start/stop recording buttons
        start_button = st.button("Start Recording")
        stop_button = st.button("Stop Recording (Early)")
        
        if start_button:
            # Create a temporary directory for storing audio
            os.makedirs("temp", exist_ok=True)
            audio_file_path = os.path.join("temp", f"audio_{int(time.time())}.wav")


            # Setup webcam
            cap = cv2.VideoCapture(0)

            # Initialize speech recognizer in a separate thread
            recognizer = sr.Recognizer()
            mic = sr.Microphone()

            # Audio recording thread
            def record_audio():
                with mic as source:
                    recognizer.adjust_for_ambient_noise(source)
                    audio = recognizer.listen(source, phrase_time_limit=practice_duration)
                
                # Save audio to file
                with open(audio_file_path, "wb") as f:
                    f.write(audio.get_wav_data())

            # Start audio recording in a separate thread
            audio_thread = threading.Thread(target=record_audio)
            audio_thread.start()

            # Initialize metrics
            facial_data = []

            # Record for the specified duration
            start_time = time.time()
            recording = True

            while recording:
                # Check if we should stop recording
                elapsed_time = time.time() - start_time
                remaining_time = max(0, practice_duration - elapsed_time)
                
                if elapsed_time >= practice_duration or stop_button:
                    recording = False
                    break
                
                # Read frame from webcam
                ret, frame = cap.read()
                if not ret:
                    st.error("Failed to capture video from webcam")
                    break
                
                # Process frame to get facial landmarks and metrics
                processed_frame, current_facial_metrics = process_face_landmarks(frame, face_mesh)
                
                # Collect data for analysis
                facial_data.append(current_facial_metrics)
                
                # Convert BGR to RGB (Streamlit expects RGB)
                processed_frame_rgb = cv2.cvtColor(processed_frame, cv2.COLOR_BGR2RGB)
                
                # Display processed frame - use width parameter instead of use_container_width
                try:
                    # For older Streamlit versions, use width parameter instead
                    video_placeholder.image(processed_frame_rgb, width=600)
                except Exception as e:
                    st.error(f"Error displaying video frame: {str(e)}")
                    # Try with even simpler parameters as a fallback
                    try:
                        video_placeholder.image(processed_frame_rgb)
                    except:
                        video_placeholder.text("Video processing active...")
                
                # Update metrics displays
                facial_metrics_placeholder.markdown(f"""
                **Facial Metrics:**
                - Eye Movement: {current_facial_metrics["eye_movement"]:.1f}
                - Mouth Movement: {current_facial_metrics["mouth_movement"]:.1f}
                """)
                
                # Placeholder values for audio (real-time audio analysis is complex)
                audio_metrics_placeholder.markdown("""
                **Audio Metrics:**
                - Volume: Analyzing...
                - Clarity: Analyzing...
                """)
                
                # Update timer
                timer_placeholder.markdown(f"**Time Remaining:** {int(remaining_time)} seconds")
                
                # Small delay
                time.sleep(0.01)

            # Clean up
            cap.release()
            
            # Wait for audio recording to complete
            audio_thread.join()
            
            # Calculate average facial metrics
            avg_facial_metrics = {
                metric: np.mean([data[metric] for data in facial_data]) 
                for metric in facial_data[0].keys()
            }
            
            # Analyze audio
            audio_metrics = analyze_audio(audio_file_path)
            
            # Generate feedback using Gemini AI
            with st.spinner("Getting AI feedback..."):
                feedback = get_gemini_feedback(avg_facial_metrics, audio_metrics, practice_prompt)
            
            # Update progress and check for new badges
            new_badges = update_progress(feedback)
            
            # Save session results to history
            session_data = {
                "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "duration": practice_duration,
                "prompt": practice_prompt,
                "facial_metrics": avg_facial_metrics,
                "audio_metrics": audio_metrics,
                "feedback": feedback,
                "new_badges": new_badges
            }
            st.session_state.history.append(session_data)
            
            # Switch to results tab
            st.rerun()
    
    # Results & Feedback Tab
    with tab2:
        if st.session_state.history:
            latest_session = st.session_state.history[-1]
            
            st.subheader("Session Results")
            st.write(f"**Date:** {latest_session['date']}")
            st.write(f"**Prompt:** {latest_session['prompt']}")
            
            # Display scores
            col1, col2, col3 = st.columns(3)
            col1.metric("Overall Score", f"{latest_session['feedback']['overall_score']:.1f}")
            col2.metric("Expression Score", f"{latest_session['feedback']['expression_score']:.1f}")
            col3.metric("Voice Score", f"{latest_session['feedback']['voice_score']:.1f}")
            
            # Display metrics charts
            st.subheader("Performance Metrics")
            
            # Prepare data for charts
            facial_data = {k: v for k, v in latest_session['facial_metrics'].items()}
            audio_data = {k: v for k, v in latest_session['audio_metrics'].items()}
            
            # Create visualization
            chart_data = pd.DataFrame({
                'Metric': list(facial_data.keys()) + list(audio_data.keys()),
                'Value': list(facial_data.values()) + list(audio_data.values()),
                'Category': ['Facial'] * len(facial_data) + ['Audio'] * len(audio_data)
            })
            
            # Create a bar chart
            chart = alt.Chart(chart_data).mark_bar().encode(
                x='Metric',
                y='Value',
                color='Category',
                tooltip=['Metric', 'Value', 'Category']
            ).properties(
                width=600,
                height=400
            )
            
            st.altair_chart(chart, use_container_width=True)
            
            # AI Feedback
            st.subheader("AI Feedback")
            
            # Show source of feedback
            if st.session_state.gemini_api_key:
                st.markdown("*Feedback powered by Google Gemini AI*")
            else:
                st.markdown("*Using built-in feedback system. Add a Gemini API key in settings for enhanced feedback.*")
            
            st.markdown("#### Strengths")
            for strength in latest_session['feedback']['strengths']:
                st.markdown(f"✅ {strength}")
            
            st.markdown("#### Areas to Improve")
            for area in latest_session['feedback']['areas_to_improve']:
                st.markdown(f"🔍 {area}")
            
            st.markdown("#### Tips for Improvement")
            for tip in latest_session['feedback']['tips']:
                st.markdown(f"💡 {tip}")
            
            # Display any new badges
            if latest_session['new_badges']:
                st.subheader("🎉 New Achievements!")
                for badge in latest_session['new_badges']:
                    st.markdown(f"**{badge}**")
        else:
            st.info("Complete a practice session to see your results!")
    
    # History Tab
    with tab3:
        st.subheader("Your Practice History")
        
        if st.session_state.history:
            # Create a DataFrame for progress over time
            progress_data = []
            for session in st.session_state.history:
                progress_data.append({
                    'Date': session['date'],
                    'Overall Score': session['feedback']['overall_score'],
                    'Expression Score': session['feedback']['expression_score'],
                    'Voice Score': session['feedback']['voice_score']
                })
            
            progress_df = pd.DataFrame(progress_data)
            
            # Progress chart
            st.subheader("Your Progress Over Time")
            
            # Melt the DataFrame for easier plotting
            progress_df_melted = pd.melt(
                progress_df, 
                id_vars=['Date'], 
                value_vars=['Overall Score', 'Expression Score', 'Voice Score'],
                var_name='Score Type', 
                value_name='Score'
            )
            
            # Create line chart
            line_chart = alt.Chart(progress_df_melted).mark_line(point=True).encode(
                x='Date:O',
                y='Score:Q',
                color='Score Type:N',
                tooltip=['Date', 'Score Type', 'Score']
            ).properties(
                width=600,
                height=400
            )
            
            st.altair_chart(line_chart, use_container_width=True)
            
            # List of previous sessions
            st.subheader("Previous Sessions")
            for idx, session in enumerate(reversed(st.session_state.history)):
                with st.expander(f"Session {len(st.session_state.history) - idx}: {session['date']}"):
                    st.write(f"**Prompt:** {session['prompt']}")
                    st.write(f"**Duration:** {session['duration']} seconds")
                    st.write(f"**Overall Score:** {session['feedback']['overall_score']:.1f}")
                    
                    # Display key feedback
                    if session['feedback']['strengths']:
                        st.write("**Strengths:** " + ", ".join(session['feedback']['strengths']))
                    if session['feedback']['areas_to_improve']:
                        st.write("**Areas to Improve:** " + ", ".join(session['feedback']['areas_to_improve']))
        else:
            st.info("Your practice history will appear here after you complete sessions.")

# Run the app
if __name__ == "__main__":
    main()
    

