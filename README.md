# Recap Plan

A smart, AI-powered personal planning and learning assistant designed to help you organize your life and retain knowledge. Built with a focus on "Vibe Coding" — prioritizing aesthetics, fluidity, and an intuitive user experience.

> **Note**: This project was built using **Vibe Coding** techniques, leveraging advanced AI agents to rapidly prototype, iterate, and polish the application.

## 🌟 Features

-   **Daily, Weekly, Monthly, & Yearly Planning**: Structured planning interface to break down your goals.
-   **AI-Powered Breakdown**:
    -   Chat with the AI to transform vague ideas into concrete plans.
    -   Automatically splits tasks into daily schedules (Morning/Afternoon/Evening).
-   **Spaced Repetition Learning**:
    -   Track what you learn.
    -   Smart reminders at scientifically backed intervals (1, 3, 7, 15, 30 days) to ensure retention.
-   **Local Data Privacy**: All your planning and learning data is stored locally on your machine.
-   **Modern & Responsive Design**: A beautiful, dark-mode first UI built with React and TailwindCSS.

## 🚀 Getting Started

### Prerequisites

-   **Node.js**: [Download here](https://nodejs.org/)
-   **Python 3.8+**: [Download here](https://www.python.org/)
-   **OpenAI API Key**: Required for the AI planning features. Get one [here](https://platform.openai.com/).

### Installation

1.  **Clone the repository** (or download usage):
    ```bash
    git clone https://github.com/yourusername/recap-plan.git
    cd recap-plan
    ```

2.  **Set up the Environment**:
    
    macOS / Linux:
    ```bash
    # Run the automated launch script which sets up everything
    ./Launch\ Recap\ Plan.command
    ```
    
    *Alternatively, manual setup:*
    ```bash
    # Backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r backend/requirements.txt
    
    # Frontend
    cd frontend
    npm install
    ```

3.  **Configure API Key**:
    -   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    -   Open `.env` and paste your API key:
        ```
        OPENAI_API_KEY=sk-your-key-here
        ```

### Running the App

The easiest way is to double-click `Launch Recap Plan.command` on macOS.

For manual start:

1.  **Backend** (Terminal 1):
    ```bash
    source venv/bin/activate
    cd backend
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```

2.  **Frontend** (Terminal 2):
    ```bash
    cd frontend
    npm run dev
    ```

## 🛡️ Privacy & Data

-   **Database**: Your data is stored in `data/learning_data.json` and `data/planning_data.json`.
-   **Git Ignore**: The `.gitignore` file is configured to exclude your personal data and API keys. **Do not commit your `.env` file or the `data/` directory.**

## 🛠️ Tech Stack

-   **Frontend**: React, Vite, TailwindCSS, Framer Motion
-   **Backend**: FastAPI, Python
-   **AI**: OpenAI GPT-4o-mini
-   **Storage**: Local JSON filesystem

## 🤝 Contributing

Feel free to fork this repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

---

