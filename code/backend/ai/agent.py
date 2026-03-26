import os
from openai import OpenAI
from dotenv import load_dotenv

from db.neo4j_connection import get_schema


load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_cypher(question):
    labels, rels = get_schema()
    format_schema_for_prompt(labels, rels)


    prompt = f"""
    You are an expert in Neo4j cypher.
    
    Database schema, the database is about nba players, teams and coaches:
    - PLAYER nodes with properties name, height.
    - Relationships: TEAMMATES between players, COACH, PLAYED_FOR, PLAYED_AGAINST
    
    RULES:
    - Use label: PLAYER
    - property: name
    - property: height
    - Relationships: TEAMMATES
    - Always use MATCH
    - NEVER use DELETE
    
    IMPORTANT RULES:
    - If the question asks for all nodes of a type, do NOT use relationships
    - Use direct node matching when possible
    
    CRITICAL:
    - Always use labels (e.g. :TEAM, :PLAYER)
    - NEVER use MATCH (n) without label
    
    Example:
    MATCH (p:PLAYER {{name: "LeBron James"}})-[:TEAMMATES]-(t)
    RETURN t.name
    
    Convert this question into a cypher query.
    Only return the query nothing else.
    
    Question:
    {question}
    
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages = [{"role": "user", "content": prompt}]
    )
    raw = response.choices[0].message.content.strip()
    print("AI RESPONSE:", raw)

    cypher = clean_cypher(raw)

    print("CLEAN CYPHER:", cypher)

    return cypher


def clean_cypher(query):
    # ta bort markdown
    query = query.replace("```cypher", "").replace("```", "")

    # trim whitespace
    query = query.strip()

    return query


def format_schema_for_prompt(labels, rels):
    schema = "Database schema:\n"

    schema += "Nodes:\n"
    for l in labels:
        schema += f"- {l}\n"

    schema += "\nRelationships:\n"
    for r in rels:
        schema += f"- {r}\n"

    return schema

