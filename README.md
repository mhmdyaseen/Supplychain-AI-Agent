# SuperAgent - SupplyChain AI Agent

This repository contains an intelligent Supply Chain AI Agent designed to query both organizational policy documents and internal databases to support daily operations. The system transforms how supply chain professionals interact with their information ecosystem.

## Core Features

1. **Document Processing** – Extracts and returns key insights from policy documents.
2. **Database Querying** – Executes user queries on the organization's database and returns relevant results.
3. **Hybrid Querying** – Handles complex queries that require information from both documents and databases.
4. **Access Control** – Provides role-based and region-based access control.
5. **External Knowledge Integration** – Fetches relevant external information from the web when needed.

## Tech Stack

* **Frontend:** Next.js
* **Backend:** FastAPI
* **Agent Framework:** Agno
* **LLM:** Gemini
* **Embedding Model:** Google’s `embedding-001`

## Backend Structure

* `main.py` – Main FastAPI application
* `config.py` – Configuration settings
* `utils.py` – Utility functions
* `schemas.py` – Pydantic models
* `database/` – Contains `models.py`, vector database, and memory storage
* `data/` – Datasets used in development or retrieval
* `agent/` – Contains the core agent logic and classes
* `notebooks/` – Jupyter notebooks for dataset preprocessing
* `users.db` – SQLite database storing user, chat, and session data
* `user_init.py` – Script for user initialization

## Frontend Overview

The frontend is developed using **Next.js** and features a modern ChatGPT-like interface. Users can interact with the agent, create and delete chat sessions, and view their session history. The directory includes all necessary components for rendering user and agent responses.
