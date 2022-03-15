const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found." });
  }

  request.user = user;

  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  if (!name) return response.sendStatus(400);
  if (!username) return response.sendStatus(400);

  const userAlreadyExists = users.some((user) => user.username === username);
  if (userAlreadyExists) {
    return response.status(400).json({ error: "User already exists." });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;
  const { title, deadline } = request.body;

  const todoExists = user.todos.find((todo) => todo.id === id);
  if (!todoExists) {
    return response.status(404).json({ error: "Todo not found." });
  }

  const updatedTodos = user.todos.map((todo) => {
    if (todo.id === id) {
      return {
        ...todo,
        title,
        done: false,
        deadline: new Date(deadline),
      };
    }

    return todo;
  });

  user.todos = updatedTodos;

  return response
    .status(201)
    .json({ title, done: false, deadline: new Date(deadline) });
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const todoExists = user.todos.find((todo) => todo.id === id);
  if (!todoExists) {
    return response.status(404).json({ error: "Todo not found." });
  }

  const updatedTodos = user.todos.map((todo) => {
    if (todo.id === id) {
      return {
        ...todo,
        done: true,
      };
    }

    return todo;
  });

  user.todos = updatedTodos;

  return response.status(201).json(user.todos.find((todo) => todo.id === id));
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const todoExists = user.todos.find((todo) => todo.id === id);
  if (!todoExists) {
    return response.status(404).json({ error: "Todo not found." });
  }

  const updatedTodos = user.todos.filter((todo) => {
    if (todo.id === id) {
      return false;
    }

    return true;
  });

  user.todos = updatedTodos;

  return response.sendStatus(204);
});

module.exports = app;
