import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'



import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { todoExists } from '../utils'
import { getUserId } from '../utils'
import { updateTodo } from '../../business-logic/todo'



export const handler = middy (async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  const userId = getUserId(event);

  const validTodoId = await todoExists(userId, todoId)

  if (!validTodoId) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Todo item does not exist'
      })
    }
  }

  const newItem = updateTodo(userId, todoId, updatedTodo)
  

  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
        newItem
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)