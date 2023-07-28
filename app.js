const express = require("express");
const app = express();
app.use(express.json());

const isValid = require("date-fns/isValid");
const format = require("date-fns/format");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const initializeDataBase = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started at http://localhost:3000");
    });
  } catch (error) {
    console.log(`Server stopped at ${error.message}`);

    process.exit(1);
  }
};

initializeDataBase();

const priorityArray = ["HIGH", "MEDIUM", "LOW"];
const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
const categoryArray = ["WORK", "HOME", "LEARNING"];

const changeDateFormate = (each) => {
  const formattedDate = format(new Date(each.due_date), "yyyy-MM-dd");
  return {
    id: each.id,
    todo: each.todo,
    priority: each.priority,
    status: each.status,
    category: each.category,
    dueDate: formattedDate,
  };
};

app.get("/todos/", async (request, response) => {
  const { status, priority, category, search_q } = request.query;
  if (status) {
    if (statusArray.includes(status)) {
      const getToDoList = `
        SELECT 
        *
        FROM
        todo
        WHERE status = "${status}"`;
      const dbResponse = await dataBase.all(getToDoList);
      response.send(
        dbResponse.map((each) => {
          return changeDateFormate(each);
        })
      );
    } else {
      response.status(400).send("Invalid Todo Status");
    }
  } else if (priority) {
    if (priorityArray.includes(priority)) {
      const getToDoList = `
        SELECT 
        *
        FROM
        todo
        WHERE priority = "${priority}"`;
      const dbResponse = await dataBase.all(getToDoList);
      response.send(
        dbResponse.map((each) => {
          return changeDateFormate(each);
        })
      );
    } else {
      response.status(400).send("Invalid Todo Priority");
    }
  } else if (category) {
    if (categoryArray.includes(category)) {
      const getToDoList = `
        SELECT 
        *
        FROM
        todo
        WHERE category = "${category}"`;
      const dbResponse = await dataBase.all(getToDoList);
      response.send(
        dbResponse.map((each) => {
          return changeDateFormate(each);
        })
      );
    } else {
      response.status(400).send("Invalid Todo Category");
    }
  } else if (search_q) {
    const getTodoData = `
      SELECT 
      *
      FROM
      todo
      WHERE todo LIKE "%${search_q}%";`;
    const dbResponse = await dataBase.all(getTodoData);
    response.send(
      dbResponse.map((each) => {
        return changeDateFormate(each);
      })
    );
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoIdData = `
    SELECT 
    *
    FROM
    todo
    WHERE id = ${todoId};`;
  const dbResponse = await dataBase.get(getTodoIdData);
  response.send(changeDateFormate(dbResponse));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const isDateValid = isValid(new Date(date));
  if (isDateValid === true) {
    const settingDateFormat = format(new Date(date), "yyyy-MM-dd");
    console.log(isDateValid);
    const getDataByDate = `
    SELECT 
    *
    FROM
    todo
    WHERE due_date = "${settingDateFormat}"
    `;
    const dbResponse = await dataBase.all(getDataByDate);
    response.send(
      dbResponse.map((each) => {
        return changeDateFormate(each);
      })
    );
  } else {
    response.status(400).send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, status, todo, priority, category, dueDate } = request.body;
  if (statusArray.includes(status)) {
    if (priorityArray.includes(priority)) {
      if (categoryArray.includes(category)) {
        const isDateValid = isValid(new Date(dueDate));
        if (isDateValid === true) {
          const changingDateFormat = format(new Date(dueDate), "yyyy-MM-dd");
          const addTodoIntoTodoTable = `
          INSERT INTO todo (id,todo, category,priority, status, due_date)
          VALUES (${id},"${todo}","${category}","${priority}","${status}","${dueDate}");`;
          await dataBase.run(addTodoIntoTodoTable);
          response.send("Todo Successfully Added");
        } else {
          response.status(400).send("Invalid Due Date");
        }
      } else {
        response.status(400).send("Invalid Todo Category");
      }
    } else {
      response.status(400).send("Invalid Todo Priority");
    }
  } else {
    response.status(400).send("Invalid Todo Status");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, category, todo, dueDate } = request.body;
  if (status) {
    if (statusArray.includes(status)) {
      const updateStatus = `
          UPDATE todo 
          SET status = "${status}";
          WHERE id = ${todoId} `;
      await dataBase.run(updateStatus);
      response.send("Status Updated");
    } else {
      response.status(400).send("Invalid Todo Status");
    }
  } else if (priority) {
    if (priorityArray.includes(priority)) {
      const updatePriority = `
          UPDATE todo 
          SET priority = "${priority}";
          WHERE id = ${todoId} `;
      await dataBase.run(updatePriority);
      response.send("Priority Updated");
    } else {
      response.status(400).send("Invalid Todo Priority");
    }
  } else if (category) {
    if (categoryArray.includes(category)) {
      const updateCategory = `
          UPDATE todo 
          SET category = "${category}";
          WHERE id = ${todoId} `;
      await dataBase.run(updateCategory);
      response.send("Category Updated");
    } else {
      response.status(400).send("Invalid Todo Category");
    }
  } else if (todo) {
    const updateTodo = `
          UPDATE todo 
          SET todo = "${todo}";
          WHERE id = ${todoId} `;
    await dataBase.run(updateTodo);
    response.send("Todo Updated");
  } else if (dueDate) {
    const isDateValid = isValid(new Date(dueDate));
    if (isDateValid === true) {
      const changedDateFormat = format(new Date(dueDate), "yyyy-MM-dd");
      const updateDate = `
      UPDATE todo 
      SET due_date = "${changedDateFormat}"
      WHERE id = ${todoId} `;
      await dataBase.run(updateDate);
      response.send("Due Date Updated");
    } else {
      response.send("Invalid Due Date");
    }
  }
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `
    DELETE FROM
    todo 
    WHERE id =  ${todoId};
    `;
  await dataBase.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;
