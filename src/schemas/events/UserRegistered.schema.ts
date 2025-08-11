export const UserRegisteredSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string' },
    email: { type: 'string', format: 'email' },
  },
  required: ['userId', 'email'],
  additionalProperties: false,
};

