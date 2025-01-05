export const Schemas = {
  GetUsersResponse: {
    id: { type: 'number' },
    name: { type: 'string' },
    age: { type: 'number' },
    email: { type: 'string' },
    phone: { type: 'string' },
  },
  PostUsersResponse: [],
}

export const API = {
  users: {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    query: {
      id: 'number',
      name: 'string',
      age: 'number',
    },
    optionalQuery: {
      email: 'string',
      phone: 'string',
    },
    body: {
      POST: {
        name: 'string',
        age: 'number',
        email: 'string',
        phone: 'string',
      },
      DELETE: {
        id: 'number',
      },
    },
    optionalBody: {
      PUT: {
        name: 'string',
        age: 'number',
        email: 'string',
        phone: 'string',
      },
    },
    response: {
      GET: Schemas.GetUsersResponse,
    },
  },
}
