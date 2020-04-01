const express = require('express');
const graphqlHTTP = require('express-graphql');
const {buildSchema} = require('graphql');
const crypto = require('crypto');

const fakeDatabase = {};

// If Message had any complex fields, we'd put them on this object.
class Message {
  constructor (id, {content, author}) {
    this.id = id;
    this.content = content;
    this.author = author;
  }
}

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
  input MessageInput {
    content: String
    author: String
  }

  type Message {
    id: ID!
    content: String
    author: String
  }

  type RandomDie {
    numSides: Int!
    rollOnce: Int!
    roll(numRolls: Int!): [Int]
  }

  type Query {
    borgMe: String
    getDie(numSides: Int): RandomDie
    getMessage(id: ID!): Message
    hello: String
    rollDice(max: Int!): Int
  }

  type Mutation {
    createMessage(input: MessageInput): Message
    updateMessage(id: ID!, input: MessageInput): Message
  }  
`);

// The root provides a resolver function for each API endpoint
const root = {
  borgMe: () => {
    return Math.random() < 0.5 ? 'Resistence is futile' : 'You will be one with the Borg';
  },
  createMessage: ({input}) => {
    // Create a random id for our "database".
    const id = crypto.randomBytes(10).toString('hex');

    fakeDatabase[id] = input;
    return new Message(id, input);
  },
  hello: () => {
    return 'Hello world!';
  },
  getDie: ({numSides}) => {
    return new RandomDie(numSides || 6);
  },
  getMessage: ({id}) => {
    if (!fakeDatabase[id]) {
      throw new Error('getMessage() - No message exists with id ' + id);
    }
    return new Message(id, fakeDatabase[id]);
  },
  rollDice: (max) => {
    const min = 1;
    return Math.floor(Math.random() * (10 - min + 1)) + min;
  },
  updateMessage: ({id, input}) => {
    if (!fakeDatabase[id]) {
      throw new Error('updateMessage() - No message exists with id ' + id);
    }
    // This replaces all old data, but some apps might want partial update.
    fakeDatabase[id] = input;
    return new Message(id, input);
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