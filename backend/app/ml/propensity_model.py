import numpy as np
import pickle
import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False
    print("[ML] LightGBM not installed - using rule-based fallback")


MODEL_PATH = Path(__file__).parent / "trained_model.pkl"


FEATURE_WEIGHTS = {
    "age_18_22": 15,
    "age_22_25": 10,
    "education_graduate": 20,
    "education_diploma": 18,
    "education_iti": 16,
    "education_12th": 15,
    "education_10th": 10,
    "channel_referral": 15,
    "channel_community_event": 12,
    "channel_whatsapp": 10,
    "channel_school_partnership": 10,
    "channel_social_media": 5,
    "channel_sms": 3,
    "income_low": 10,
    "income_middle_low": 7,
    "income_middle": 5,
    "has_skills": 10,
    "has_interests": 5,
    "profile_complete": 15,
    "documents_uploaded": 20,
    "high_engagement": 15,
    "notification_responsive": 10,
}


class PropensityModel:
    def __init__(self):
        self.model = None
        self.feature_names = None
        self.is_trained = False
        
        if MODEL_PATH.exists():
            self.load_model()
    
    def load_model(self):
        try:
            with open(MODEL_PATH, 'rb') as f:
                data = pickle.load(f)
                self.model = data['model']
                self.feature_names = data['feature_names']
                self.is_trained = True
                print("[ML] Loaded trained propensity model")
        except Exception as e:
            print(f"[ML] Failed to load model: {e}")
    
    def save_model(self, model, feature_names: List[str]):
        try:
            with open(MODEL_PATH, 'wb') as f:
                pickle.dump({
                    'model': model,
                    'feature_names': feature_names,
                    'created_at': datetime.utcnow().isoformat()
                }, f)
            self.model = model
            self.feature_names = feature_names
            self.is_trained = True
            print("[ML] Model saved successfully")
        except Exception as e:
            print(f"[ML] Failed to save model: {e}")
    
    def extract_features(self, youth_data: Dict) -> Dict[str, float]:
        features = {}
        
        age = youth_data.get('age', 0)
        features['age'] = age
        features['age_bucket_18_22'] = 1 if 18 <= age <= 22 else 0
        features['age_bucket_22_25'] = 1 if 22 < age <= 25 else 0
        features['age_bucket_25_plus'] = 1 if age > 25 else 0
        
        education = str(youth_data.get('education_level', '')).lower()
        features['edu_10th'] = 1 if '10th' in education or 'ssc' in education else 0
        features['edu_12th'] = 1 if '12th' in education or 'hsc' in education else 0
        features['edu_graduate'] = 1 if 'graduate' in education or 'degree' in education else 0
        features['edu_diploma'] = 1 if 'diploma' in education else 0
        features['edu_iti'] = 1 if 'iti' in education else 0
        
        channel = str(youth_data.get('source_channel', '')).lower()
        features['channel_whatsapp'] = 1 if 'whatsapp' in channel else 0
        features['channel_referral'] = 1 if 'referral' in channel else 0
        features['channel_community'] = 1 if 'community' in channel else 0
        features['channel_social'] = 1 if 'social' in channel else 0
        features['channel_sms'] = 1 if 'sms' in channel else 0
        features['channel_school'] = 1 if 'school' in channel else 0
        features['channel_self'] = 1 if 'self' in channel else 0
        
        income = str(youth_data.get('income_bracket', '')).lower()
        features['income_low'] = 1 if 'low' in income and 'middle' not in income else 0
        features['income_middle_low'] = 1 if 'middle-low' in income or 'middle_low' in income else 0
        features['income_middle'] = 1 if income == 'middle' else 0
        
        skills = youth_data.get('skills', [])
        features['num_skills'] = len(skills) if isinstance(skills, list) else 0
        features['has_skills'] = 1 if features['num_skills'] > 0 else 0
        
        interests = youth_data.get('interests', [])
        features['num_interests'] = len(interests) if isinstance(interests, list) else 0
        features['has_interests'] = 1 if features['num_interests'] > 0 else 0
        
        features['profile_completed'] = 1 if youth_data.get('profile_completed', False) else 0
        features['documents_uploaded'] = 1 if youth_data.get('documents_uploaded', False) else 0
        
        features['total_sessions'] = youth_data.get('total_sessions', 0)
        features['avg_session_duration'] = youth_data.get('avg_session_duration', 0)
        features['total_notifications'] = youth_data.get('total_notifications', 0)
        features['notifications_opened'] = youth_data.get('notifications_opened', 0)
        
        if features['total_notifications'] > 0:
            features['notification_open_rate'] = features['notifications_opened'] / features['total_notifications']
        else:
            features['notification_open_rate'] = 0
        
        return features
    
    def predict_propensity(self, youth_data: Dict) -> Dict:
        features = self.extract_features(youth_data)
        
        if self.is_trained and self.model is not None and LIGHTGBM_AVAILABLE:
            return self._predict_with_model(features)
        else:
            return self._predict_rule_based(features, youth_data)
    
    def _predict_with_model(self, features: Dict) -> Dict:
        try:
            feature_vector = np.array([[features.get(f, 0) for f in self.feature_names]])
            probability = self.model.predict(feature_vector)[0]
            score = probability * 100
            
            return {
                "score": round(score, 2),
                "probability": round(probability, 4),
                "method": "ml_model",
                "confidence": "high" if probability > 0.7 or probability < 0.3 else "medium",
                "factors": self._get_important_factors(features)
            }
        except Exception as e:
            print(f"[ML] Prediction error: {e}")
            return self._predict_rule_based(features, {})
    
    def _predict_rule_based(self, features: Dict, youth_data: Dict) -> Dict:
        score = 50.0
        factors = []
        
        if features.get('age_bucket_18_22'):
            score += FEATURE_WEIGHTS['age_18_22']
            factors.append(("Age 18-22", "+15"))
        elif features.get('age_bucket_22_25'):
            score += FEATURE_WEIGHTS['age_22_25']
            factors.append(("Age 22-25", "+10"))
        
        if features.get('edu_graduate'):
            score += FEATURE_WEIGHTS['education_graduate']
            factors.append(("Graduate", "+20"))
        elif features.get('edu_diploma'):
            score += FEATURE_WEIGHTS['education_diploma']
            factors.append(("Diploma", "+18"))
        elif features.get('edu_iti'):
            score += FEATURE_WEIGHTS['education_iti']
            factors.append(("ITI", "+16"))
        elif features.get('edu_12th'):
            score += FEATURE_WEIGHTS['education_12th']
            factors.append(("12th Pass", "+15"))
        elif features.get('edu_10th'):
            score += FEATURE_WEIGHTS['education_10th']
            factors.append(("10th Pass", "+10"))
        
        if features.get('channel_referral'):
            score += FEATURE_WEIGHTS['channel_referral']
            factors.append(("Referral channel", "+15"))
        elif features.get('channel_community'):
            score += FEATURE_WEIGHTS['channel_community_event']
            factors.append(("Community event", "+12"))
        elif features.get('channel_whatsapp'):
            score += FEATURE_WEIGHTS['channel_whatsapp']
            factors.append(("WhatsApp channel", "+10"))
        
        if features.get('income_low'):
            score += FEATURE_WEIGHTS['income_low']
            factors.append(("Low income bracket", "+10"))
        elif features.get('income_middle_low'):
            score += FEATURE_WEIGHTS['income_middle_low']
            factors.append(("Middle-low income", "+7"))
        
        if features.get('has_skills'):
            score += FEATURE_WEIGHTS['has_skills']
            factors.append(("Has skills listed", "+10"))
        
        if features.get('profile_completed'):
            score += FEATURE_WEIGHTS['profile_complete']
            factors.append(("Profile completed", "+15"))
        
        if features.get('documents_uploaded'):
            score += FEATURE_WEIGHTS['documents_uploaded']
            factors.append(("Documents uploaded", "+20"))
        
        if features.get('notification_open_rate', 0) > 0.5:
            score += FEATURE_WEIGHTS['notification_responsive']
            factors.append(("Responsive to notifications", "+10"))
        
        score = min(100, max(0, score))
        
        return {
            "score": round(score, 2),
            "probability": round(score / 100, 4),
            "method": "rule_based",
            "confidence": "high" if score > 70 or score < 30 else "medium",
            "factors": factors
        }
    
    def _get_important_factors(self, features: Dict) -> List[tuple]:
        factors = []
        if features.get('edu_graduate'):
            factors.append(("Graduate education", "high impact"))
        if features.get('channel_referral'):
            factors.append(("Referral source", "high impact"))
        if features.get('documents_uploaded'):
            factors.append(("Documents uploaded", "high impact"))
        if features.get('profile_completed'):
            factors.append(("Profile complete", "medium impact"))
        return factors[:5]
    
    def calculate_dropout_risk(self, youth_data: Dict) -> Dict:
        risk_score = 0.0
        risk_factors = []
        
        attendance = youth_data.get('attendance_rate', 0)
        if attendance < 0.5:
            risk_score += 30
            risk_factors.append("Low attendance (<50%)")
        elif attendance < 0.7:
            risk_score += 15
            risk_factors.append("Below average attendance")
        
        completion = youth_data.get('assignment_completion', 0)
        if completion < 0.5:
            risk_score += 25
            risk_factors.append("Low assignment completion")
        elif completion < 0.7:
            risk_score += 10
            risk_factors.append("Below average completion")
        
        sentiment = youth_data.get('sentiment_score', 0.5)
        if sentiment < 0.3:
            risk_score += 25
            risk_factors.append("Negative sentiment detected")
        elif sentiment < 0.5:
            risk_score += 10
            risk_factors.append("Low engagement sentiment")
        
        sessions = youth_data.get('total_sessions', 0)
        if sessions < 3:
            risk_score += 15
            risk_factors.append("Low session count")
        
        notif_rate = youth_data.get('notification_open_rate', 0)
        if notif_rate < 0.2:
            risk_score += 10
            risk_factors.append("Not responding to notifications")
        
        risk_score = min(100, risk_score)
        
        if risk_score >= 70:
            risk_level = "critical"
            intervention = "Immediate staff call + family engagement"
        elif risk_score >= 50:
            risk_level = "high"
            intervention = "Mentor check-in + peer buddy activation"
        elif risk_score >= 30:
            risk_level = "medium"
            intervention = "Automated motivational nudge"
        else:
            risk_level = "low"
            intervention = "Continue regular engagement"
        
        return {
            "risk_score": round(risk_score, 2),
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "recommended_intervention": intervention
        }


propensity_model = PropensityModel()


def get_propensity_score(youth_data: Dict) -> Dict:
    return propensity_model.predict_propensity(youth_data)


def get_dropout_risk(youth_data: Dict) -> Dict:
    return propensity_model.calculate_dropout_risk(youth_data)
