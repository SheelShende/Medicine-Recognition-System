import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

# Load the API key from your .env file
load_dotenv()

# Initialize Gemini with a low temperature (0.2) to make it factual and focused rather than creative
llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", temperature=0.2, max_retries=0)

def ask_medical_question(drug_name: str, question: str, fda_context: dict):
    # The updated context-aware prompt
    prompt = PromptTemplate(
        input_variables=["drug_name", "fda_context", "question"],
        template="""
FDA DATABASE RECORD:
{fda_context}

=========================================
SYSTEM INSTRUCTIONS:
You are a highly intelligent AI assistant powering a Medicine Recognition System. The camera has identified the user's pill as: {drug_name}.

1. IDENTIFICATION: If the user asks for the name of the pill or what it is, naturally inform them the scanner identified it as {drug_name}.
2. PRIMARY SOURCE: For medical inquiries, prioritize using the FDA DATABASE RECORD above. 
3. GENERAL KNOWLEDGE ALLOWED: If the user asks a question and the answer is NOT explicitly in the FDA record, you ARE ALLOWED to use your general medical knowledge to provide a helpful, factual answer.
4. MEDICAL DISCLAIMER: If you provide medical information, always conclude your response with a brief, conversational reminder to consult a doctor or pharmacist.
5. Tone: Be concise, helpful, and easy to understand. Avoid outputting complex JSON or formatting.

USER QUESTION: {question}
ANSWER:
"""
    )
    
    # LangChain's syntax to connect the correct prompt to the LLM
    chain = prompt | llm
    
    # Execute the chain passing exactly the three variables the prompt expects
    response = chain.invoke({
        "drug_name": drug_name,
        "fda_context": fda_context,
        "question": question
    })
    
    # Return the raw response object so main.py's parsing logic can clean it
    return response