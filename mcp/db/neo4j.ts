import neo4j from 'neo4j-driver';

const user = "neo4j"
const password = "lampell1"

export const driver = neo4j.driver(
    'bolt://localhost:7687',
    neo4j.auth.basic(user, password)
)


