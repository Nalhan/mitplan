# Use an official Node runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json for both frontend and backend
COPY mitplan-backend/package*.json ./backend/
COPY mitplan-frontend/package*.json ./frontend/

# Install dependencies for both frontend and backend
RUN cd backend && npm install
RUN cd frontend && rm -rf node_modules && npm ci

# Copy the rest of the application code
COPY mitplan-backend ./backend
COPY mitplan-frontend ./frontend

# Copy the .env file to both frontend and backend
COPY .env ./backend/.env
COPY .env ./frontend/.env

# Build the frontend
RUN cd frontend && npm run build

# Expose ports
EXPOSE 3000 5000

# Start both backend and frontend
CMD ["sh", "-c", "cd backend && npm start & cd frontend && npm start"]