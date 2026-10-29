import re
from typing import Dict, List, Any

class EmotionalService:
    CRISIS_KEYWORDS = [
        "suicide", "kill myself", "end my life", "end it all", "want to die", 
        "hurt myself", "self harm", "cutting myself", "don't want to live"
    ]

    SAFETY_RESOURCE_CARD = (
        "\n\n---\n"
        "> 🤍 **Important Support Resources**\n"
        "> If you are feeling overwhelmed, hopeless, or having thoughts of harming yourself, "
        "please know that you are not alone and free, confidential support is available 24/7:\n"
        "> - **988 Suicide & Crisis Lifeline** (US & Canada): Call or text **988**\n"
        "> - **The Trevor Project** (LGBTQ youth): Call 1-866-488-7386 or text START to 678-678\n"
        "> - **Crisis Text Line**: Text **HOME** to **741741**\n"
        "> - **International Helplines**: Visit [findahelpline.com](https://findahelpline.com)\n"
        "> \n"
        "> *Note: I am an AI companion for emotional support and reflection, not a healthcare professional.*"
    )

    SYSTEM_INSTRUCTION = (
        "You are a supportive, empathetic, compassionate, and non-judgmental AI emotional companion. "
        "Your role is to actively listen, validate feelings without minimizing them, foster reflection, "
        "and offer gentle, evidence-informed coping exercises (such as mindful breathing, grounding, or reframing). "
        "Never diagnose mental health disorders, prescribe medications, or replace human medical care. "
        "Speak with warmth, gentle tone, and genuine presence."
    )

    REFLECTION_PROMPTS = [
        {
            "category": "Stress & Overwhelm",
            "title": "Unpacking the Heaviness",
            "prompt": "What is one thing currently on your shoulders that you can grant yourself permission to put down for the next hour?",
        },
        {
            "category": "Grounding & Calm",
            "title": "The Present Anchor",
            "prompt": "Notice your breath for three cycles. What is one physical sensation in this exact moment that feels steady and safe?",
        },
        {
            "category": "Self-Compassion",
            "title": "Talking to a Dear Friend",
            "prompt": "If a loved one came to you feeling exactly what you are feeling right now, what comforting words would you offer them?",
        },
        {
            "category": "Gratitude & Joy",
            "title": "A Glimmer in the Day",
            "prompt": "What was a quiet, ordinary moment from today that brought you a brief sense of peace or comfort?",
        },
    ]

    COPING_EXERCISES = [
        {
            "id": "box-breathing",
            "title": "4-4-4-4 Box Breathing",
            "description": "A clinically proven technique used to regulate the nervous system and calm anxiety.",
            "steps": [
                "Inhale slowly through your nose for 4 seconds.",
                "Gently hold your breath for 4 seconds.",
                "Smoothly exhale through your mouth for 4 seconds.",
                "Rest with your lungs empty for 4 seconds before the next breath.",
            ],
        },
        {
            "id": "5-4-3-2-1-grounding",
            "title": "5-4-3-2-1 Sensory Grounding",
            "description": "Engage all five senses to gently anchor yourself back into the present moment.",
            "steps": [
                "5 things you can SEE around you right now.",
                "4 things you can physically TOUCH or feel.",
                "3 things you can HEAR in your environment.",
                "2 things you can SMELL (or favorite comforting scents).",
                "1 thing you can TASTE (or take a mindful sip of water).",
            ],
        },
        {
            "id": "thought-reframing",
            "title": "Gentle Thought Reframing",
            "description": "A Cognitive Behavioral technique to create space between your feelings and self-critical stories.",
            "steps": [
                "Identify the thought causing distress (e.g., 'I am failing at everything').",
                "Acknowledge the feeling without judgment: 'I am noticing feelings of stress.'",
                "Ask yourself: 'Is this 100% fact, or is it an emotional reaction to feeling tired?'",
                "Replace with a balanced truth: 'I am doing the best I can with the energy I have today.'",
            ],
        },
    ]

    def check_crisis(self, text: str) -> bool:
        lower = text.lower()
        return any(re.search(rf"\b{re.escape(k)}\b", lower) for k in self.CRISIS_KEYWORDS)

    def get_prompts_and_exercises(self) -> Dict[str, Any]:
        return {
            "reflection_prompts": self.REFLECTION_PROMPTS,
            "coping_exercises": self.COPING_EXERCISES,
            "disclaimer": "This supportive AI feature provides active listening, guided reflection, and practical coping exercises. It is not professional therapy or psychiatric diagnosis.",
        }

emotional_service = EmotionalService()
