import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

# Load the API key from your .env file
load_dotenv()

# Initialize Gemini with a low temperature (0.2) to make it factual and focused rather than creative
llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", temperature=0.2, max_retries=0)

def ask_medical_question(drug_name: str, question: str, fda_context: dict) -> str:
    # The strict RAG guardrail prompt
    template = """
    You are a highly accurate pharmaceutical AI assistant.
    You must answer the user's question about {drug_name} based ONLY on the provided official FDA context below.
    If the FDA context does not contain the answer, you must explicitly state: "I cannot verify this information based on the official FDA label. Please consult a pharmacist or doctor."
    Do NOT invent or hallucinate medical advice.

    FDA Context:
    Warnings: {warnings}
    Indications: {indications}

    User Question: {question}

    Answer:
    """
    
    prompt = PromptTemplate(
        input_variables=["drug_name", "warnings", "indications", "question"],
        template=template
    )
    
    # LangChain's syntax to connect the prompt to the LLM
    chain = prompt | llm
    
    # Execute the chain
    response = chain.invoke({
        "drug_name": drug_name,
        "warnings": fda_context.get("warnings", "None provided."),
        "indications": fda_context.get("indications", "None provided."),
        "question": question
    })
    
    return response.content