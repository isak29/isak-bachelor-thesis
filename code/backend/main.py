from db.neo4j_connection import run_query

query = "MATCH (n) RETURN n"


result = run_query(query)

for r in result:
    print(r)

def get_players():
    r = run_query("MATCH (p:PLAYER)  - [r:TEAMMATES] - (a) WHERE p.name = 'LeBron James' RETURN a.name AS Player")
    for r1 in r:
        print (r1)

get_players()











