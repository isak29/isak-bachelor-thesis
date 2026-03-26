
from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()
URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")
AUTH = (USER, PASSWORD)

driver = GraphDatabase.driver(URI, auth= AUTH)
driver.verify_connectivity()

def run_query(query):
    with driver.session() as session:
        result = session.run(query)
        return [record.data() for record in result]

def get_schema():
    labels = run_query("CALL db.labels()")
    rels = run_query("CALL db.relationshipTypes()")

    label_list = [l["label"] for l in labels]
    rel_list = [r["relationshipType"] for r in rels]

    return label_list, rel_list

def format_schema_for_prompt(labels, rels):
    schema = "Database schema:\n"

    schema += "Nodes:\n"
    for l in labels:
        schema += f"- {l}\n"

    schema += "\nRelationships:\n"
    for r in rels:
        schema += f"- {r}\n"

    return schema

