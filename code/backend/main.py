from time import sleep

from db.neo4j_connection import run_query
from ai.agent import generate_cypher

import time

"""query = "MATCH (n) RETURN n"


result = run_query(query)

for r in result:
    print(r)

def get_players():
    r = run_query("MATCH (p:PLAYER)  - [r:TEAMMATES] - (a) WHERE p.name = 'LeBron James' RETURN a.name AS Player")
    for r1 in r:
        print (r1)

get_players()"""

def ask_question(question):
    cypher = generate_cypher(question)
    result = run_query(cypher)
    return result

def format_answer(result):
    if not result:
        return "No results found."

    values = []

    for r in result:
        values.extend(list(r.values()))

    return ", ".join(str(v) for v in values)



q = ask_question("Can you name the 3 players the with highest weight?")
quest = ask_question(q)
answer = format_answer(quest)
time.sleep(1)


print("Result:", answer)













