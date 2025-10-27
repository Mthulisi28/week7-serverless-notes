const AWS = require('aws-sdk');
const { v4: uuid } = require('uuid');
const dynamo = new AWS.DynamoDB.DocumentClient({ region: 'us-east-2' });
const TABLE = process.env.TABLE_NAME;

const log = (level, msg, data) => console.log(JSON.stringify({ level, msg, ...data, timestamp: new Date().toISOString() }));

exports.createNote = async (event) => {
  const userId = event.requestContext.authorizer?.userId || 'test-user-123';
  const body = JSON.parse(event.body);
  const note = { userId, noteId: uuid(), title: body.title, content: body.content, createdAt: new Date().toISOString() };
  await dynamo.put({ TableName: TABLE, Item: note }).promise();
  log('info', 'note-created', { userId, noteId: note.noteId });
  return { statusCode: 201, body: JSON.stringify(note) };
};

exports.getNotes = async (event) => {
  const userId = event.requestContext.authorizer?.userId || 'test-user-123';
  const res = await dynamo.query({ TableName: TABLE, KeyConditionExpression: 'userId = :uid', ExpressionAttributeValues: { ':uid': userId } }).promise();
  log('info', 'notes-listed', { userId, count: res.Items.length });
  return { statusCode: 200, body: JSON.stringify(res.Items) };
};

exports.updateNote = async (event) => {
  const userId = event.requestContext.authorizer?.userId || 'test-user-123';
  const noteId = event.pathParameters.noteId;
  const body = JSON.parse(event.body);
  await dynamo.update({
    TableName: TABLE,
    Key: { userId, noteId },
    UpdateExpression: 'SET title = :t, content = :c',
    ExpressionAttributeValues: { ':t': body.title, ':c': body.content },
    ConditionExpression: 'attribute_exists(userId)'
  }).promise();
  log('info', 'note-updated', { userId, noteId });
  return { statusCode: 200, body: JSON.stringify({ message: 'updated' }) };
};

exports.deleteNote = async (event) => {
  const userId = event.requestContext.authorizer?.userId || 'test-user-123';
  const noteId = event.pathParameters.noteId;
  await dynamo.delete({ TableName: TABLE, Key: { userId, noteId } }).promise();
  log('info', 'note-deleted', { userId, noteId });
  return { statusCode: 200, body: JSON.stringify({ message: 'deleted' }) };
};