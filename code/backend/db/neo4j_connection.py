
from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
USER = "neo4j"
PASSWORD = "SalminG9"
AUTH = (USER, PASSWORD)

driver = GraphDatabase.driver(URI, auth= AUTH)
driver.verify_connectivity()

def run_query(query):
    with driver.session() as session:
        result = session.run(query)
        return [record.data() for record in result]
