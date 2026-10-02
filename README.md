#videourl
https://drive.google.com/file/d/1BbYfLWY4qrLYzezXpRhPIzwGj92Sx74x/view?usp=sharing

#Githuburl
https://github.com/HebaMorar/expense-tracker
#livesite
 https://hebamorar.github.io/expense-tracker/

# Expense Tracker

<!-- Write 1-2 sentences: what does your app do? -->

An interactive application for managing daily expenses and spending, allowing users to track expenses and monitor budgets through multiple categories, with data analysis via an interactive dashboard and real-time reports.


## How to run

<!-- Write the exact steps someone needs to run your project from scratch.
     Assume they have Node.js, PostgreSQL, and VS Code, and nothing else.
     Include: creating the database, running schema.sql, writing the .env file,
     starting the backend, and opening the frontend. -->

**Backend**

1- open  project  folder in vs code

2-create database and table in postgress

3-create .env file in backend folder and added connection setting ex: port,host,password,user .... 

4- in terminal  write ==>
install npm
and 
start npm or node server.js ---> run server (node.js)

**frontend**
5- OPEN FOLDER FRONTEND (html,css,js)
6- cheack port APIURL in server.js
7- run index.html in live server



## Features

<!-- List what your app can do. Tick what you finished. -->

- [Y] Add an expense (with validation)
- [Y] Delete an expense
- [Y] Edit an expense
- [Y] Filter by categorymonth, and search by title
- [Y] Summary cards (total, count, highest)
- [Y] Data is saved in a PostgreSQL database
- [Y]Dark Mode
- [y] table column sorting
- [Y] csv data export
- [Y] interactive category Chart (Chart.js)
 

## Screenshots

<!-- Add 2-3 screenshots of your app (desktop and mobile). -->
folder screenshot 


## What was the hardest part?


<!-- A short paragraph: what got you stuck, and how did you solve it? -->

1- Sorting/filtering:
Especially since the data is fetched from an API, I had to synchronize everything so they don't interfere with each other's execution. I implemented the applyFilter function to handle sorting, filtering (category, month), and searching without them affecting one another.

2- Aggregating all the data to represent it instantly using Chart.js, ensuring there is no data duplication. Therefore, I built a renderChart function that aggregates the expenses, calculates their totals, checks if a previous instance exists to destroy it, and then renders the new version.

3- Ngrok
Testing the application on a mobile device and ensuring the API, server, and database are all working properly. There were fetch issues that used to occur either on mobile or localhost because the IP address differs between devices. Therefore, I used Ngrok to run the site. Of course, there were some fetch issues, so I modified the code in the server.js file by adding express.static and updating the API URLs to api/expenses, so that I could open the website from any device
