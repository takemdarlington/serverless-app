import 'source-map-support/register'
import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { DataAccess } from '../data-layer/data-access'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const dataAccess = new DataAccess()

export async function getTodos(userId: string): Promise<TodoItem[]> {
  return await dataAccess.getTodos(userId)
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updateTodoRequest: UpdateTodoRequest
  ): Promise<TodoUpdate> {

  const updatedTodo: TodoUpdate = {
      name: updateTodoRequest.name,
      dueDate: updateTodoRequest.dueDate,
      done: updateTodoRequest.done
  }
  return await dataAccess.updateTodo(userId, todoId, updatedTodo)
}

export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    userId: string
    ): Promise<TodoItem> {

  const todoId = uuid.v4()

  const newTodo: TodoItem = {
    userId: userId,
    todoId: todoId,
    createdAt: new Date().toISOString(),
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false
  }
  return await dataAccess.createTodo(newTodo)
}

export async function generateUploadUrl(userId:string, todoId:string): Promise<String> {
  return await dataAccess.generateUploadUrl(userId, todoId)
}

export async function deleteTodo(userId: string, todoId: string): Promise<String>{
    return await dataAccess.deleteTodo(userId, todoId)
}

