# Mitplan

Mitplan is a web app designed to make planning raid cooldowns simple.


## Features
- Easy-to-use interface for planning raid cooldowns
  - Flexible placement of cooldowns
  - Intuitive drag-and-drop functionality
  - Visual feedback on cooldown availability
- Real-time collaboration similar to Google Docs


# Development

## Setup

To get started, clone the repository and write your own .env file based on the .env.example file. You probably won't need to change anything.
Make sure to write your own secrets/db_password.txt file.

Write a docker-compose.yml file, I provided an example in docker-compose-example.yml.
You can bind mount your local folders to the containers to edit the code live.


## Running

Run `docker compose build` in the root directory to build the mitplan container.
Run `docker compose up` to start the containers. 

The page will be available at port 3000.









