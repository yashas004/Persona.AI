import streamlit as st
import cv2
import numpy as np
import time
import threading
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
from typing import List, Tuple, Dict
import altair as alt
import json
import requests

st.set_page_config(page_title="Persona.AI", page_icon="🎭", layout="wide")

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

mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

@st.cache_resource
def load_face_mesh():
    return mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

def process_face_landmarks(image, face_mesh):
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(image_rgb)
    
    facial_metrics = {
        "expression_diversity": 2,
        "eye_movement": 0,
        "mouth_movement": 0,
        "head_position": 0,
    }
    
    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            mp_drawing.draw_landmarks(
                image=image,
                landmark_list=face_landmarks,
                connections=mp_face_mesh.FACEMESH_TESSELATION,
                landmark_drawing_spec=None,
                connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style()
            )
            
            left_eye = [face_landmarks.landmark[145], face_landmarks.landmark[159]]
            right_eye = [face_landmarks.landmark[374], face_landmarks.landmark[386]]
            
            mouth_landmarks = [face_landmarks.landmark[61], face_landmarks.landmark[291]]
            
            eye_distance = np.sqrt((left_eye[0].x - right_eye[0].x)**2 + 
                                 (left_eye[0].y - right_eye[0].y)**2)
            mouth_openness = np.abs(mouth_landmarks[0].y - mouth_landmarks[1].y)
            
            facial_metrics["eye_movement"] = max(1.0, eye_distance * 100)
            facial_metrics["mouth_movement"] = max(1.0, mouth_openness * 100)
            facial_metrics["head_position"] = max(1.0, (face_landmarks.landmark[0].z + 0.5) * 100)
            facial_metrics["expression_diversity"] = max(2.0, facial_metrics["expression_diversity"])
            
    else:
        facial_metrics["eye_movement"] = 1.0
        facial_metrics["mouth_movement"] = 1.0
        facial_metrics["head_position"] = 1.0
        facial_metrics["expression_diversity"] = 2.0
            
    return image, facial_metrics

def get_gemini_feedback(facial_metrics: Dict, prompt: str) -> Dict:
    api_key = st.session_state.gemini_api_key
    if not api_key:
        return generate_feedback_fallback(facial_metrics)
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
    
    expression_score = np.mean([facial_metrics["expression_diversity"], 
                                facial_metrics["eye_movement"],
                                facial_metrics["mouth_movement"]])
    overall_score = expression_score
    
    gemini_prompt = f"""
    You are an expert expression coach analyzing a practice session. The user was responding to this prompt: "{prompt}"
    
    Here are the metrics from their performance:
    
    FACIAL METRICS (scored 0-100):
    - Expression Diversity: {facial_metrics['expression_diversity']:.1f}
    - Eye Movement: {facial_metrics['eye_movement']:.1f}
    - Mouth Movement: {facial_metrics['mouth_movement']:.1f}
    - Head Position: {facial_metrics['head_position']:.1f}
    
    OVERALL SCORES:
    - Expression Score: {expression_score:.1f}/100
    - Overall Score: {overall_score:.1f}/100
    
    Provide helpful feedback as an expression coach in this JSON format. Keep descriptions brief but meaningful:
    {{
        "overall_score": {overall_score},
        "expression_score": {expression_score},
        "strengths": ["strength 1", "strength 2", "strength 3"],
        "areas_to_improve": ["area 1", "area 2"],
        "tips": ["specific tip 1", "specific tip 2", "specific tip 3"]
    }}
    
    Only respond with the JSON, nothing else.
    """
    
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
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        
        if 'candidates' in result and len(result['candidates']) > 0:
            text_content = result['candidates'][0]['content']['parts'][0]['text']
            
            feedback = json.loads(text_content)
            
            required_fields = ["overall_score", "expression_score", 
                              "strengths", "areas_to_improve", "tips"]
            
            for field in required_fields:
                if field not in feedback:
                    return generate_feedback_fallback(facial_metrics)
            
            return feedback
        else:
            return generate_feedback_fallback(facial_metrics)
            
    except Exception as e:
        st.error(f"Error connecting to Gemini AI: {str(e)}")
        return generate_feedback_fallback(facial_metrics)

def generate_feedback_fallback(facial_metrics: Dict) -> Dict:
    expression_score = np.mean([facial_metrics["expression_diversity"], 
                                facial_metrics["eye_movement"],
                                facial_metrics["mouth_movement"]])
    overall_score = expression_score
    
    feedback = {
        "overall_score": overall_score,
        "expression_score": expression_score,
        "strengths": [],
        "areas_to_improve": [],
        "tips": []
    }
    
    if facial_metrics["eye_movement"] > 70:
        feedback["strengths"].append("Good eye expressiveness")
    if facial_metrics["expression_diversity"] > 70:
        feedback["strengths"].append("Excellent expression variety")
    if facial_metrics["head_position"] > 70:
        feedback["strengths"].append("Confident head positioning")
    
    if facial_metrics["mouth_movement"] < 60:
        feedback["areas_to_improve"].append("Facial expressions")
        feedback["tips"].append("Try to be more expressive with your mouth when speaking")
    if facial_metrics["eye_movement"] < 50:
        feedback["areas_to_improve"].append("Eye engagement")
        feedback["tips"].append("Consider making more eye contact to maintain audience engagement")
    if facial_metrics["head_position"] < 50:
        feedback["areas_to_improve"].append("Head positioning")
        feedback["tips"].append("Try varying your head position slightly to appear more dynamic")
    
    if not feedback["strengths"]:
        feedback["strengths"].append("Consistent delivery")
    if not feedback["areas_to_improve"]:
        feedback["areas_to_improve"].append("Fine-tuning your natural style")
        feedback["tips"].append("Continue practicing to build on your strengths")
    
    return feedback

def update_progress(feedback: Dict) -> List[str]:
    new_badges = []
    
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
    
    return new_badges

def main():
    face_mesh = load_face_mesh()
    
    st.title("🎭 Persona.AI")
    st.markdown("### Improve your expression skills with AI feedback")
    
    with st.sidebar:
        st.header("Your Progress")
        st.metric("Sessions Completed", st.session_state.sessions_completed)
        st.metric("Current Streak", f"{st.session_state.streak} day")
        
        st.header("Your Badges")
        if st.session_state.badges:
            for badge in st.session_state.badges:
                st.markdown(f"**{badge}**")
        else:
            st.markdown("Complete sessions to earn badges!")

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
    
    tab1, tab2, tab3 = st.tabs(["Practice", "Results & Feedback", "History"])
    
    with tab1:
        st.subheader("Practice Session")
        st.markdown(f"**Your prompt:** {practice_prompt}")
        
        video_placeholder = st.empty()
        
        col1, col2, col3 = st.columns(3)
        facial_metrics_placeholder = col1.empty()
        timer_placeholder = col3.empty()
        
        start_button = st.button("Start Recording")
        stop_button = st.button("Stop Recording (Early)")
        
        if start_button:
            os.makedirs("temp", exist_ok=True)

            cap = cv2.VideoCapture(0)

            facial_data = []

            start_time = time.time()
            recording = True

            while recording:
                elapsed_time = time.time() - start_time
                remaining_time = max(0, practice_duration - elapsed_time)
                
                if elapsed_time >= practice_duration or stop_button:
                    recording = False
                    break
                
                ret, frame = cap.read()
                if not ret:
                    st.error("Failed to capture video from webcam")
                    break
                
                processed_frame, current_facial_metrics = process_face_landmarks(frame, face_mesh)
                
                facial_data.append(current_facial_metrics)
                
                processed_frame_rgb = cv2.cvtColor(processed_frame, cv2.COLOR_BGR2RGB)
                
                try:
                    video_placeholder.image(processed_frame_rgb, width=600)
                except Exception as e:
                    st.error(f"Error displaying video frame: {str(e)}")
                    try:
                        video_placeholder.image(processed_frame_rgb)
                    except:
                        video_placeholder.text("Video processing active...")
                
                facial_metrics_placeholder.markdown(f"""
                **Facial Metrics:**
                - Eye Movement: {max(0.1, current_facial_metrics["eye_movement"]):.1f}
                - Mouth Movement: {max(0.1, current_facial_metrics["mouth_movement"]):.1f}
                """)
                
                timer_placeholder.markdown(f"**Time Remaining:** {int(remaining_time)} seconds")
                
                time.sleep(0.01)

            cap.release()
            
            avg_facial_metrics = {
                metric: max(1.0, np.mean([max(0.1, data[metric]) for data in facial_data]))
                for metric in facial_data[0].keys()
            }
            
            with st.spinner("Getting AI feedback..."):
                feedback = get_gemini_feedback(avg_facial_metrics, practice_prompt)
            
            new_badges = update_progress(feedback)
            
            session_data = {
                "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "duration": practice_duration,
                "prompt": practice_prompt,
                "facial_metrics": avg_facial_metrics,
                "feedback": feedback,
                "new_badges": new_badges
            }
            st.session_state.history.append(session_data)
            
            st.rerun()
    
    with tab2:
        if st.session_state.history:
            latest_session = st.session_state.history[-1]
            
            st.subheader("Session Results")
            st.write(f"**Date:** {latest_session['date']}")
            st.write(f"**Prompt:** {latest_session['prompt']}")
            
            col1, col2 = st.columns(2)
            col1.metric("Overall Score", f"{latest_session['feedback']['overall_score']:.1f}")
            col2.metric("Expression Score", f"{latest_session['feedback']['expression_score']:.1f}")
            
            st.subheader("Performance Metrics")
            
            facial_data = {k: max(1.0, v) for k, v in latest_session['facial_metrics'].items()}
            
            chart_data = pd.DataFrame({
                'Metric': list(facial_data.keys()),
                'Value': list(facial_data.values()),
                'Category': ['Facial'] * len(facial_data)
            })
            
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
            
            st.subheader("AI Feedback")
            
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
            
            if latest_session['new_badges']:
                st.subheader("🎉 New Achievements!")
                for badge in latest_session['new_badges']:
                    st.markdown(f"**{badge}**")
        else:
            st.info("Complete a practice session to see your results!")
    
    with tab3:
        st.subheader("Your Practice History")
        
        if st.session_state.history:
            progress_data = []
            for session in st.session_state.history:
                progress_data.append({
                    'Date': session['date'],
                    'Overall Score': max(1.0, session['feedback']['overall_score']),
                    'Expression Score': max(1.0, session['feedback']['expression_score'])
                })
            
            progress_df = pd.DataFrame(progress_data)
            
            st.subheader("Your Progress Over Time")
            
            progress_df_melted = pd.melt(
                progress_df, 
                id_vars=['Date'], 
                value_vars=['Overall Score', 'Expression Score'],
                var_name='Score Type', 
                value_name='Score'
            )
            
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
            
            st.subheader("Previous Sessions")
            for idx, session in enumerate(reversed(st.session_state.history)):
                with st.expander(f"Session {len(st.session_state.history) - idx}: {session['date']}"):
                    st.write(f"**Prompt:** {session['prompt']}")
                    st.write(f"**Duration:** {session['duration']} seconds")
                    st.write(f"**Overall Score:** {max(1.0, session['feedback']['overall_score']):.1f}")
                    
                    if session['feedback']['strengths']:
                        st.write("**Strengths:** " + ", ".join(session['feedback']['strengths']))
                    if session['feedback']['areas_to_improve']:
                        st.write("**Areas to Improve:** " + ", ".join(session['feedback']['areas_to_improve']))
        else:
            st.info("Your practice history will appear here after you complete sessions.")

if __name__ == "__main__":
    main()