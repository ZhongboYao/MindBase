from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from datetime import datetime, timedelta
import scheduler
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


app = FastAPI()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
DATA_FILE = os.path.join(DATA_DIR, "learning_data.json")
PLANNING_FILE = os.path.join(DATA_DIR, "planning_data.json")

class LearningItem(BaseModel):
    id: Optional[str] = None
    date: str  # The date the item was learned
    content: str
    completed: bool = False  # Deprecated, kept for backward compatibility
    completed_dates: Optional[List[str]] = []  # List of dates where recap was completed
    recap_dates: Optional[List[str]] = []  # List of dates when recap should occur

class PhasedPlanRequest(BaseModel):
    task_description: str
    deadline: str  # Format: YYYY-MM-DD
    start_date: Optional[str] = None  # Format: YYYY-MM-DD, defaults to today

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "gpt-4o-mini"  # Default model

class ChatResponse(BaseModel):
    message: str

class ExtractPlanRequest(BaseModel):
    conversation: List[ChatMessage]
    start_date: str
    deadline: str
    model: Optional[str] = "gpt-4o-mini"

class PlanDay(BaseModel):
    date: str
    section: str  # morning, afternoon, or evening
    tasks: List[str]

class PhasedPlanResponse(BaseModel):
    plans: List[PlanDay]

# Models for persistent planning data
class Plan(BaseModel):
    id: str
    section: str
    content: str
    date: str
    completed: bool = False
    groupId: Optional[str] = None

class TaskGroup(BaseModel):
    id: str
    taskName: str
    planIds: List[str]
    createdAt: str

class PlanningData(BaseModel):
    dailyPlans: List[Plan] = []
    weeklyPlans: List[Plan] = []
    monthlyPlans: List[Plan] = []
    yearlyPlans: List[Plan] = []
    taskGroups: List[TaskGroup] = []
    monthlyTaskGroups: List[TaskGroup] = []
    yearlyTaskGroups: List[TaskGroup] = []


def load_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_data(data):
    # Ensure directory exists before saving
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

def load_planning_data():
    if not os.path.exists(PLANNING_FILE):
        return PlanningData().dict()
    with open(PLANNING_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return PlanningData().dict()

def save_planning_data(data):
    # Ensure directory exists before saving
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        
    with open(PLANNING_FILE, "w") as f:
        json.dump(data, f, indent=4)

@app.on_event("startup")
def startup_event():
    # Ensure data directory and file exist
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    if not os.path.exists(DATA_FILE):
        save_data([])
    if not os.path.exists(PLANNING_FILE):
        save_planning_data(PlanningData().dict())

@app.get("/api/learnings", response_model=List[LearningItem])
def get_learnings():
    return load_data()

@app.post("/api/learnings", response_model=LearningItem)
def add_learning(item: LearningItem):
    data = load_data()
    # Simple ID generation
    item.id = str(len(data) + 1)
    
    # Calculate recap dates based on spaced repetition (1, 3, 7, 15, 30 days)
    learning_date = datetime.strptime(item.date, "%Y-%m-%d")
    intervals = [1, 3, 7, 15, 30]
    item.recap_dates = [(learning_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in intervals]
    
    # Initialize completed_dates as empty list
    if not item.completed_dates:
        item.completed_dates = []
    
    data.append(item.dict())
    save_data(data)
    return item

@app.patch("/api/learnings/{item_id}")
def update_learning_status(item_id: str, completed: bool, date: str = None):
    """
    Update the completion status for a learning item on a specific date.
    If date is provided, toggle that date in completed_dates.
    The 'completed' parameter is kept for backward compatibility but deprecated.
    """
    data = load_data()
    for item in data:
        if item["id"] == item_id:
            # Initialize completed_dates if it doesn't exist (backward compatibility)
            if "completed_dates" not in item:
                item["completed_dates"] = []
            
            if date:
                # Toggle completion for this specific date
                if completed:
                    # Add the date if not already in the list
                    if date not in item["completed_dates"]:
                        item["completed_dates"].append(date)
                else:
                    # Remove the date if it's in the list
                    if date in item["completed_dates"]:
                        item["completed_dates"].remove(date)
            else:
                # Fallback to old behavior for backward compatibility
                item["completed"] = completed
            
            save_data(data)
            return {"message": "Status updated", "item": item}
    raise HTTPException(status_code=404, detail="Item not found")

@app.delete("/api/learnings/{item_id}")
def delete_learning(item_id: str):
    data = load_data()
    # Filter out the item with the given ID
    new_data = [item for item in data if item["id"] != item_id]
    
    if len(new_data) == len(data):
        raise HTTPException(status_code=404, detail="Item not found")
        
    save_data(new_data)
    return {"message": "Item deleted successfully"}

@app.put("/api/learnings/{item_id}")
def update_learning_content(item_id: str, learning_update: LearningItem):
    data = load_data()
    for item in data:
        if item["id"] == item_id:
            item["content"] = learning_update.content
            save_data(data)
            return {"message": "Content updated", "item": item}
    raise HTTPException(status_code=404, detail="Item not found")

@app.get("/api/reminders")
def get_reminders(date: str = None):
    # If date is not provided, use today. Format YYYY-MM-DD
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    
    data = load_data()
    reminders = []
    for item in data:
        if item.get("recap_dates") and date in item["recap_dates"]:
            reminders.append(item)
    return reminders

# Use the scheduler functional module
@app.get("/api/schedule")
def get_future_schedule():
    return scheduler.get_future_plans()

@app.post("/api/chat-plan", response_model=ChatResponse)
async def chat_about_plan(request: ChatRequest):
    """
    Interactive chat with ChatGPT about planning
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured. Please set OPENAI_API_KEY in .env file")
    
    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)
    
    # System message for the planning assistant
    today = datetime.now().strftime("%Y-%m-%d")
    system_message = {
        "role": "system",
        "content": f"""You are a helpful productivity and planning assistant. Today's date is {today}. Help users break down their tasks and projects into manageable daily plans. 
        
Be conversational and ask clarifying questions if needed. Consider:
- The complexity and scope of the task
- Available time until deadline
- Natural workflow and dependencies
- User's preferences and constraints
- The current date ({today}) when calculating timelines

Engage in a natural conversation to understand their needs before suggesting a plan."""
    }
    
    # Convert request messages to OpenAI format
    messages = [system_message]
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})
    
    try:
        # Call OpenAI API
        response = client.chat.completions.create(
            model=request.model,
            messages=messages,
            temperature=0.7,
        )
        
        # Return the assistant's response
        return ChatResponse(message=response.choices[0].message.content)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to chat with AI: {str(e)}")

@app.post("/api/extract-plan", response_model=PhasedPlanResponse)
async def extract_plan_from_conversation(request: ExtractPlanRequest):
    """
    Extract a structured plan from the conversation
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured. Please set OPENAI_API_KEY in .env file")
    
    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)
    
    # Calculate number of days available
    start_dt = datetime.strptime(request.start_date, "%Y-%m-%d")
    deadline_dt = datetime.strptime(request.deadline, "%Y-%m-%d")
    days_available = (deadline_dt - start_dt).days + 1
    
    if days_available <= 0:
        raise HTTPException(status_code=400, detail="Deadline must be after start date")
    
    # Build conversation context
    conversation_text = "\n".join([f"{msg.role}: {msg.content}" for msg in request.conversation])
    
    # Create extraction prompt
    extraction_prompt = f"""Based on the following conversation about planning a task, create a detailed structured plan.

Conversation:
{conversation_text}

Start Date: {request.start_date}
Deadline: {request.deadline}
Days Available: {days_available}

Create a structured plan that breaks down the discussed task into daily steps. Return ONLY a JSON object with this exact structure:

{{
  "plans": [
    {{
      "date": "YYYY-MM-DD",
      "section": "morning|afternoon|evening",
      "tasks": ["task 1", "task 2", ...]
    }},
    ...
  ]
}}

Guidelines:
- Use specific, actionable task descriptions based on our conversation
- Distribute work across the available days
- Each time period (morning/afternoon/evening) should have 1-3 tasks maximum
- Consider natural workflow and dependencies we discussed
- Ensure all work is completed before the deadline
- Return ONLY valid JSON, no additional text"""
    
    try:
        # Call OpenAI API
        today_str = datetime.now().strftime("%Y-%m-%d")
        response = client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": f"You are a planning assistant that extracts structured plans from conversations. Today's date is {today_str}. Always respond with valid JSON only."},
                {"role": "user", "content": extraction_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        # Parse the response
        result_text = response.choices[0].message.content
        result_json = json.loads(result_text)
        
        # Validate and return
        return PhasedPlanResponse(**result_json)
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract monthly plan: {str(e)}")


@app.post("/api/extract-monthly-goals", response_model=PhasedPlanResponse)
async def extract_monthly_goals_from_conversation(request: ExtractPlanRequest):
    """
    Extract a monthly goals plan from the conversation (for monthly view)
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured. Please set OPENAI_API_KEY in .env file")
    
    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)
    
    # Build conversation context
    conversation_text = "\n".join([f"{msg.role}: {msg.content}" for msg in request.conversation])
    
    # Create extraction prompt for monthly goals
    extraction_prompt = f"""Based on the following conversation about planning monthly goals, create a list of key tasks and goals for EACH month in the period.

Conversation:
{conversation_text}

Period: {request.start_date} to {request.deadline}

Create a structured plan containing the main goals for each month.
Return ONLY a JSON object with this exact structure:

{{
  "plans": [
    {{
      "date": "YYYY-MM",
      "section": "goals",
      "tasks": ["goal 1", "goal 2", ...]
    }},
    {{
      "date": "YYYY-MM+1",
      "section": "goals",
      "tasks": ["...", ...]
    }}
  ]
}}

Guidelines:
- Output a plan block for EACH month in the period (if applicable)
- Identify 3-7 key goals/tasks per month based on the conversation
- Use the format "YYYY-MM" for the date (e.g. "2026-01", "2026-02")
- Set section to "goals"
- Return ONLY valid JSON"""
    
    try:
        # Call OpenAI API
        today_str = datetime.now().strftime("%Y-%m-%d")
        response = client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": f"You are a planning assistant that extracts structured monthly plans from conversations. Today's date is {today_str}. Always respond with valid JSON only."},
                {"role": "user", "content": extraction_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        # Parse the response
        result_text = response.choices[0].message.content
        result_json = json.loads(result_text)
        
        return PhasedPlanResponse(**result_json)
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract monthly goals: {str(e)}")


@app.post("/api/extract-weekly-breakdown", response_model=PhasedPlanResponse)
async def extract_weekly_breakdown_from_conversation(request: ExtractPlanRequest):
    """
    Extract a weekly breakdown plan from the conversation (breaking down a monthly task)
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured. Please set OPENAI_API_KEY in .env file")
    
    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)
    
    # Build conversation context
    conversation_text = "\n".join([f"{msg.role}: {msg.content}" for msg in request.conversation])
    
    # Create extraction prompt for weekly breakdown
    extraction_prompt = f"""Based on the following conversation about breaking down a monthly task, create a detailed weekly breakdown plan.

Conversation:
{conversation_text}

Period: {request.start_date} to {request.deadline}

Create a structured plan that breaks down the discussed monthly task into weekly milestones.
Return ONLY a JSON object with this exact structure:

{{
  "plans": [
    {{
      "date": "Week 1",
      "section": "weekly",
      "tasks": ["task 1", "task 2", ...]
    }},
    {{
      "date": "Week 2",
      "section": "weekly",
      "tasks": ["task 1", "task 2", ...]
    }}
    ...
  ]
}}

Guidelines:
- Identify 2-4 key tasks/milestones for each week
- Use "Week 1", "Week 2", "Week 3", etc. as the date field
- Set section to "weekly"
- Distribute work evenly across the available weeks (as mentioned in conversation)
- Return ONLY valid JSON"""
    
    try:
        # Call OpenAI API
        today_str = datetime.now().strftime("%Y-%m-%d")
        response = client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": f"You are a planning assistant that extracts structured weekly plans from conversations. Today's date is {today_str}. Always respond with valid JSON only."},
                {"role": "user", "content": extraction_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        # Parse the response
        result_text = response.choices[0].message.content
        result_json = json.loads(result_text)
        
        return PhasedPlanResponse(**result_json)
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract weekly breakdown: {str(e)}")


@app.post("/api/extract-daily-breakdown", response_model=PhasedPlanResponse)
async def extract_daily_breakdown_from_conversation(request: ExtractPlanRequest):
    """
    Extract a daily breakdown plan from the conversation (breaking down a weekly task)
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured. Please set OPENAI_API_KEY in .env file")
    
    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)
    
    # Build conversation context
    conversation_text = "\n".join([f"{msg.role}: {msg.content}" for msg in request.conversation])
    
    # Create extraction prompt for daily breakdown
    extraction_prompt = f"""Based on the following conversation about breaking down a weekly task, create a detailed daily breakdown plan.

Conversation:
{conversation_text}

Period: {request.start_date} to {request.deadline}

Create a structured plan that breaks down the discussed weekly task into daily actions.
Return ONLY a JSON object with this exact structure:

{{
  "plans": [
    {{
      "date": "YYYY-MM-DD",
      "section": "daily",
      "tasks": ["task 1", "task 2", ...]
    }},
    ...
  ]
}}

Guidelines:
- Identify 1-3 key tasks/actions for relevant days
- Use specific dates (YYYY-MM-DD) within the week range provided
- Set section to "daily"
- Distribute work logically across the week
- Return ONLY valid JSON"""
    
    try:
        # Call OpenAI API
        today_str = datetime.now().strftime("%Y-%m-%d")
        response = client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": f"You are a planning assistant that extracts structured daily plans from conversations. Today's date is {today_str}. Always respond with valid JSON only."},
                {"role": "user", "content": extraction_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        # Parse the response
        result_text = response.choices[0].message.content
        result_json = json.loads(result_text)
        
        return PhasedPlanResponse(**result_json)
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract daily breakdown: {str(e)}")


@app.post("/api/extract-daily-subtasks", response_model=PhasedPlanResponse)
async def extract_daily_subtasks_from_conversation(request: ExtractPlanRequest):
    """
    Extract a section-based breakdown plan from the conversation (breaking down a Whole Day task into Morning/Afternoon/Evening)
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured. Please set OPENAI_API_KEY in .env file")
    
    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)
    
    # Build conversation context
    conversation_text = "\n".join([f"{msg.role}: {msg.content}" for msg in request.conversation])
    
    # Create extraction prompt for daily subtasks
    extraction_prompt = f"""Based on the following conversation about breaking down a daily task, distribute the work across daily sections (Morning, Afternoon, Evening).

Conversation:
{conversation_text}

Date: {request.start_date}

Create a structured plan that breaks down the task.
Return ONLY a JSON object with this exact structure:

{{
  "plans": [
    {{
      "date": "{request.start_date}",
      "section": "morning",
      "tasks": ["task 1", "task 2"]
    }},
    {{
      "date": "{request.start_date}",
      "section": "afternoon",
      "tasks": ["task 3"]
    }},
    ...
  ]
}}

Guidelines:
- Sections must be exactly: "morning", "afternoon", or "evening"
- Identify actionable steps fitting for the time of day
- Return ONLY valid JSON"""
    
    try:
        # Call OpenAI API
        today_str = datetime.now().strftime("%Y-%m-%d")
        response = client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": f"You are a planning assistant that extracts structured section plans. Today's date is {today_str}. Always respond with valid JSON only."},
                {"role": "user", "content": extraction_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        # Parse the response
        result_text = response.choices[0].message.content
        result_json = json.loads(result_text)
        
        return PhasedPlanResponse(**result_json)
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract subtasks: {str(e)}")


@app.post("/api/extract-monthly-plan", response_model=PhasedPlanResponse)
async def extract_monthly_plan_from_conversation(request: ExtractPlanRequest):
    """
    Extract a monthly breakdown plan from the conversation (for yearly goals)
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured. Please set OPENAI_API_KEY in .env file")
    
    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)
    
    # Build conversation context
    conversation_text = "\n".join([f"{msg.role}: {msg.content}" for msg in request.conversation])
    
    # Create extraction prompt for monthly breakdown
    extraction_prompt = f"""Based on the following conversation about breaking down a yearly goal, create a detailed monthly breakdown plan.

Conversation:
{conversation_text}

Start Date: {request.start_date}
Deadline: {request.deadline}

Create a structured plan that breaks down the discussed yearly goal into monthly milestones. For each month between the start date and deadline, identify 2-5 key tasks or milestones.

Return ONLY a JSON object with this exact structure:

{{
  "plans": [
    {{
      "date": "YYYY-MM-01",
      "section": "monthly",
      "tasks": ["task 1", "task 2", ...]
    }},
    ...
  ]
}}

Guidelines:
- Use the first day of each month for the date (e.g., "2026-01-01", "2026-02-01")
- Set section to "monthly" for all entries
- Each month should have 2-5 specific, actionable tasks based on our conversation
- Ensure the plan covers the entire period from start to deadline
- Return ONLY valid JSON, no additional text"""
    
    try:
        # Call OpenAI API
        today_str = datetime.now().strftime("%Y-%m-%d")
        response = client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": f"You are a planning assistant that extracts structured monthly plans from conversations. Today's date is {today_str}. Always respond with valid JSON only."},
                {"role": "user", "content": extraction_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        # Parse the response
        result_text = response.choices[0].message.content
        result_json = json.loads(result_text)
        
        # Validate and return
        return PhasedPlanResponse(**result_json)
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract monthly plan: {str(e)}")


# ============================================
# Planning Data CRUD Endpoints
# ============================================

@app.get("/api/planning", response_model=PlanningData)
def get_all_planning_data():
    """Get all planning data (daily, weekly, monthly, yearly plans and task groups)"""
    return load_planning_data()

@app.get("/api/planning/{plan_type}")
def get_planning_by_type(plan_type: str):
    """Get specific planning data by type (dailyPlans, weeklyPlans, monthlyPlans, yearlyPlans, taskGroups, etc.)"""
    data = load_planning_data()
    if plan_type not in data:
        raise HTTPException(status_code=404, detail=f"Planning type '{plan_type}' not found")
    return {plan_type: data[plan_type]}

@app.post("/api/planning/{plan_type}")
def add_plan_item(plan_type: str, item: dict):
    """Add a new plan item to a specific planning type"""
    data = load_planning_data()
    if plan_type not in data:
        raise HTTPException(status_code=404, detail=f"Planning type '{plan_type}' not found")
    
    data[plan_type].append(item)
    save_planning_data(data)
    return {"message": f"Item added to {plan_type}", "item": item}

@app.put("/api/planning/{plan_type}")
def update_planning_type(plan_type: str, items: List[dict]):
    """Replace all items in a specific planning type"""
    data = load_planning_data()
    if plan_type not in data:
        raise HTTPException(status_code=404, detail=f"Planning type '{plan_type}' not found")
    
    data[plan_type] = items
    save_planning_data(data)
    return {"message": f"{plan_type} updated successfully", "count": len(items)}

@app.patch("/api/planning/{plan_type}/{item_id}")
def update_plan_item(plan_type: str, item_id: str, updates: dict):
    """Update a specific plan item"""
    data = load_planning_data()
    if plan_type not in data:
        raise HTTPException(status_code=404, detail=f"Planning type '{plan_type}' not found")
    
    items = data[plan_type]
    for item in items:
        if item.get("id") == item_id:
            item.update(updates)
            save_planning_data(data)
            return {"message": "Item updated", "item": item}
    
    raise HTTPException(status_code=404, detail="Item not found")

@app.delete("/api/planning/{plan_type}/{item_id}")
def delete_plan_item(plan_type: str, item_id: str):
    """Delete a specific plan item"""
    data = load_planning_data()
    if plan_type not in data:
        raise HTTPException(status_code=404, detail=f"Planning type '{plan_type}' not found")
    
    original_count = len(data[plan_type])
    data[plan_type] = [item for item in data[plan_type] if item.get("id") != item_id]
    
    if len(data[plan_type]) == original_count:
        raise HTTPException(status_code=404, detail="Item not found")
    
    save_planning_data(data)
    return {"message": "Item deleted successfully"}

@app.put("/api/planning")
def update_all_planning_data(planning_data: PlanningData):
    """Replace all planning data"""
    save_planning_data(planning_data.dict())
    return {"message": "All planning data updated successfully"}
