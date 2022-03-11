import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { getTodos } from '../../business-logic/todo'

import { getUserId } from '../utils'

const logger = createLogger('createTodo')

export const handler = middy (async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // TODO: Get all TODO items for a current user

  logger.info('Processing event: ', event)
  const userId = getUserId(event);

  const todoItems = await getTodos(userId)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      items: todoItems
    })
  }
})

handler.use(
  cors({
    'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
  })
)