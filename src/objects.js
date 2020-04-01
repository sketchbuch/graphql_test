const express = require('express');
const graphqlHTTP = require('express-graphql');
const {buildSchema} = require('graphql');

class RandomDie {
  constructor (numSides) {
    this.numSides = numSides;
  }

  rollOnce() {
    return 1 + Math.floor(Math.random() * this.numSides);
  }

  roll({numRolls}) {
    const output = [];
    for (const i = 0; i < numRolls; i++) {
      output.push(this.rollOnce());
    }
    return output;
  }
}

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type RandomDie {
    numSides: Int!
    rollOnce: Int!
    roll(numRolls: Int!): [Int]
  }

  type Query {
    borgMe: String
    getDie(numSides: Int): RandomDie
    hello: String
    rollDice(max: Int!): Int
  }
`);

// The root provides a resolver function for each API endpoint
const root = {
  borgMe: () => {
    return Math.random() < 0.5 ? 'Resistence is futile' : 'You will be one with the Borg';
  },
  hello: () => {
    return 'Hello world!';
  },
  getDie: ({numSides}) => {
    return new RandomDie(numSides || 6);
  },
  rollDice: (max) => {
    const min = 1;
    return Math.floor(Math.random() * (10 - min + 1)) + min;
  },
};

const app = express();

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

app.listen(4000);

console.log('Running a GraphQL API server at http://localhost:4000/graphql');