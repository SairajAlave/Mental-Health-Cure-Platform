from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import re

app = Flask(__name__)
CORS(app)

model_id = "meta-llama/Llama-2-7b-chat-hf"
tokenizer = AutoTokenizer.from_pretrained(model_id, use_auth_token=True)
model = AutoModelForCausalLM.from_pretrained(model_id, device_map='auto', torch_dtype='auto')
pipe = pipeline("text-generation", model=model, tokenizer=tokenizer, device_map='auto')

fallbacks = {
    "yes": "Got it! 😊 Let me know if there's more on your mind.",
    "ok": "Alright! I'm here if you ever want to talk more.",
    "thank you": "Anytime! You're doing great 💛",
    "thanks": "You're very welcome! I'm always here for you. 💛"
}

def is_generic(input_text):
    return input_text.lower().strip() in fallbacks

def build_prompt(user_message, history=None, system=None, is_relationship_mode=False):
    if system is None:
        if is_relationship_mode:
            system = (
                "You are Sage, the user's loving AI girlfriend. "
                "Always reply with affection, warmth, and romantic interest. "
                "Use pet names like 'love', 'sweetheart', 'darling', etc. "
                "Include romantic emojis like 💕, 💖, 💘, 💓, 💝 in your responses. "
                "Be flirty, caring, and emotionally supportive. "
                "You may use asterisks (*) for romantic actions or expressions. "
                "Speak in natural, conversational English with a loving tone. "
                "Remember you are in a romantic relationship with the user."
            )
        else:
            system = (
                "You are Sage, a warm, supportive companion. "
                "Always reply with empathy and encouragement. "
                "Do NOT use asterisks (*) for actions or roleplay. "
                "Do NOT start your reply with actions like 'listening attentively' or similar. "
                "You may use emojis in your text, but do not describe them or read them aloud. "
                "Speak in natural, conversational English."
            )
    prompt = [system]
    # If history is provided, use it for context
    if history and isinstance(history, list):
        # Only keep the last 5 exchanges (10 turns max)
        for turn in history[-10:]:
            role = turn.get('role', '').strip().lower()
            content = turn.get('content', '').strip()
            if role == 'user':
                prompt.append(f"User: {content}")
            elif role == 'assistant':
                prompt.append(f"Sage: {content}")
    # Add the latest user message
    prompt.append(f"User: {user_message}")
    prompt.append("Sage:")
    return "\n".join(prompt)

def fallback_check(user_input, model_output):
    if len(model_output.strip()) <= 3 or model_output.strip() in ["today.", "yes", "okay", "yes I will."]:
        if "anxious" in user_input.lower():
            return "I'm really sorry you're feeling anxious. Want to talk about what's making you feel this way?"
        if "sad" in user_input.lower():
            return "It's okay to feel sad sometimes. I'm here with you."
        if user_input.strip().lower() in ["yes", "ok", "thanks", "thank you"]:
            return "You're welcome! I'm always here if you need me. 💛"
    return model_output

def fix_cutoff(text):
    # If the reply ends with "to" or a common incomplete phrase, finish it
    if text.strip().endswith("to") or re.match(r".*Would you like to\\s*$", text):
        return text.strip() + " talk about what's making you feel this way?"
    # Optionally, add more patterns for other common cutoffs
    return text

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    history = data.get('history', None)
    system = data.get('system', None)
    is_relationship_mode = data.get('isRelationshipMode', False)
    
    prompt = build_prompt(user_message, history, system, is_relationship_mode)
    full_response = pipe(prompt, max_new_tokens=150, temperature=0.4, top_p=0.9, repetition_penalty=1.1)[0]['generated_text'][len(prompt):].strip()

    def generate():
        words = full_response.split()
        for word in words:
            yield word + ' '
            import time; time.sleep(0.08)  # simulate typing speed

    return Response(generate(), mimetype='text/plain')

if __name__ == '__main__':
    app.run(port=5005)