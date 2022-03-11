import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)
//import our models
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { createLogger } from '../utils/logger'

const logger = createLogger('createTodo')

export class DataAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly bucketName = process.env.IMAGES_S3_BUCKET
    ) {
  }

  // To create todo
  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise()

    return todoItem
  }

  // To get Todos
  async getTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Getting todos')
    

    const result = await this.docClient.query({
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
    }).promise()

    const items = result.Items
    return items as TodoItem[]
  }

// To update todo
  async updateTodo(userId: string, todoId: string, todoUpdate: TodoUpdate): Promise<TodoUpdate>{
    var params = {
      TableName: this.todosTable,
      Key:{
        userId: userId,
        todoId: todoId
      },
      UpdateExpression: "set #n = :r, dueDate=:p, done=:a",
      ExpressionAttributeValues:{
          ":r":todoUpdate.name,
          ":p":todoUpdate.dueDate,
          ":a":todoUpdate.done
      },
      ExpressionAttributeNames:{
        "#n": "name"
      },
      ReturnValues:"UPDATED_NEW"
    };
  
    await this.docClient.update(params).promise()

    return todoUpdate

  }

    
  // To delete todo
  async deleteTodo(userId: string, todoId: string): Promise<String> {
    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        userId: userId,
        todoId: todoId
      }
    }).promise()

    return ''
  }


// To generate upload url
  async generateUploadUrl(userId:string, todoId:string): Promise<String> {

    const url = getUploadUrl(todoId, this.bucketName)

    const attachmentUrl:string = 'https://' + this.bucketName + '.s3.amazonaws.com/' + todoId

    var params = {
      TableName: this.todosTable,
      Key:{
        userId: userId,
        todoId: todoId
      },
      UpdateExpression: "set attachmentUrl = :r",
      ExpressionAttributeValues:{
          ":r":attachmentUrl
      },
      ReturnValues:"UPDATED_NEW"
  };

    await this.docClient.update(params).promise()

    return url
  }
    
}

// To get url for image upload
function getUploadUrl(todoId: string, bucketName: string): string {

  const urlExpiration = process.env.SIGNED_URL_EXPIRATION

  const s3 = new XAWS.S3({
    signatureVersion: 'v4'
  })

  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: urlExpiration
  })
}


  
// create our database client
function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }
  return new XAWS.DynamoDB.DocumentClient()
}